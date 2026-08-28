"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CheckIn } from "@/components/CheckIn";
import { CoachMessageCard } from "@/components/CoachMessageCard";
import { Disclaimer } from "@/components/Disclaimer";
import { FamilyMemberCard } from "@/components/FamilyMemberCard";
import { FamilyTeamStrip } from "@/components/FamilyTeamStrip";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { FlowScope } from "@/components/ui/FlowScope";
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
  const conflictsToday = kids.filter((kid) =>
    (data.conflicts ?? []).some((c) => c.personId === kid.id && c.createdAt.slice(0, 10) === today),
  );

  const family = familyProgress(data);
  const familyAchievement = kids.length
    ? Math.round(kids.reduce((sum, kid) => sum + combinedAchievementFor(data, kid.id), 0) / kids.length)
    : 0;

  return (
    <AppShell role="parent">
      {/* ME — wie ben ik, hoe staat het gezin er vandaag voor. Geen donkere dashboard-doos: de avatar draagt de identiteit. */}
      <header className="mb-8 flex items-start gap-4 sm:gap-5">
        <Avatar
          name={activePerson.name}
          color={activePerson.color}
          avatarVariant={activePerson.avatarVariant}
          size="xl"
          glow
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{data.family.name}</p>
          <h1 className="mt-0.5 font-display text-[28px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[38px]">
            {greeting()}, {activePerson.name}
          </h1>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">
            {kids.length === 0
              ? "Nog geen kinderen toegevoegd aan dit gezin."
              : family.total === 0
                ? "Vandaag staat er nog niets gepland voor het gezin."
                : `Vandaag zijn ${family.done} van de ${family.total} afspraken gelukt.`}
          </p>
          <div className="mt-3">
            <StarRating percentage={familyAchievement} size="sm" />
          </div>
        </div>
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

      <div className="xl:grid xl:grid-cols-[1fr_320px] xl:items-start xl:gap-8">
        <div className="min-w-0">
          <FlowScope scope="mine">Mijn Flow</FlowScope>

          <div className="mt-4">
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
          </div>

          {!myCheckIn ? (
            <section className="mt-6">
              <SectionTitle>Even voor jou</SectionTitle>
              <CheckIn
                question="Hoe gaat het vandaag met jou?"
                onSelect={(mood, note) => addCheckIn(activePerson.id, mood, note)}
              />
            </section>
          ) : null}
        </div>

        <aside className="mt-8 xl:mt-0">
          <Card tone="sage">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-primary/70">FamilyFlow Insight</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink">
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
        </aside>
      </div>

      {/* OUR FLOW — het gezin zelf: wie is er, wie doet wat, wat vraagt aandacht. Eigen warme zone i.p.v. nog een kaart tussen de rest. */}
      <section className="mt-10 -mx-5 rounded-t-[2rem] bg-sand-light px-5 py-8 sm:mx-0 sm:rounded-[2rem] sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <FlowScope scope="ours">Ons Flow</FlowScope>
            <p className="mt-1 text-sm text-muted">Hoe het gezin er vandaag voor staat.</p>
          </div>
          <Link href="/ouder/gezin" className="shrink-0 text-sm font-medium text-primary hover:underline">
            Bekijken
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-4">
          {data.people.map((person) => {
            const progress = person.role === "child" ? dayProgress(data, person.id) : null;
            const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : undefined;
            return (
              <div key={person.id} className="flex flex-col items-center gap-1.5">
                <Avatar
                  name={person.name}
                  color={person.color}
                  avatarVariant={person.avatarVariant}
                  size="lg"
                  ring={pct}
                  ringBg="#FBF3E9"
                />
                <p className="max-w-[4.5rem] truncate text-xs font-medium text-ink">{person.name.split(" ")[0]}</p>
                {progress && progress.total > 0 ? (
                  <p className="text-[11px] text-muted">
                    {progress.done}/{progress.total}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {kids.length > 0 ? (
          <div className="mt-6 space-y-3">
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
        ) : null}

        {conflictsToday.length > 0 ? (
          <Card className="mt-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-dark">Family Coach signaleert</p>
            <div className="mt-2 space-y-1.5">
              {conflictsToday.map((kid) => {
                const todaysConflicts = (data.conflicts ?? []).filter(
                  (c) => c.personId === kid.id && c.createdAt.slice(0, 10) === today,
                );
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

        <div className="mt-6">
          {todaysActivity ? (
            <Card>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-accent-dark">Vandaag samen</p>
              <p className="mt-2 font-medium text-ink">{todaysActivity.title}</p>
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
                Vandaag staat er niets samen gepland. Eén klein gedeeld moment maakt de rest van de dag vaak
                makkelijker.
              </p>
            </Card>
          )}
        </div>

        <div className="mt-6">
          <FamilyTeamStrip data={data} />
        </div>
      </section>

      <Disclaimer className="mt-10 px-1 text-xs leading-relaxed text-muted" />
    </AppShell>
  );
}
