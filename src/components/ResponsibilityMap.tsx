import { Icon } from "@/components/Icons";
import { Avatar } from "@/components/ui/Avatar";
import type { AppData, Category, Person, Task } from "@/lib/types";
import { CATEGORY_ICON, CATEGORY_LABEL, WEEKDAYS, cx, isDone } from "@/lib/utils";

const FAMILY_CATEGORIES: Category[] = ["huishouden", "samen"];

interface Props {
  data: AppData;
  people: Person[];
  /** Vandaag-status tonen — alleen in ouder-context; op het kindscherm blijft dit puur eigendom, geen onderlinge surveillance. */
  showStatus?: boolean;
}

function schedulePattern(task: Task): string {
  if (task.days.length === 7) return "elke dag";
  return WEEKDAYS.filter((w) => task.days.includes(w.index))
    .map((w) => w.short)
    .join(" ");
}

/** Wie doet wat thuis — een visuele kaart in plaats van een saaie tabel. */
export function ResponsibilityMap({ data, people, showStatus = false }: Props) {
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const responsibilities = data.tasks.filter(
    (t) => t.active && peopleById.has(t.personId) && (FAMILY_CATEGORIES.includes(t.category) || t.shared),
  );

  if (responsibilities.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-surface/60 px-4 py-6 text-center text-sm text-muted">
        Nog geen gedeelde verantwoordelijkheden ingesteld.
      </p>
    );
  }

  const grouped = responsibilities.reduce<Record<string, Task[]>>((acc, task) => {
    acc[task.category] = [...(acc[task.category] ?? []), task];
    return acc;
  }, {});

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(grouped).map(([category, tasks]) => (
        <div key={category} className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">
            <Icon name={CATEGORY_ICON[category as Category]} className="h-3.5 w-3.5" />
            {CATEGORY_LABEL[category as Category]}
          </p>
          <div className="space-y-3">
            {tasks.map((task) => {
              const owner = peopleById.get(task.personId);
              const done = showStatus && isDone(data, task.id);
              return (
                <div key={task.id} className="flex items-center gap-2.5">
                  {owner ? <Avatar name={owner.name} color={owner.color} size="sm" avatarVariant={owner.avatarVariant} /> : null}
                  <div className="min-w-0 flex-1">
                    <p className={cx("truncate text-sm font-medium", done ? "text-muted line-through" : "text-ink")}>
                      {task.title}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {owner?.name ?? "?"} · {schedulePattern(task)}
                    </p>
                  </div>
                  {showStatus ? (
                    <span
                      className={cx("h-2 w-2 shrink-0 rounded-full", done ? "bg-primary" : "bg-line")}
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
