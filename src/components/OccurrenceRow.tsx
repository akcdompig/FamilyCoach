import { Icon } from "@/components/Icons";
import type { OccurrenceStatus, TaskOccurrence } from "@/lib/utils";
import { CATEGORY_ICON, cx } from "@/lib/utils";

export const STATUS_LABEL: Partial<Record<OccurrenceStatus, string>> = {
  overdue: "Te laat",
  postponed: "Verplaatst",
  "moved-in": "Verzet",
};

const STATUS_DOT: Record<OccurrenceStatus, string> = {
  completed: "bg-primary",
  overdue: "bg-danger",
  today: "bg-primary/50",
  postponed: "bg-line",
  "moved-in": "bg-progress",
  upcoming: "bg-line",
  past: "bg-line",
};

const STATUS_TEXT: Record<OccurrenceStatus, string> = {
  completed: "text-muted line-through",
  overdue: "text-ink",
  today: "text-ink",
  postponed: "text-muted line-through",
  "moved-in": "text-ink",
  upcoming: "text-ink",
  past: "text-muted",
};

/** Compacte, alleen-lezen rij voor de Plan week- en maandweergave — de interactieve TaskCard blijft voorbehouden aan vandaag. */
export function OccurrenceRow({ occ, className }: { occ: TaskOccurrence; className?: string }) {
  const label = STATUS_LABEL[occ.status];
  return (
    <div className={cx("flex items-center gap-1.5 py-0.5", className)}>
      <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[occ.status])} aria-hidden />
      <Icon name={CATEGORY_ICON[occ.task.category]} className="h-3.5 w-3.5 shrink-0 text-muted" />
      <span className={cx("min-w-0 flex-1 truncate text-[13px]", STATUS_TEXT[occ.status])}>{occ.task.title}</span>
      {occ.priority === "high" ? (
        <Icon name="spark" className="h-3 w-3 shrink-0 text-accent" aria-hidden />
      ) : null}
      {label ? <span className="shrink-0 text-[11px] text-muted">{label}</span> : null}
    </div>
  );
}
