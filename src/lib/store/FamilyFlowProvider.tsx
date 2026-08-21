"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getRepository } from "@/lib/db";
import { createDemoData, createEmptyData } from "@/lib/demo-data";
import { appendCoachEvent, handleCoachEvent } from "@/lib/coach/events";
import { forgetMemoryFact } from "@/lib/ai/memory";
import type {
  AppData,
  CoachMessage,
  ConflictReport,
  Mood,
  Person,
  PilotFeedback,
  ReadingEntry,
  Reminder,
  Settings,
  Task,
  VerificationStatus,
  WellnessKind,
} from "@/lib/types";
import { dateKey, isDone, uid } from "@/lib/utils";

interface FamilyFlowContextValue {
  data: AppData;
  activePerson: Person;
  setActivePerson: (personId: string) => void;
  update: (mutate: (draft: AppData) => void) => void;
  replaceAll: (next: AppData) => void;
  toggleTask: (taskId: string, personId: string) => boolean;
  addCheckIn: (personId: string, mood: Mood, note?: string) => void;
  addTask: (input: Omit<Task, "id" | "familyId" | "createdAt">) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  addPerson: (input: Omit<Person, "id" | "familyId" | "createdAt">) => Person;
  pushMessage: (message: Omit<CoachMessage, "id" | "familyId" | "createdAt">) => void;
  answerMessage: (messageId: string) => void;
  dismissMessage: (messageId: string) => void;
  redeemReward: (rewardId: string, personId: string) => void;
  toggleActivity: (activityId: string, personId: string) => void;
  addPilotFeedback: (entry: Omit<PilotFeedback, "id" | "createdAt">) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  loadDemo: () => void;
  startFresh: () => void;
  eraseEverything: () => void;
  logWellness: (personId: string, kind: WellnessKind, value: number, unit: string) => void;
  addReading: (entry: Omit<ReadingEntry, "id" | "familyId" | "createdAt" | "date">) => void;
  addConflict: (entry: Omit<ConflictReport, "id" | "familyId" | "createdAt">) => void;
  verifyTask: (taskId: string, status: VerificationStatus) => void;
  forgetMemory: (factId: string) => void;
  addReminder: (input: { personId: string; title: string; dueAt: string; createdBy?: Reminder["createdBy"] }) => void;
  removeReminder: (reminderId: string) => void;
  addPushSubscription: (personId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) => void;
  removePushSubscriptionByEndpoint: (endpoint: string) => void;
}

const FamilyFlowContext = createContext<FamilyFlowContextValue | null>(null);

function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 animate-breathe rounded-full bg-sage" />
          <span className="absolute inset-[6px] rounded-full bg-primary" />
        </div>
        <p className="text-sm text-muted">FamilyFlow wordt geladen…</p>
      </div>
    </div>
  );
}

export function FamilyFlowProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getRepository().load();
      if (cancelled) return;
      setData(stored ?? createDemoData());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced write-through naar de repository. Eén plek, geen scattered saves.
  useEffect(() => {
    if (!data) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void getRepository().save(data);
    }, 250);
  }, [data]);

  const update = useCallback((mutate: (draft: AppData) => void) => {
    setData((current) => {
      if (!current) return current;
      const draft: AppData = structuredClone(current);
      mutate(draft);
      return draft;
    });
  }, []);

  const value = useMemo<FamilyFlowContextValue | null>(() => {
    if (!data) return null;

    const activePerson =
      data.people.find((p) => p.id === data.activePersonId) ?? data.people[0] ?? {
        id: "unknown",
        familyId: data.family.id,
        name: "Gast",
        role: "parent" as const,
        color: "#315C4A",
        interests: [],
        createdAt: new Date().toISOString(),
      };

    return {
      data,
      activePerson,
      update,
      replaceAll: (next) => setData(next),
      setActivePerson: (personId) => update((d) => void (d.activePersonId = personId)),

      toggleTask: (taskId, personId) => {
        const key = dateKey();
        const wasDone = isDone(data, taskId, new Date());
        update((d) => {
          const existing = d.completions.findIndex((c) => c.taskId === taskId && c.date === key);
          if (existing >= 0) d.completions.splice(existing, 1);
          else
            d.completions.push({
              id: uid("cmp"),
              taskId,
              personId,
              date: key,
              completedAt: new Date().toISOString(),
            });
          if (!wasDone) {
            const event = appendCoachEvent(d, { personId, type: "TASK_COMPLETED" });
            const decision = handleCoachEvent({ user: d.people.find((person) => person.id === personId) ?? activePerson, family: d.family, event: event.type, context: d });
            if (decision.message) {
              d.messages.push({
                id: uid("msg"),
                familyId: d.family.id,
                personId,
                kind: "praise",
                body: decision.message,
                suggestions: [],
                source: "rules",
                createdAt: new Date().toISOString(),
              });
            }
          }
        });
        return !wasDone;
      },

      addCheckIn: (personId, mood, note) =>
        update((d) => {
          const key = dateKey();
          const index = d.checkIns.findIndex((c) => c.personId === personId && c.date === key);
          const entry = {
            id: uid("chk"),
            personId,
            date: key,
            mood,
            note,
            createdAt: new Date().toISOString(),
          };
          if (index >= 0) d.checkIns[index] = { ...d.checkIns[index], ...entry };
          else d.checkIns.push(entry);
          // Een check-in beantwoordt de openstaande vraag van de coach.
          d.messages = d.messages.map((m) =>
            m.personId === personId && m.kind === "checkin" && !m.answeredAt
              ? { ...m, answeredAt: new Date().toISOString() }
              : m,
          );
        }),

      addTask: (input) =>
        update((d) => {
          d.tasks.push({
            ...input,
            id: uid("task"),
            familyId: d.family.id,
            createdAt: new Date().toISOString(),
          });
        }),

      updateTask: (taskId, patch) =>
        update((d) => {
          const index = d.tasks.findIndex((t) => t.id === taskId);
          if (index >= 0) d.tasks[index] = { ...d.tasks[index], ...patch };
        }),

      removeTask: (taskId) =>
        update((d) => {
          d.tasks = d.tasks.filter((t) => t.id !== taskId);
          d.completions = d.completions.filter((c) => c.taskId !== taskId);
        }),

      addPerson: (input) => {
        const person: Person = {
          ...input,
          id: uid("per"),
          familyId: data.family.id,
          createdAt: new Date().toISOString(),
        };
        update((d) => void d.people.push(person));
        return person;
      },

      pushMessage: (message) =>
        update((d) => {
          d.messages.push({
            ...message,
            id: uid("msg"),
            familyId: d.family.id,
            createdAt: new Date().toISOString(),
          });
        }),

      answerMessage: (messageId) =>
        update((d) => {
          const index = d.messages.findIndex((m) => m.id === messageId);
          if (index >= 0) d.messages[index].answeredAt = new Date().toISOString();
        }),

      dismissMessage: (messageId) =>
        update((d) => {
          const index = d.messages.findIndex((m) => m.id === messageId);
          if (index >= 0) d.messages[index].dismissedAt = new Date().toISOString();
        }),

      redeemReward: (rewardId, personId) =>
        update((d) => {
          d.redemptions.push({
            id: uid("red"),
            rewardId,
            personId,
            date: dateKey(),
            status: "aangevraagd",
            createdAt: new Date().toISOString(),
          });
        }),

      toggleActivity: (activityId, personId) =>
        update((d) => {
          const activity = d.activities.find((a) => a.id === activityId);
          if (!activity) return;
          activity.completedBy = activity.completedBy.includes(personId)
            ? activity.completedBy.filter((id) => id !== personId)
            : [...activity.completedBy, personId];
          if (activity.completedBy.length > 1) appendCoachEvent(d, { personId, type: "FAMILY_ACTIVITY_COMPLETED" });
        }),

      addPilotFeedback: (entry) =>
        update((d) => {
          d.pilotFeedback.push({
            ...entry,
            id: uid("pilot"),
            createdAt: new Date().toISOString(),
          });
        }),

      updateSettings: (patch) => update((d) => void (d.settings = { ...d.settings, ...patch })),

      loadDemo: () =>
        setData(() => {
          const demo = createDemoData();
          demo.onboarded = true;
          return demo;
        }),

      startFresh: () => setData(createEmptyData()),

      eraseEverything: () => {
        void getRepository().clear();
        setData(createEmptyData());
      },
      logWellness: (personId, kind, value, unit) =>
        update((d) => {
          d.wellnessLogs = [
            ...(d.wellnessLogs ?? []),
            {
              id: uid("well"),
              familyId: d.family.id,
              personId,
              kind,
              value,
              unit,
              date: dateKey(),
              verification: "SELF_REPORTED",
              createdAt: new Date().toISOString(),
            },
          ];
          appendCoachEvent(d, { personId, type: kind === "water" ? "WATER_LOGGED" : kind === "fruit" ? "FRUIT_LOGGED" : `${kind.toUpperCase()}_LOGGED` });
        }),
      addReading: (entry) =>
        update((d) => {
          d.readingEntries = [
            ...(d.readingEntries ?? []),
            { ...entry, id: uid("read"), familyId: d.family.id, date: dateKey(), createdAt: new Date().toISOString() },
          ];
          appendCoachEvent(d, { personId: entry.personId, type: "READING_COMPLETED" });
        }),
      addConflict: (entry) =>
        update((d) => {
          d.conflicts = [...(d.conflicts ?? []), { ...entry, id: uid("conf"), familyId: d.family.id, createdAt: new Date().toISOString() }];
          appendCoachEvent(d, { personId: entry.personId, type: "CONFLICT_REPORTED" });
        }),
      verifyTask: (taskId, status) =>
        update((d) => {
          const task = d.tasks.find((item) => item.id === taskId);
          if (task) task.verification = status;
        }),
      forgetMemory: (factId) => update((d) => forgetMemoryFact(d, factId)),
      addReminder: ({ personId, title, dueAt, createdBy = "parent" }) =>
        update((d) => {
          d.reminders = [
            ...(d.reminders ?? []),
            {
              id: uid("rem"),
              familyId: d.family.id,
              personId,
              createdBy,
              title,
              dueAt,
              status: "pending",
              createdAt: new Date().toISOString(),
            },
          ];
        }),
      removeReminder: (reminderId) =>
        update((d) => {
          d.reminders = (d.reminders ?? []).filter((r) => r.id !== reminderId);
        }),
      addPushSubscription: (personId, subscription) =>
        update((d) => {
          const existing = d.pushSubscriptions ?? [];
          if (existing.some((s) => s.endpoint === subscription.endpoint)) return;
          d.pushSubscriptions = [
            ...existing,
            { id: uid("push"), personId, endpoint: subscription.endpoint, keys: subscription.keys, createdAt: new Date().toISOString() },
          ];
        }),
      removePushSubscriptionByEndpoint: (endpoint) =>
        update((d) => {
          d.pushSubscriptions = (d.pushSubscriptions ?? []).filter((s) => s.endpoint !== endpoint);
        }),
    };
  }, [data, update]);

  if (!value) return <BootScreen />;

  return <FamilyFlowContext.Provider value={value}>{children}</FamilyFlowContext.Provider>;
}

export function useFamilyFlow(): FamilyFlowContextValue {
  const context = useContext(FamilyFlowContext);
  if (!context) throw new Error("useFamilyFlow moet binnen FamilyFlowProvider gebruikt worden");
  return context;
}
