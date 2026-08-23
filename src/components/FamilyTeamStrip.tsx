import { Icon } from "@/components/Icons";
import { Ring } from "@/components/ui/Progress";
import { familyPoints, familyProgress, familySkillsTotal } from "@/lib/gamification";
import type { AppData } from "@/lib/types";
import { children } from "@/lib/utils";

/**
 * De gedeelde score van het gezin — niet per kind, geen ranglijst. Dezelfde
 * cijfers op /ouder/gezin en /kind/samen: het team ziet hetzelfde team-resultaat.
 */
export function FamilyTeamStrip({ data }: { data: AppData }) {
  const kidCount = children(data).length;
  const progress = familyProgress(data);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <Ring value={progress.done} max={Math.max(progress.total, 1)} size={40} tone="progress" />
        <div className="min-w-0">
          <p className="font-mono text-lg font-semibold leading-none text-ink">
            {progress.done}/{progress.total}
          </p>
          <p className="mt-1 text-xs text-muted">vandaag samen</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-sand-light p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
          <Icon name="spark" className="h-4 w-4 text-accent" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-lg font-semibold leading-none text-ink">{familyPoints(data)}</p>
          <p className="mt-1 text-xs text-muted">Family Points</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-sage-light p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface">
          <Icon name="heart" className="h-4 w-4 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-lg font-semibold leading-none text-ink">{familySkillsTotal(data)}</p>
          <p className="mt-1 text-xs text-muted">Family Skills{kidCount > 1 ? ", samen" : ""}</p>
        </div>
      </div>
    </div>
  );
}
