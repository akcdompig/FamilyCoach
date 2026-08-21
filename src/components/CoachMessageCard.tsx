"use client";

import { Button } from "@/components/ui/Button";
import { FlowMark } from "@/components/FlowMark";
import type { CoachMessage } from "@/lib/types";
import { cx } from "@/lib/utils";

interface Props {
  message?: CoachMessage;
  loading?: boolean;
  onSuggestion?: (suggestion: string) => void;
  onDismiss?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function CoachMessageCard({
  message,
  loading,
  onSuggestion,
  onDismiss,
  onRefresh,
  className,
}: Props) {
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-light via-surface to-sand-light p-5 shadow-soft ring-1 ring-sage-dark/40",
        className,
      )}
      aria-label="Bericht van Flow"
    >
      <div className="flex gap-4">
        <FlowMark size={44} calm={!loading} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-primary/70">Flow</p>
          {loading ? (
            <p className="mt-1.5 text-[17px] leading-relaxed text-muted">Even denken…</p>
          ) : message ? (
            <p className="mt-1.5 text-[17px] leading-relaxed text-ink animate-fade-up">{message.body}</p>
          ) : (
            <p className="mt-1.5 text-[17px] leading-relaxed text-muted">
              Het is nu rustig. Ik laat van me horen wanneer het nuttig is.
            </p>
          )}

          {message && message.suggestions.length > 0 && !message.answeredAt ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSuggestion?.(suggestion)}
                  className="rounded-full border border-primary/20 bg-surface px-3.5 py-1.5 text-sm font-medium text-primary-dark transition hover:border-primary/50 hover:bg-sage-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-3 text-sm">
            {onRefresh ? (
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
                Vraag Flow iets anders
              </Button>
            ) : null}
            {message && onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                Later
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
