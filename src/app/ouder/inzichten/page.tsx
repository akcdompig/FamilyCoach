"use client";

import { AppShell } from "@/components/AppShell";
import { WeeklyInsight } from "@/components/WeeklyInsight";
import { Card, SectionTitle } from "@/components/ui/Card";
import { findEscalations } from "@/lib/coach/rules";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import {
  addDays,
  children,
  cx,
  dayProgress,
  weekStats,
  WEEKDAY_LONG,
} from "@/lib/utils";

function insightText(stats: ReturnType<typeof weekStats>): string {
  if (stats.tasksTotal === 0) return "Er staan nog geen afspraken. Begin met één afspraak per kind.";
  const ratio = stats.tasksDone / stats.tasksTotal;
  if (ratio > 0.85) {
    return "Jullie ritme zit goed. Dit is een mooi moment om één afspraak los te laten en te kijken of het vanzelf blijft lopen.";
  }
  if (ratio > 0.6) {
    return "Jullie boeken vooral vooruitgang wanneer afspraken klein en concreet zijn. De ochtend blijft het lastigste moment.";
  }
  return "Er staan op dit moment veel afspraken open. Minder afspraken die wél lukken werken beter dan een volle lijst.";
}

export default function InsightsPage() {
  const { data } = useFamilyFlow();
  const kids = children(data);
  const ids = kids.map((kid) => kid.id);
  const stats = weekStats(data, ids);
  const escalations = findEscalations(data);

  const week = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(new Date(), -(6 - index));
    const totals = ids.reduce(
      (accumulator, id) => {
        const progress = dayProgress(data, id, day);
        return { done: accumulator.done + progress.done, total: accumulator.total + progress.total };
      },
      { done: 0, total: 0 },
    );
    return { day, ...totals };
  });

  return (
    <AppShell role="parent">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Inzichten</h1>
        <p className="mt-1 text-sm text-muted">Geen cijferlijst. Wel wat je ermee kunt.</p>
      </header>

      <WeeklyInsight stats={stats} insight={insightText(stats)} />

      <section className="mt-8">
        <SectionTitle>Afgelopen zeven dagen</SectionTitle>
        <Card>
          <div className="flex items-end justify-between gap-2" role="img" aria-label="Afspraken per dag">
            {week.map(({ day, done, total }) => {
              const ratio = total > 0 ? done / total : 0;
              return (
                <div key={day.toISOString()} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end justify-center">
                    <div className="relative flex h-full w-7 items-end overflow-hidden rounded-full bg-sage-light">
                      <div
                        className={cx(
                          "w-full rounded-full transition-all duration-700",
                          ratio > 0.75 ? "bg-primary" : ratio > 0.4 ? "bg-primary-light" : "bg-accent",
                        )}
                        style={{ height: `${Math.max(ratio * 100, total > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted">
                    {WEEKDAY_LONG[day.getDay()].slice(0, 2)}
                  </span>
                  <span className="text-xs text-muted">
                    {done}/{total}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>Per kind</SectionTitle>
        <div className="space-y-3">
          {kids.map((kid) => {
            const kidStats = weekStats(data, [kid.id]);
            return (
              <Card key={kid.id}>
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-ink">{kid.name}</p>
                  <p className="text-sm text-muted">
                    {kidStats.tasksDone}/{kidStats.tasksTotal} afspraken
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {kidStats.checkIns} check-ins · beweging op {kidStats.movementDays} dagen
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {escalations.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>Vraagt aandacht</SectionTitle>
          <div className="space-y-3">
            {escalations.map((item) => (
              <Card key={`${item.childName}-${item.taskTitle}`} tone="sand">
                <p className="text-[15px] leading-relaxed text-ink">
                  &ldquo;{item.taskTitle}&rdquo; lukt bij {item.childName} al {item.days} keer op rij niet.
                  Misschien is de afspraak te groot, of staat hij op een lastig moment.
                </p>
                <p className="mt-2 text-sm text-muted">
                  Probeer hem kleiner te maken of samen opnieuw te formuleren.
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {data.coachProfile ? (
        <section className="mt-8">
          <SectionTitle>Coachprofiel</SectionTitle>
          <Card tone="sage">
            <p className="text-[15px] leading-relaxed text-ink">{data.coachProfile.summary}</p>
            <p className="mt-3 text-sm text-muted">
              Focus: {data.coachProfile.focusAreas.join(" · ")}
            </p>
          </Card>
        </section>
      ) : null}
    </AppShell>
  );
}
