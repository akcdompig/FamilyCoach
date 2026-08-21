"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Skeleton";
import { Progress } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { children, dateKey, pointsFor } from "@/lib/utils";

const TABS = [
  { id: "doelen", label: "Doelen" },
  { id: "wellness", label: "Wellness" },
];

function GoalsPageInner() {
  const { data, activePerson, logWellness, addReading } = useFamilyFlow();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "wellness" ? "wellness" : "doelen");
  const child = activePerson.role === "child" ? activePerson : children(data)[0];
  const person = child ?? activePerson;
  const points = pointsFor(data, person.id);

  const myGoals = data.goals.filter((goal) => !goal.personId || goal.personId === person.id);

  const [book, setBook] = useState("");
  const [minutes, setMinutes] = useState("15");
  const logs = (data.wellnessLogs ?? []).filter((log) => log.personId === person.id && log.date === dateKey());
  const water = logs.filter((log) => log.kind === "water").reduce((total, log) => total + log.value, 0);
  const fruit = logs.filter((log) => log.kind === "fruit").reduce((total, log) => total + log.value, 0);

  function log(kind: "water" | "fruit", value: number, unit: string) {
    logWellness(person.id, kind, value, unit);
    toast("Opgeslagen", kind === "water" ? `+${value} ml water` : "+1 fruitportie");
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Groei</h1>
        <p className="mt-1 text-sm text-muted">
          {tab === "doelen" ? `${points} punten verzameld` : "Kleine keuzes, goed gevoel."}
        </p>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "doelen" ? (
        <section>
          <SectionTitle>Deze weken</SectionTitle>
          {myGoals.length === 0 ? (
            <EmptyState
              title="Nog geen doelen"
              description="Een ouder kan een doel instellen. Klein en concreet werkt het best."
              icon="🎯"
            />
          ) : (
            <div className="space-y-3">
              {myGoals.map((goal) => (
                <Card key={goal.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{goal.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {goal.personId ? "Persoonlijk doel" : "Gezinsdoel"} · +{goal.points} punten
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-muted">
                      {goal.progress}/{goal.target}
                    </span>
                  </div>
                  <Progress value={goal.progress} max={goal.target} className="mt-3" />
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section>
            <SectionTitle>Drinken</SectionTitle>
            <Card tone="outline">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold text-ink">
                    {water} <span className="text-sm font-normal text-muted">ml</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">Richtwaarde vandaag: 1.500 ml</p>
                </div>
                <span className="text-3xl">💧</span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[250, 500, 750, 1000].map((amount) => (
                  <Button key={amount} size="sm" variant="secondary" onClick={() => log("water", amount, "ml")}>
                    +{amount}
                  </Button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Een algemene richtwaarde. Behoeften verschillen door beweging, warmte en gezondheid.
              </p>
            </Card>
          </section>

          <section className="mt-8">
            <SectionTitle>Voeding</SectionTitle>
            <Card tone="sand">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink">Fruit</p>
                  <p className="mt-1 text-sm text-muted">{fruit} / 2 porties als fijne richtlijn</p>
                </div>
                <span className="text-3xl">🍎</span>
              </div>
              <Button className="mt-4" size="sm" onClick={() => log("fruit", 1, "portie")}>
                Fruit gegeten
              </Button>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Fruit bevat vezels en verschillende vitamines. Kies wat bij jou past.
              </p>
            </Card>
          </section>

          <section className="mt-8">
            <SectionTitle>Lezen</SectionTitle>
            <Card tone="sage" className="space-y-3">
              <div>
                <label className="label" htmlFor="book">
                  Boek of tekst
                </label>
                <input
                  id="book"
                  className="field"
                  value={book}
                  onChange={(event) => setBook(event.target.value)}
                  placeholder="Bijvoorbeeld: ..."
                />
              </div>
              <div>
                <label className="label" htmlFor="minutes">
                  Minuten
                </label>
                <input
                  id="minutes"
                  className="field"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button
                disabled={!book.trim()}
                onClick={() => {
                  addReading({ personId: person.id, title: book.trim(), minutes: Number(minutes) || 15 });
                  setBook("");
                  toast("Leesmoment opgeslagen", "Nog een kleine stap voor je streak.");
                }}
              >
                Leesmoment opslaan
              </Button>
            </Card>
          </section>

          <p className="mt-8 px-1 text-xs leading-relaxed text-muted">
            Alles hier is zelf gerapporteerd. FamilyFlow doet niet alsof het kan controleren wat je echt hebt gedaan.
          </p>
        </>
      )}
    </AppShell>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={null}>
      <GoalsPageInner />
    </Suspense>
  );
}
