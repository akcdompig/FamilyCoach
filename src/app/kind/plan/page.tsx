"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DayRhythm } from "@/components/DayRhythm";
import { OccurrenceRow } from "@/components/OccurrenceRow";
import { TaskCard } from "@/components/TaskCard";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Skeleton";
import { Ring } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { AppData, Category, Person } from "@/lib/types";
import {
  addDays,
  CATEGORY_LABEL,
  children,
  dateKey,
  daysInMonth,
  goalProgressFor,
  goalsLinkedToTask,
  isDone,
  minutesFromString,
  minutesNow,
  movedInTasks,
  occurrencesForDay,
  startOfMonth,
  startOfWeek,
  tasksForPerson,
  taskPriorityFor,
  WEEKDAYS,
  cx,
} from "@/lib/utils";

const TABS = [
  { id: "dag", label: "Dag" },
  { id: "week", label: "Week" },
  { id: "maand", label: "Maand" },
];

function weekdayShort(date: Date): string {
  return WEEKDAYS.find((w) => w.index === date.getDay())?.short ?? "";
}

function DayView({
  data,
  child,
}: {
  data: AppData;
  child: Person;
}) {
  const { toggleTask, postponeTask, skipTask, setTaskPriority } = useFamilyFlow();
  const toast = useToast();

  const today = new Date();
  const todayKey = dateKey(today);
  const tomorrowKey = dateKey(addDays(today, 1));

  const scheduled = tasksForPerson(data, child.id, today);
  const incoming = movedInTasks(data, child.id, today);
  const incomingIds = new Set(incoming.map((t) => t.id));
  const combined = [...scheduled, ...incoming].sort(
    (a, b) => minutesFromString(a.time ?? "23:59") - minutesFromString(b.time ?? "23:59"),
  );
  const now = minutesNow();
  const withStatus = combined.map((task) => {
    const done = isDone(data, task.id, today);
    return {
      task,
      done,
      priority: taskPriorityFor(data, task.id, child.id, today),
      moved: incomingIds.has(task.id),
      overdue: !done && Boolean(task.time) && minutesFromString(task.time as string) < now,
    };
  });
  const grouped = withStatus.reduce<Record<string, typeof withStatus>>((accumulator, item) => {
    const key = item.task.category;
    accumulator[key] = [...(accumulator[key] ?? []), item];
    return accumulator;
  }, {});
  const doneCount = withStatus.filter((item) => item.done).length;
  const ghosts = occurrencesForDay(data, child.id, today).filter((o) => o.status === "postponed");

  function completeTask(taskId: string, points: number) {
    const nowDone = toggleTask(taskId, child.id);
    if (!nowDone) return;
    const linkedGoal = goalsLinkedToTask(data, taskId)[0];
    if (linkedGoal) {
      const progress = goalProgressFor(data, linkedGoal) + 1;
      toast(`+${points} punten`, `Ook een stap dichter bij "${linkedGoal.title}" (${Math.min(progress, linkedGoal.target)}/${linkedGoal.target})`);
    } else {
      toast(`+${points} punten`, "Goed bezig.");
    }
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted">
        {withStatus.length === 0
          ? "Vrije dag."
          : `${doneCount} van de ${withStatus.length} afgerond. Niet alles hoeft.`}
      </p>

      {withStatus.length > 0 ? <DayRhythm tasks={withStatus} /> : null}

      <div className="mt-6 space-y-7">
        {withStatus.length === 0 ? (
          <EmptyState
            title="Geen afspraken vandaag"
            description="Vrije dag. Je kunt altijd nog iets samen doen bij Samen."
            icon="🌤️"
          />
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <SectionTitle>{CATEGORY_LABEL[category as Category]}</SectionTitle>
              <div className="space-y-2.5">
                {items.map(({ task, done, priority, moved, overdue }) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={done}
                    priority={priority}
                    moved={moved}
                    overdue={overdue}
                    onToggle={() => completeTask(task.id, task.points)}
                    onPostpone={
                      done
                        ? undefined
                        : () => {
                            postponeTask(task.id, child.id, todayKey, tomorrowKey);
                            toast("Verplaatst naar morgen", "Geen probleem — morgen weer een kans.");
                          }
                    }
                    onSkip={
                      done
                        ? undefined
                        : () => {
                            skipTask(task.id, child.id, todayKey);
                            toast("Overgeslagen voor vandaag");
                          }
                    }
                    onTogglePriority={
                      done ? undefined : () => setTaskPriority(task.id, child.id, todayKey, priority !== "high")
                    }
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {ghosts.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>Overgeslagen of verplaatst</SectionTitle>
          <div className="space-y-1 rounded-2xl border border-dashed border-line bg-surface/60 px-4 py-3">
            {ghosts.map((ghost) => (
              <OccurrenceRow key={ghost.task.id} occ={ghost} />
            ))}
          </div>
        </section>
      ) : null}

      {withStatus.length > 0 && doneCount === withStatus.length ? (
        <Card tone="sage" className="mt-8 animate-pop">
          <p className="text-[15px] leading-relaxed text-ink">
            Alles van vandaag staat af. Mooi, dat heb je zelf gedaan.
          </p>
        </Card>
      ) : null}
    </>
  );
}

function WeekView({ data, child }: { data: AppData; child: Person }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(dateKey());
  const start = startOfWeek();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const todayKey = dateKey();

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:snap-x sm:gap-2.5 sm:overflow-x-auto sm:pb-2">
      {days.map((day) => {
        const key = dateKey(day);
        const occs = occurrencesForDay(data, child.id, day);
        const isToday = key === todayKey;
        const expanded = expandedKey === key;
        const done = occs.filter((o) => o.status === "completed").length;
        const total = occs.length;

        return (
          <button
            key={key}
            type="button"
            onClick={() => setExpandedKey(expanded ? null : key)}
            className={cx(
              "w-full min-w-0 overflow-hidden rounded-2xl border p-3 text-left transition",
              "sm:w-[150px] sm:shrink-0 sm:snap-start lg:w-auto lg:min-w-0 lg:flex-1",
              isToday ? "border-primary bg-sage-light/50" : "border-line bg-surface hover:border-sage-dark",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{weekdayShort(day)}</p>
                <p className="font-mono text-lg font-semibold text-ink">{day.getDate()}</p>
              </div>
              {total > 0 ? <Ring value={done} max={total} size={30} tone={isToday ? "progress" : "primary"} /> : null}
            </div>
            <div className="mt-2 space-y-0.5">
              {total === 0 ? (
                <p className="text-xs text-muted">vrij</p>
              ) : (
                (expanded ? occs : occs.slice(0, 3)).map((occ) => <OccurrenceRow key={occ.task.id} occ={occ} />)
              )}
              {!expanded && total > 3 ? <p className="pl-3 text-[11px] text-muted">+{total - 3} meer</p> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({ data, child }: { data: AppData; child: Person }) {
  const [selected, setSelected] = useState(dateKey());
  const monthStart = startOfMonth();
  const totalDays = daysInMonth();
  const firstWeekday = monthStart.getDay();
  const leadingBlanks = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const monthDays = Array.from(
    { length: totalDays },
    (_, i) => new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1),
  );
  const todayKey = dateKey();
  const selectedDate = monthDays.find((d) => dateKey(d) === selected) ?? monthDays[0];
  const selectedOccs = occurrencesForDay(data, child.id, selectedDate);

  return (
    <div>
      <p className="mb-3 text-sm font-medium capitalize text-ink">
        {monthStart.toLocaleDateString("nl-NL", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase text-muted">
        {WEEKDAYS.map((w) => (
          <div key={w.index}>{w.short}</div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {monthDays.map((day) => {
          const key = dateKey(day);
          const occs = occurrencesForDay(data, child.id, day);
          const done = occs.filter((o) => o.status === "completed").length;
          const total = occs.length;
          const hasOverdue = occs.some((o) => o.status === "overdue");
          const isToday = key === todayKey;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={cx(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-xs transition",
                isSelected
                  ? "border-primary bg-sage text-primary-dark"
                  : "border-line bg-surface hover:bg-sage-light/50",
                isToday && !isSelected && "ring-2 ring-primary/30",
              )}
            >
              <span className="font-mono">{day.getDate()}</span>
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  total === 0 ? "bg-transparent" : done === total ? "bg-primary" : hasOverdue ? "bg-danger" : "bg-sage-dark",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <Card className="mt-5">
        <p className="text-sm font-semibold capitalize text-ink">
          {selectedDate.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="mt-3 space-y-1">
          {selectedOccs.length === 0 ? (
            <p className="text-sm text-muted">Niets gepland.</p>
          ) : (
            selectedOccs.map((occ) => <OccurrenceRow key={occ.task.id} occ={occ} />)
          )}
        </div>
      </Card>
    </div>
  );
}

function PlanPageInner() {
  const { data, activePerson } = useFamilyFlow();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") ?? "dag");
  const child = activePerson.role === "child" ? activePerson : children(data)[0];

  if (!child) {
    return (
      <AppShell role="child">
        <EmptyState title="Nog geen dashboard" description="Er is nog geen kind toegevoegd aan dit gezin." />
      </AppShell>
    );
  }

  return (
    <AppShell role="child">
      <header className="mb-6">
        <h1 className="font-display text-[28px] font-semibold leading-tight text-ink">Plan</h1>
        <p className="mt-1 text-sm text-muted">Wat er speelt — vandaag, deze week, deze maand.</p>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "dag" ? (
        <DayView data={data} child={child} />
      ) : tab === "week" ? (
        <WeekView data={data} child={child} />
      ) : (
        <MonthView data={data} child={child} />
      )}
    </AppShell>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanPageInner />
    </Suspense>
  );
}
