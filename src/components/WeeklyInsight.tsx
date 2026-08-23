import { Icon, type IconName } from "@/components/Icons";
import { Card } from "@/components/ui/Card";
import { FlowMark } from "@/components/FlowMark";

interface Props {
  stats: { tasksDone: number; tasksTotal: number; checkIns: number; movementDays: number; activities: number };
  insight: string;
}

export function WeeklyInsight({ stats, insight }: Props) {
  const rows: { label: string; value: string; icon: IconName }[] = [
    { label: "Afspraken", value: `${stats.tasksDone}/${stats.tasksTotal}`, icon: "list" },
    { label: "Check-ins", value: `${stats.checkIns}`, icon: "check" },
    { label: "Beweging", value: `${stats.movementDays} dagen`, icon: "activity" },
    { label: "Samen", value: `${stats.activities}`, icon: "heart" },
  ];

  return (
    <Card>
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Deze week</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-line bg-paper p-3">
            <Icon name={row.icon} className="h-4 w-4 text-primary" />
            <dd className="mt-2 font-mono text-xl font-semibold tabular-nums text-ink">{row.value}</dd>
            <dt className="mt-0.5 text-xs text-muted">{row.label}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-5 flex gap-3 rounded-2xl bg-sage-light p-4">
        <FlowMark size={28} calm />
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-primary/70">Flow&apos;s inzicht</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{insight}</p>
        </div>
      </div>
    </Card>
  );
}
