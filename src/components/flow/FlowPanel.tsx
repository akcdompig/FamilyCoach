"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ConfettiBurst, useConfetti } from "@/components/effects/ConfettiBurst";
import { AVATAR_STATE_LABEL, FlowAvatar } from "@/components/flow/FlowAvatar";
import { FlowChoices, ProgressDots } from "@/components/flow/FlowChoices";
import { Icon, type IconName } from "@/components/Icons";
import { flowProgress } from "@/lib/ai/flows/progress";
import { useFlowRuntime, type ProviderStatus } from "@/lib/flow/FlowRuntime";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { cx } from "@/lib/utils";

const PROVIDER_LABEL: Record<string, string> = {
  claude: "Claude",
  anthropic: "Claude",
  gemini: "Gemini",
  google: "Gemini",
  openai: "OpenAI",
};

const QUICK_ACTIONS: { flowId: "conflict-coach" | "activity-coach" | "free-chat"; label: string; icon: IconName; hint: string }[] = [
  { flowId: "conflict-coach", label: "Help me met een conflict", icon: "heart", hint: "Ruzie of iets vervelends uitpraten" },
  { flowId: "activity-coach", label: "Kies een activiteit voor mij", icon: "spark", hint: "Klein en haalbaar" },
  { flowId: "free-chat", label: "Praat gewoon even", icon: "chat", hint: "Vraag iets of vertel iets" },
];

export function FlowPanel({ variant = "sheet" }: { variant?: "sheet" | "dock" }) {
  const { session, render, busy, error, suggestion, providerStatus, startFlow, submit, endSession, closePanel } = useFlowRuntime();
  const { activePerson } = useFamilyFlow();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session?.turns.length, busy]);

  const avatarState = busy ? "thinking" : (render?.avatarState ?? "idle");
  const progress = session ? flowProgress(session.flowId, session.stepId) : null;
  const isActive = session?.status === "active";

  // Vanaf 13 wordt de viering rustiger — dezelfde erkenning, minder kinderlijk effectbetoon.
  const isTeen = (activePerson.age ?? 0) >= 13;
  const { trigger, fire } = useConfetti();
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (avatarState === "celebrating" && !celebratedRef.current) {
      celebratedRef.current = true;
      if (!isTeen) fire();
    }
    if (avatarState !== "celebrating") celebratedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarState, isTeen]);

  function submitText() {
    const value = text.trim();
    if (!value) return;
    setText("");
    void submit(value, value);
  }

  return (
    <div className={cx("flex h-full flex-col bg-surface", variant === "dock" ? "rounded-3xl border border-line shadow-soft" : "")}>
      <ConfettiBurst trigger={trigger} />
      <header className="flex items-center justify-between gap-3 border-b border-line bg-gradient-to-r from-sage-light/60 to-transparent px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <FlowAvatar state={avatarState} size={40} />
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">Flow</p>
            <p className="truncate text-xs text-muted">{AVATAR_STATE_LABEL[avatarState]}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ProviderBadge status={providerStatus} />
          {session ? (
            <button type="button" onClick={endSession} className="text-xs font-medium text-muted hover:text-ink hover:underline">
              Nieuw gesprek
            </button>
          ) : null}
          {variant === "sheet" ? (
            <button
              type="button"
              onClick={closePanel}
              aria-label="Flow sluiten"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-sage-light hover:text-ink"
            >
              ✕
            </button>
          ) : null}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!session ? (
          <IdleScreen onQuickStart={(flowId) => void startFlow(flowId)} suggestionMessage={suggestion?.message} />
        ) : (
          <>
            <AnimatePresence initial={false}>
              {session.turns.map((turn) => (
                <motion.div
                  key={turn.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className={cx("flex flex-col gap-1", turn.speaker === "user" && "items-end")}
                >
                  <div className={cx("flex gap-2.5", turn.speaker === "user" && "flex-row-reverse")}>
                    {turn.speaker === "flow" ? <FlowAvatar state="idle" size={28} className="mt-0.5" /> : null}
                    <div
                      className={cx(
                        "max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed shadow-[0_1px_1px_rgba(29,41,35,0.03)]",
                        turn.speaker === "flow" ? "bg-sage-light text-ink" : "bg-primary text-white",
                      )}
                    >
                      {turn.text}
                    </div>
                  </div>
                  {turn.speaker === "flow" && turn.source ? (
                    <span className="pl-[38px]">
                      <SourceBadge source={turn.source} />
                    </span>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
            {busy ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2.5 pl-[38px] text-sm text-muted"
              >
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary/60 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary/60 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary/60 [animation-delay:300ms]" />
                </span>
              </motion.div>
            ) : null}
          </>
        )}
        {error ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger-dark">{error}</p> : null}
      </div>

      {session && isActive ? (
        <footer className="border-t border-line px-4 py-3.5">
          {progress ? <div className="mb-3"><ProgressDots index={progress.index} total={progress.total} /></div> : null}
          {!busy && render ? (
            render.inputType === "text" ? (
              <div className="flex items-end gap-2">
                <textarea
                  autoFocus
                  rows={2}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitText();
                    }
                  }}
                  placeholder={render.placeholder ?? "Typ hier..."}
                  className="field min-h-[44px] flex-1 resize-none"
                />
                <button
                  type="button"
                  onClick={submitText}
                  disabled={!text.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white transition hover:bg-primary-dark disabled:opacity-40"
                  aria-label="Versturen"
                >
                  →
                </button>
              </div>
            ) : (
              <FlowChoices
                choices={render.choices ?? []}
                emphasize={render.inputType === "challenge"}
                onSelect={(id, label) => void submit(id, label)}
              />
            )
          ) : null}
        </footer>
      ) : null}

      {session && !isActive ? (
        <footer className="border-t border-line px-4 py-3.5">
          <button
            type="button"
            onClick={endSession}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-sage-light"
          >
            Terug naar het begin
          </button>
        </footer>
      ) : null}

      <p className="border-t border-line px-4 py-2 text-center text-[11px] leading-relaxed text-muted">
        Gesprekken met Flow zijn privé, tenzij het om je veiligheid gaat — dan betrekt Flow een vertrouwde volwassene.{" "}
        <span className="whitespace-nowrap">Actief als {activePerson.name}</span>
      </p>
    </div>
  );
}

/** Altijd-zichtbaar antwoord op "gebruikt Flow nu echt AI?" — zie ook de per-bericht SourceBadge. */
function ProviderBadge({ status }: { status: ProviderStatus | null }) {
  if (!status) {
    return <span className="h-2 w-2 animate-pulse-soft rounded-full bg-line" aria-label="Status laden" />;
  }
  const label = status.configured ? (PROVIDER_LABEL[status.provider] ?? status.provider) : "Regelgebaseerd";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        status.configured ? "bg-sage text-primary-dark" : "bg-sand text-ink/70",
      )}
      title={status.configured ? `Flow gebruikt nu ${label} voor AI-antwoorden.` : "Geen AI-provider geconfigureerd — Flow gebruikt vaste sjablonen."}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", status.configured ? "bg-primary" : "bg-muted")} />
      {label}
    </span>
  );
}

/** Per-bericht label, zodat je nooit hoeft te gokken of dít antwoord AI of een sjabloon was. */
function SourceBadge({ source }: { source: "ai" | "rules" }) {
  if (source === "ai") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-dark/70">
        <Icon name="spark" className="h-3 w-3" />
        AI-antwoord
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
      <Icon name="list" className="h-3 w-3" />
      Standaardantwoord
    </span>
  );
}

function IdleScreen({
  onQuickStart,
  suggestionMessage,
}: {
  onQuickStart: (flowId: "conflict-coach" | "activity-coach" | "free-chat") => void;
  suggestionMessage?: string;
}) {
  const { providerStatus } = useFlowRuntime();
  return (
    <div className="flex h-full flex-col justify-center gap-5 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <FlowAvatar state={suggestionMessage ? "coaching" : "idle"} size={64} />
        <p className="max-w-[26ch] text-[15px] leading-relaxed text-ink">
          {suggestionMessage ?? "Hey, ik ben Flow. Waar kan ik je mee helpen?"}
        </p>
        <ProviderBadge status={providerStatus} />
      </div>
      <div className="space-y-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.flowId}
            type="button"
            onClick={() => onQuickStart(action.flowId)}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:border-sage-dark hover:bg-sage-light active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-light">
              <Icon name={action.icon} className="h-4 w-4 text-primary" />
            </span>
            <span>
              <span className="block text-[14.5px] font-medium text-ink">{action.label}</span>
              <span className="block text-xs text-muted">{action.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
