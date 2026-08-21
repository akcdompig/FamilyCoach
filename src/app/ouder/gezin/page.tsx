"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ReminderPanel } from "@/components/flow/ReminderPanel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { CATEGORY_ICON, checkInFor, dayProgress, pointsFor, tasksForPerson, isDone } from "@/lib/utils";

const COLORS = ["#E5B96A", "#4C7A65", "#C2913F", "#6E7973", "#315C4A"];

export default function FamilyPage() {
  const { data, addPerson } = useFamilyFlow();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState("");

  return (
    <AppShell role="parent">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">Gezin</h1>
          <p className="mt-1 text-sm text-muted">{data.family.name}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          Kind toevoegen
        </Button>
      </header>

      <div className="space-y-4">
        {data.people.map((person) => {
          const progress = dayProgress(data, person.id);
          const tasks = tasksForPerson(data, person.id);
          return (
            <Card key={person.id}>
              <div className="flex items-start gap-4">
                <Avatar name={person.name} color={person.color} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">{person.name}</h2>
                    <Badge tone={person.role === "child" ? "accent" : "neutral"}>
                      {person.role === "child" ? `${person.age ?? "?"} jaar` : "Ouder"}
                    </Badge>
                  </div>
                  {person.school ? <p className="mt-1 text-sm text-muted">{person.school}</p> : null}
                  {person.role === "child" ? (
                    <p className="mt-2 text-sm text-muted">
                      Vandaag {progress.done}/{progress.total} afspraken · {pointsFor(data, person.id)} punten ·{" "}
                      {checkInFor(data, person.id) ? "check-in gedaan" : "nog geen check-in"}
                    </p>
                  ) : null}
                  {person.interests.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {person.interests.map((interest) => (
                        <span key={interest} className="rounded-full bg-sage-light px-2.5 py-1 text-xs text-primary-dark">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {person.role === "child" ? (
                <div className="mt-5 space-y-3 border-t border-line pt-4">
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
                            <span>{CATEGORY_ICON[task.category]}</span>
                            <span className={isDone(data, task.id) ? "text-muted line-through" : ""}>
                              {task.title}
                            </span>
                            {task.time ? <span className="text-xs text-muted">{task.time}</span> : null}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <ReminderPanel person={person} />
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

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
