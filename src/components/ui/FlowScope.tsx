import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

/**
 * Eén van FamilyFlow's kernonderscheidingen: "Mijn Flow" (persoonlijk — mijn
 * afspraken, mijn voortgang) versus "Ons Flow" (gedeeld — samen gepland,
 * samen gedaan). Dezelfde kleine label-stijl overal, zodat de twee "modi"
 * herkenbaar blijven waar dit onderscheid ook terugkomt.
 */
export function FlowScope({ scope, children }: { scope: "mine" | "ours"; children: ReactNode }) {
  return (
    <p
      className={cx(
        "flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em]",
        scope === "mine" ? "text-primary" : "text-accent-dark",
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", scope === "mine" ? "bg-primary" : "bg-accent")} />
      {children}
    </p>
  );
}
