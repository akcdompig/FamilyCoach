import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: "surface" | "sage" | "sand" | "accent" | "progress" | "outline" | "hero";
  padded?: boolean;
}

const TONES = {
  surface: "bg-surface border border-line/80 shadow-soft",
  sage: "bg-sage-light border border-sage-dark/40",
  sand: "bg-sand-light border border-sand",
  accent: "bg-accent-soft border border-accent/20",
  progress: "bg-progress-soft border border-progress/20",
  outline: "bg-transparent border border-dashed border-line",
  /** Donkere dashboard-samenvatting: ring + sterren-waardering (Today/Grow/Family-overzicht). */
  hero: "bg-gradient-to-br from-navy-dark to-navy text-white border-none shadow-lift",
};

export function Card({ children, tone = "surface", padded = true, className, ...rest }: CardProps) {
  return (
    <div className={cx("rounded-3xl", TONES[tone], padded && "p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">{children}</h2>
      {action}
    </div>
  );
}
