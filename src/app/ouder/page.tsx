"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CheckIn } from "@/components/CheckIn";
import { CoachMessageCard } from "@/components/CoachMessageCard";
import { Disclaimer } from "@/components/Disclaimer";
import { FamilyMemberCard } from "@/components/FamilyMemberCard";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { DualRing } from "@/components/ui/Progress";
import { StarRating } from "@/components/ui/StarRating";
import { activeMessage, useCoachMoment } from "@/lib/coach/useCoach";
import { parentFocusSuggestion } from "@/lib/coach/rules";
import { familyProgress } from "@/lib/gamification";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { Mood } from "@/lib/types";
import { checkInFor, children, combinedAchievementFor, dateKey, dayProgress, greeting, pointsFor, weekStats } from "@/lib/utils";

const MOOD_FROM_LABEL: Record<string, Mood> = {
  Goed: "good",
  "Gaat wel": "ok",
  "Niet zo goed": "low",
};

export default function ParentHome() {
  const { data, activePerson, addCheckIn, answerMessage, dismissMessage, toggleActivity } = useFamilyFlow();
  const { loading, generate } = useCoachMoment(activePerson);

  const message = activeMessage(data.messages, activePerson.id);
  const myCheckIn = checkInFor(data, activePerson.id);
  const kids = children(data);
  const today = dateKey();
  const todaysActivity = data.activities.find((activity) => activity.date === today);
  const stats = weekStats(data, kids.map((kid) => kid.id));
  const safetyConflicts = (data.conflicts ?? []).filter((c) => c.privacy === "SAFETY_RELEVANT");

  const family = familyProgress(data);
  const todayPct = family.total > 0 ? Math.round((family.done / family.total) * 100) : 0;
  const weekPct = stats.tasksTotal > 0 ? Math.round((stats.tasksDone / stats.tasksTotal) * 100) : 0;
  const familyAchievement = kids.length
    ? Math.round(kids.reduce((sum, kid) => sum + combinedAchievementFor(data, kid.id), 0) / kids.length)
    : 0;

  return (
    <AppShell role="parent">
      <header className="mb-6">
        <Card tone="hero" className="overflow-hidden">
          <p className="text-sm text-white/60">{data.family.name}</p>
          <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight text-white sm:text-[30px]">
            {greeting()}, {activePerson.name}
          </h1>
          <div className="mt-3">
            <StarRating percentage={familyAchievement} />
          </div>

          {kids.length > 0 ? (
            <div className="mt-5 flex items-center gap-5">
              <DualRing individual={todayPct} family={weekPct} max={100} size={104} />
              <div className="min-w-0 space-y-2 text-sm">
                <p className="flex items-center gap-1.5 text-white/80">
                  <span className="h-2 w-2 rounded-full bg-[#33C7C0]" />
                  Vandaag
                </p>
                <p className="flex items-center gap-1.5 text-white/60">
                  <span className="h-2 w-2 rounded-full bg-white/55" />
                  Deze week
                </p>
              </div>
            </div>
          ) : null}
        </Card>
      </header>

      {safetyConflicts.length > 0 ? (
        <Card className="mb-6 border-2 border-[#E7CFC9] bg-[#FBF1EF]">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#9B3B2F]">Flow vroeg om aandacht</p>
          {safetyConflicts.map((conflict) => {
            const child = data.people.find((p) => p.id === conflict.personId);
            return (
              <p key={conflict.id} className="mt-2 text-[15px] leading-relaxed text-ink">
                {child?.name ?? "Je kind"} deelde iets met Flow dat mogelijk niet alleen met een chatbot besproken
                moet worden. Flow heeft doorverwezen naar een vertrouwde volwassene — praat hier vandaag nog samen over.
              </p>
            );
          })}
        </Card>
      ) : null}

      <CoachMessageCard
        message={message}
        loading={loading}
        onRefresh={() => void generate(message?.kind === "checkin" ? "parent-tip" : "insight")}
        onDismiss={message ? () => dismissMessage(message.id) : undefined}
        onSuggestion={(suggestion) => {
          const mood = MOOD_FROM_LABEL[suggestion];
          if (mood) addCheckIn(activePerson.id, mood);
          else if (message) answerMessage(message.id);
        }}
      />

      {!myCheckIn ? (
        <section className="mt-6">
          <SectionTitle>Even voor jou</SectionTitle>
          <CheckIn
            question="Hoe gaat het vandaag met jou?"
            onSelect={(mood, note) => addCheckIn(activePerson.id, mood, note)}
          />
        </section>
      ) : null}

      <section className="mt-8">
        <SectionTitle
          action={
            <Link href="/ouder/gezin" className="text-sm text-primary hover:underline">
              Bekijken
            </Link>
          }
        >
          Vandaag
        </SectionTitle>
        <div className="space-y-3">
          {kids.map((kid) => {
            const progress = dayProgress(data, kid.id);
            return (
              <FamilyMemberCard
                key={kid.id}
                person={kid}
                done={progress.done}
                total={progress.total}
                mood={checkInFor(data, kid.id)?.mood}
                points={pointsFor(data, kid.id)}
                href="/ouder/gezin"
              />
            );
          })}
        </div>

        {kids.some((kid) => (data.conflicts ?? []).some((c) => c.personId === kid.id && c.createdAt.slice(0, 10) === today)) ? (
          <Card tone="sand" className="mt-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-dark">Family Coach signaleert</p>
            <div className="mt-2 space-y-1.5">
              {kids.map((kid) => {
                const todaysConflicts = (data.conflicts ?? []).filter(
                  (c) => c.personId === kid.id && c.createdAt.slice(0, 10) === today,
                );
                if (todaysConflicts.length === 0) return null;
                const resolved = todaysConflicts.every((c) => c.status === "resolved" || c.status === "attempting");
                return (
                  <p key={kid.id} className="text-[15px] leading-relaxed text-ink">
                    {kid.name} heeft vandaag {todaysConflicts.length === 1 ? "één conflictsituatie" : `${todaysConflicts.length} conflictsituaties`} gemeld.{" "}
                    {resolved ? "De situatie is inmiddels besproken met Flow." : "Dit staat nog open."}
                  </p>
                );
              })}
            </div>
          </Card>
        ) : null}
      </section>

      <section className="mt-8">
        <SectionTitle>FamilyFlow Insight</SectionTitle>
        <Card tone="sage">
          <p className="text-[15px] leading-relaxed text-ink">
            Deze week zijn {stats.tasksDone} van de {stats.tasksTotal} afspraken gelukt, met{" "}
            {stats.checkIns} check-ins en beweging op {stats.movementDays} dagen.
          </p>
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-primary/70">
            {new Date().getHours() >= 17 ? "Tip voor vanavond" : "Wat kun jij vandaag doen?"}
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{parentFocusSuggestion(data)}</p>
          <Link href="/ouder/inzichten" className="mt-4 inline-block text-sm text-primary hover:underline">
            Meer inzichten
          </Link>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>Samen</SectionTitle>
        {todaysActivity ? (
          <Card>
            <p className="font-medium text-ink">{todaysActivity.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{todaysActivity.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted">
                {todaysActivity.completedBy.length > 0
                  ? `${todaysActivity.completedBy.length} van jullie doet mee`
                  : "Nog niemand afgevinkt"}
              </p>
              <Button
                size="sm"
                variant={todaysActivity.completedBy.includes(activePerson.id) ? "soft" : "primary"}
                onClick={() => toggleActivity(todaysActivity.id, activePerson.id)}
              >
                {todaysActivity.completedBy.includes(activePerson.id) ? "Je doet mee" : "Ik doe mee"}
              </Button>
            </div>
          </Card>
        ) : (
          <Card tone="outline">
            <p className="text-sm text-muted">
              Vandaag staat er niets samen gepland. Eén klein gedeeld moment maakt de rest van de dag
              vaak makkelijker.
            </p>
          </Card>
        )}
      </section>

      <Disclaimer className="mt-10 px-1 text-xs leading-relaxed text-muted" />
    </AppShell>
  );
}
