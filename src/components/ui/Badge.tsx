import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

type Tone = "neutral" | "green" | "accent" | "muted";

const TONES: Record<Tone, string> = {
  neutral: "bg-sage-light text-primary-dark",
  green: "bg-sage text-primary-dark",
  accent: "bg-accent-soft text-accent-dark",
  muted: "bg-paper text-muted border border-line",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
