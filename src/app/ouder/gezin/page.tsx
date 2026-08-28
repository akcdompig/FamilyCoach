"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FamilyMemberCard } from "@/components/FamilyMemberCard";
import { FamilyTeamStrip } from "@/components/FamilyTeamStrip";
import { GoalJourney } from "@/components/GoalJourney";
import { Icon } from "@/components/Icons";
import { ReminderPanel } from "@/components/flow/ReminderPanel";
import { ResponsibilityMap } from "@/components/ResponsibilityMap";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import {
  CATEGORY_ICON,
  checkInFor,
  dayProgress,
  goalAchieved,
  goalProgressFor,
  milestonesFor,
  personById,
  pointsFor,
  tasksForPerson,
  isDone,
} from "@/lib/utils";

const COLORS = ["#C43A28", "#0F7A3D", "#0D8074", "#3B1F63", "#F2A900"];

export default function FamilyPage() {
  const { data, addPerson, approveRedemption, denyRedemption } = useFamilyFlow();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const familyGoals = data.goals.filter((g) => !g.personId);
  const pendingRedemptions = data.redemptions
    .filter((r) => r.status === "aangevraagd")
    .map((r) => ({ redemption: r, reward: data.rewards.find((w) => w.id === r.rewardId), person: personById(data, r.personId) }))
    .filter((entry) => entry.reward && entry.person);

  return (
    <AppShell role="parent">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight text-ink">Gezin</h1>
          <p className="mt-1 text-sm text-muted">{data.family.name} · hoe het samen gaat</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Kind toevoegen
        </Button>
      </header>

      <FamilyTeamStrip data={data} />

      {pendingRedemptions.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>Aangevraagde beloningen</SectionTitle>
          <div className="space-y-3">
            {pendingRedemptions.map(({ redemption, reward, person }) => (
              <Card key={redemption.id} tone="sand" className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{reward!.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {person!.name} · {reward!.cost} punten
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      denyRedemption(redemption.id);
                      toast("Aanvraag afgewezen", "Punten zijn teruggegeven.");
                    }}
                  >
                    Afwijzen
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      approveRedemption(redemption.id);
                      toast("Goedgekeurd", `${person!.name} ziet dit terug.`);
                    }}
                  >
                    Goedkeuren
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {familyGoals.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>Gezinsdoelen</SectionTitle>
          <div className="space-y-4">
            {familyGoals.map((goal) => {
              const progress = goalProgressFor(data, goal);
              const achieved = goalAchieved(data, goal);
              return (
                <Card key={goal.id} tone={achieved ? "sage" : "surface"}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium text-ink">{goal.title}</p>
                    <span className="shrink-0 font-mono text-sm text-muted">
                      {progress}/{goal.target} {goal.unit}
                    </span>
                  </div>
                  <GoalJourney
                    goal={goal}
                    progress={progress}
                    milestones={milestonesFor(goal)}
                    achieved={achieved}
                    className="mt-3"
                  />
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionTitle>Verantwoordelijkheden thuis</SectionTitle>
        <ResponsibilityMap data={data} people={data.people} showStatus />
      </section>

      <section className="mt-8">
        <SectionTitle>Gezinsleden</SectionTitle>
        <div className="space-y-2.5">
          {data.people.map((person) => {
            const expanded = expandedId === person.id;
            const progress = dayProgress(data, person.id);
            const tasks = tasksForPerson(data, person.id);
            return (
              <div key={person.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : person.id)}
                  className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
                >
                  <FamilyMemberCard
                    person={person}
                    done={progress.done}
                    total={progress.total}
                    mood={checkInFor(data, person.id)?.mood}
                    points={person.role === "child" ? pointsFor(data, person.id) : undefined}
                  />
                </button>

                {expanded ? (
                  <Card className="mt-2 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={person.role === "child" ? "accent" : "neutral"}>
                        {person.role === "child" ? `${person.age ?? "?"} jaar` : "Ouder"}
                      </Badge>
                      {person.school ? <span className="text-sm text-muted">{person.school}</span> : null}
                    </div>

                    {person.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {person.interests.map((interest) => (
                          <span
                            key={interest}
                            className="rounded-full bg-sage-light px-2.5 py-1 text-xs text-primary-dark"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {person.role === "child" ? (
                      <div className="space-y-3 border-t border-line pt-3">
                        {person.likes ? (
                          <p className="text-sm text-muted">
                            <span className="font-medium text-ink">Wordt blij van:</span> {person.likes}
                          </p>
                        ) : null}
                        {person.hard ? (
                          <p className="text-sm text-muted">
                            <span className="font-medium text-ink">Vindt moeilijk:</span> {person.hard}
                          </p>
                        ) : null}
                        <div>
                          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
                            Afspraken vandaag
                          </p>
                          <ul className="space-y-1.5">
                            {tasks.length === 0 ? (
                              <li className="text-sm text-muted">Geen afspraken voor vandaag.</li>
                            ) : (
                              tasks.map((task) => (
                                <li key={task.id} className="flex items-center gap-2 text-sm text-ink">
                                  <Icon
                                    name={CATEGORY_ICON[task.category]}
                                    className="h-3.5 w-3.5 shrink-0 text-muted"
                                  />
                                  <span className={isDone(data, task.id) ? "text-muted line-through" : ""}>
                                    {task.title}
                                  </span>
                                  {task.time ? (
                                    <span className="font-mono text-xs text-muted">{task.time}</span>
                                  ) : null}
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                        <ReminderPanel person={person} />
                      </div>
                    ) : null}
                  </Card>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {data.coachProfile ? (
        <section className="mt-8">
          <SectionTitle>Coachprofiel</SectionTitle>
          <Card tone="sage">
            <p className="text-[15px] leading-relaxed text-ink">{data.coachProfile.summary}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-ink">Focusgebieden</dt>
                <dd className="text-muted">{data.coachProfile.focusAreas.join(" · ")}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Motivatie</dt>
                <dd className="text-muted">{data.coachProfile.motivation.join(" · ")}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Communicatiestijl</dt>
                <dd className="text-muted">{data.coachProfile.tone.join(" · ")}</dd>
              </div>
            </dl>
          </Card>
        </section>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Kind toevoegen"
        description="Alleen wat de coach nodig heeft om te kloppen."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button
              disabled={!name.trim()}
              onClick={() => {
                addPerson({
                  name: name.trim(),
                  role: "child",
                  age: age ? Number(age) : undefined,
                  color: COLORS[data.people.length % COLORS.length],
                  interests: interests
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                });
                toast("Toegevoegd", `${name.trim()} hoort er nu bij`);
                setName("");
                setAge("");
                setInterests("");
                setOpen(false);
              }}
            >
              Toevoegen
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="child-name">
              Naam
            </label>
            <input id="child-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="child-age">
              Leeftijd
            </label>
            <input
              id="child-age"
              className="field"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div>
            <label className="label" htmlFor="child-interests">
              Interesses (komma&apos;s ertussen)
            </label>
            <input
              id="child-interests"
              className="field"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="voetbal, muziek"
            />
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
