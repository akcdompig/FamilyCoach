"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/Icons";
import type { FlowInsight } from "@/lib/ai/insights";
import { cx } from "@/lib/utils";

const TONE_STYLE: Record<FlowInsight["tone"], { card: string; icon: IconName; iconClass: string }> = {
  celebrate: { card: "border-sage-dark/40 bg-sage-light", icon: "flame", iconClass: "text-primary" },
  reflect: { card: "border-sand bg-sand-light", icon: "target", iconClass: "text-accent-dark" },
  plan: { card: "border-progress/20 bg-progress-soft", icon: "sun", iconClass: "text-progress-dark" },
};

/**
 * FLOW's inzicht-kaart — bewust géén chatbubble. Eén contextueel moment,
 * hooguit één link naar een bestaand scherm, altijd wegklikbaar.
 */
export function FlowInsightCard({ insight, onDismiss }: { insight: FlowInsight; onDismiss: () => void }) {
  const style = TONE_STYLE[insight.tone];
  return (
    <div className={cx("mb-6 animate-fade-up rounded-3xl border p-5", style.card)}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">
          <Icon name={style.icon} className={cx("h-4 w-4", style.iconClass)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">{insight.title}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{insight.message}</p>
          <div className="mt-3 flex items-center gap-4">
            {insight.href ? (
              <Link href={insight.href} className="text-sm font-semibold text-primary hover:underline">
                {insight.linkLabel ?? "Bekijken"}
              </Link>
            ) : null}
            <button type="button" onClick={onDismiss} className="text-sm text-muted hover:text-ink hover:underline">
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
