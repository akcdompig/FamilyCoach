"use client";

import { AppShell } from "@/components/AppShell";
import { DayRhythm } from "@/components/DayRhythm";
import { TaskCard } from "@/components/TaskCard";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { Category } from "@/lib/types";
import { CATEGORY_LABEL, children, isDone, tasksForPerson, WEEKDAY_LONG } from "@/lib/utils";

export default function ChildTodayPage() {
  const { data, activePerson, toggleTask } = useFamilyFlow();
  const toast = useToast();
  const child = activePerson.role === "child" ? activePerson : children(data)[0];

  if (!child) {
    return (
      <AppShell role="child">
        <EmptyState title="Nog geen dashboard" description="Er is nog geen kind toegevoegd aan dit gezin." />
      </AppShell>
    );
  }

  const tasks = tasksForPerson(data, child.id);
  const withStatus = tasks.map((task) => ({ task, done: isDone(data, task.id) }));
  const grouped = withStatus.reduce<Record<string, typeof withStatus>>((accumulator, item) => {
    const key = item.task.category;
    accumulator[key] = [...(accumulator[key] ?? []), item];
    return accumulator;
  }, {});
  const doneCount = withStatus.filter((item) => item.done).length;

  return (
    <AppShell role="child">
      <header className="mb-6">
        <p className="text-sm capitalize text-muted">{WEEKDAY_LONG[new Date().getDay()]}</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">Vandaag</h1>
        <p className="mt-1 text-sm text-muted">
          {doneCount} van de {withStatus.length} afgerond. Niet alles hoeft.
        </p>
      </header>

      <DayRhythm tasks={withStatus} />

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
                {items.map(({ task, done }) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={done}
                    onToggle={() => {
                      const nowDone = toggleTask(task.id, child.id);
                      if (nowDone) toast(`+${task.points} punten`, "Goed bezig.");
                    }}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {withStatus.length > 0 && doneCount === withStatus.length ? (
        <Card tone="sage" className="mt-8 animate-pop">
          <p className="text-[15px] leading-relaxed text-ink">
            Alles van vandaag staat af. Mooi, dat heb je zelf gedaan.
          </p>
        </Card>
      ) : null}
    </AppShell>
  );
}
