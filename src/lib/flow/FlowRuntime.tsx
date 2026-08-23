"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  classifyIntent,
  findMentionedPerson,
  mkTurn,
  newSession,
  renderCurrentStep,
  submitToStep,
  type FlowDefinition,
  type StepContext,
  type StepRender,
} from "@/lib/ai/conversation";
import { FLOW_REGISTRY } from "@/lib/ai/flows";
import { checkNoActivity, findDueFollowUp, findDueReminder, findPendingActivity } from "@/lib/ai/agent";
import { computeFlowInsight, type FlowInsight } from "@/lib/ai/insights";
import { appendCoachEvent } from "@/lib/coach/events";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { AppData, ConversationFlowId, ConversationSession, Person } from "@/lib/types";

export interface ProviderStatus {
  provider: string;
  configured: boolean;
}

const AUTO = "__auto__";
const MAX_STORED_SESSIONS = 30;

async function callFlowApi<T>(task: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/flow", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ task, ...payload }),
  });
  if (!res.ok) throw new Error(`api/flow ${res.status}`);
  return (await res.json()) as T;
}

function buildCtx(draft: AppData, person: Person, session: ConversationSession): StepContext {
  return {
    data: draft,
    person,
    session,
    mutate: (fn) => fn(draft),
    setAnswer: (key, value) => void (session.answers[key] = value),
    setMeta: (key, value) => void (session.meta[key] = value),
    callServer: (task, payload) => callFlowApi(task, payload),
  };
}

/** Rendert de huidige stap en loopt automatisch door bij stappen zonder input (inputType "none"). */
async function renderLoop(flow: FlowDefinition, ctx: StepContext): Promise<StepRender | null> {
  let stepId: string | null = ctx.session.stepId;
  while (stepId) {
    ctx.session.stepId = stepId;
    const stepRender = await flow.steps[stepId].render(ctx);
    ctx.session.turns.push(mkTurn("flow", stepRender.text, stepRender.choices, stepRender.source));
    if (stepRender.inputType !== "none") return stepRender;
    stepId = submitToStep(flow, ctx, AUTO);
  }
  ctx.session.status = "completed";
  ctx.session.completedAt = new Date().toISOString();
  return null;
}

function trimConversations(draft: AppData): void {
  const all = [...(draft.conversations ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  draft.conversations = all.slice(0, MAX_STORED_SESSIONS);
}

export interface FlowSuggestion {
  flowId: ConversationFlowId;
  entryStepId?: string;
  meta: Record<string, string>;
  message: string;
  markPrompted?: boolean;
}

interface FlowRuntimeValue {
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;
  session: ConversationSession | null;
  render: StepRender | null;
  busy: boolean;
  error: string | null;
  suggestion: FlowSuggestion | null;
  insight: FlowInsight | null;
  dismissInsight: () => void;
  providerStatus: ProviderStatus | null;
  startFlow: (flowId: ConversationFlowId, meta?: Record<string, string>, entryStepId?: string) => Promise<void>;
  submit: (input: string, displayLabel?: string) => Promise<void>;
  endSession: () => void;
}

const FlowRuntimeContext = createContext<FlowRuntimeValue | null>(null);

export function FlowRuntimeProvider({ children }: { children: ReactNode }) {
  const familyFlow = useFamilyFlow();
  const { data, activePerson, replaceAll } = familyFlow;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [render, setRender] = useState<StepRender | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/coach")
      .then((res) => res.json())
      .then((json: ProviderStatus) => {
        if (!cancelled) setProviderStatus(json);
      })
      .catch(() => {
        if (!cancelled) setProviderStatus({ provider: "none", configured: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const session = useMemo(
    () => (data.conversations ?? []).find((c) => c.id === activeSessionId) ?? null,
    [data.conversations, activeSessionId],
  );

  const suggestion = useMemo<FlowSuggestion | null>(() => {
    if (activePerson.role !== "child") return null;
    const now = new Date();

    const dueConflict = findDueFollowUp(data, activePerson, now);
    if (dueConflict) {
      const meta: Record<string, string> = { conflictId: dueConflict.id, withWhom: dueConflict.withWhom };
      return { flowId: "conflict-followup", meta, message: `Hoe ging het met ${dueConflict.withWhom}?` };
    }

    const dueReminder = findDueReminder(data, activePerson, now);
    if (dueReminder) {
      const meta: Record<string, string> = { reminderId: dueReminder.id, title: dueReminder.title };
      return { flowId: "reminder-check", meta, message: `⏰ ${dueReminder.title}` };
    }

    const pending = findPendingActivity(data, activePerson.id);
    if (pending) {
      const meta: Record<string, string> = {
        pendingActivityId: pending.id,
        activityLabel: pending.label,
        minutes: String(pending.minutes),
      };
      return { flowId: "activity-coach", entryStepId: "welcomeBack", meta, message: `Welkom terug! Hoe ging ${pending.label}?` };
    }

    const noActivity = checkNoActivity(data, activePerson, now);
    if (noActivity) {
      return { flowId: "activity-coach", meta: {} as Record<string, string>, message: noActivity.message ?? "", markPrompted: true };
    }

    return null;
  }, [data, activePerson]);

  // Alleen tonen als er geen urgentere gespreks-suggestie actief is — één moment per keer.
  const insight = useMemo<FlowInsight | null>(() => {
    if (suggestion) return null;
    return computeFlowInsight(data, activePerson);
  }, [data, activePerson, suggestion]);

  const dismissInsight = useCallback(() => {
    if (!insight) return;
    familyFlow.update((d) => void appendCoachEvent(d, { personId: activePerson.id, type: insight.id }));
  }, [insight, familyFlow, activePerson.id]);

  const startFlow = useCallback(
    async (flowId: ConversationFlowId, meta: Record<string, string> = {}, entryStepId?: string) => {
      setBusy(true);
      setError(null);
      try {
        const flow = FLOW_REGISTRY[flowId];
        const draft: AppData = structuredClone(data);
        const person = draft.people.find((p) => p.id === activePerson.id) ?? activePerson;
        const newConv = newSession(draft.family.id, person.id, flowId, entryStepId ?? flow.entryStepId, meta);
        draft.conversations = [...(draft.conversations ?? []), newConv];
        const ctx = buildCtx(draft, person, newConv);
        const result = await renderLoop(flow, ctx);
        trimConversations(draft);
        replaceAll(draft);
        setActiveSessionId(newConv.id);
        setRender(result);
      } catch (err) {
        console.error("[FamilyFlow] startFlow faalde:", err);
        setError("Flow kon nu niet reageren. Probeer het zo nog eens.");
      } finally {
        setBusy(false);
      }
    },
    [data, activePerson, replaceAll],
  );

  const submit = useCallback(
    async (input: string, displayLabel?: string) => {
      if (!session || busy) return;
      setBusy(true);
      setError(null);
      try {
        const draft: AppData = structuredClone(data);
        const person = draft.people.find((p) => p.id === activePerson.id) ?? activePerson;
        const draftSession = draft.conversations?.find((c) => c.id === session.id);
        if (!draftSession) return;

        // Speciaal geval: free-chat mag doorschakelen naar de conflict coach
        // wanneer de server dat voorstelde en het kind "Ja, help me" kiest.
        if (draftSession.flowId === "free-chat" && draftSession.meta.offerConflictCoach === "true") {
          const label = draftSession.meta[`choice_${input}`] ?? displayLabel ?? input;
          if (/ja,?\s*help/i.test(label)) {
            const mentioned = findMentionedPerson(draftSession.answers.lastMessage ?? "", draft.people);
            setBusy(false);
            await startFlow("conflict-coach", mentioned ? { withWhom: mentioned.name } : {});
            return;
          }
        }

        const flow = FLOW_REGISTRY[draftSession.flowId];
        draftSession.turns.push(mkTurn("user", displayLabel ?? input));
        const ctx = buildCtx(draft, person, draftSession);
        const nextStepId = submitToStep(flow, ctx, input);

        if (nextStepId === null) {
          draftSession.status = "completed";
          draftSession.completedAt = new Date().toISOString();
          draftSession.updatedAt = new Date().toISOString();
          const restart = draftSession.flowId === "conflict-followup" && draftSession.meta.restartConflictCoach === "true";
          const withWhom = draftSession.meta.withWhom;
          trimConversations(draft);
          replaceAll(draft);
          setRender(null);
          if (restart) {
            setBusy(false);
            await startFlow("conflict-coach", withWhom ? { withWhom } : {});
            return;
          }
          return;
        }

        draftSession.stepId = nextStepId;
        const result = await renderLoop(flow, ctx);
        draftSession.updatedAt = new Date().toISOString();
        trimConversations(draft);
        replaceAll(draft);
        setRender(result);
      } catch (err) {
        console.error("[FamilyFlow] submit faalde:", err);
        setError("Flow kon nu niet reageren. Probeer het zo nog eens.");
      } finally {
        setBusy(false);
      }
    },
    [session, busy, data, activePerson, replaceAll, startFlow],
  );

  const openPanel = useCallback(() => {
    setOpen(true);
    if (!session && suggestion) {
      if (suggestion.markPrompted) {
        familyFlow.update((d) => void appendCoachEvent(d, { personId: activePerson.id, type: "NO_ACTIVITY_PROMPTED" }));
      }
      void startFlow(suggestion.flowId, suggestion.meta, suggestion.entryStepId);
    }
  }, [session, suggestion, startFlow, familyFlow, activePerson.id]);

  const closePanel = useCallback(() => setOpen(false), []);

  const endSession = useCallback(() => {
    setActiveSessionId(null);
    setRender(null);
    setError(null);
  }, []);

  const value = useMemo<FlowRuntimeValue>(
    () => ({
      open,
      openPanel,
      closePanel,
      session,
      render,
      busy,
      error,
      suggestion,
      insight,
      dismissInsight,
      providerStatus,
      startFlow,
      submit,
      endSession,
    }),
    [
      open,
      openPanel,
      closePanel,
      session,
      render,
      busy,
      error,
      suggestion,
      insight,
      dismissInsight,
      providerStatus,
      startFlow,
      submit,
      endSession,
    ],
  );

  return <FlowRuntimeContext.Provider value={value}>{children}</FlowRuntimeContext.Provider>;
}

export function useFlowRuntime(): FlowRuntimeValue {
  const context = useContext(FlowRuntimeContext);
  if (!context) throw new Error("useFlowRuntime moet binnen FlowRuntimeProvider gebruikt worden");
  return context;
}

export { classifyIntent };
