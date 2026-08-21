import { Card } from "@/components/ui/Card";
import { FlowMark } from "@/components/FlowMark";

interface Props {
  stats: { tasksDone: number; tasksTotal: number; checkIns: number; movementDays: number; activities: number };
  insight: string;
}

export function WeeklyInsight({ stats, insight }: Props) {
  const rows = [
    { label: "Afspraken", value: `${stats.tasksDone}/${stats.tasksTotal}` },
    { label: "Check-ins", value: `${stats.checkIns}` },
    { label: "Beweging", value: `${stats.movementDays} dagen` },
    { label: "Samen", value: `${stats.activities}` },
  ];

  return (
    <Card>
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Deze week</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-sm text-muted">{row.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight text-ink">{row.value}</dd>
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
