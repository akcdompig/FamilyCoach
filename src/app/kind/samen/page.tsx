"use client";

import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { dateKey, personById } from "@/lib/utils";

export default function TogetherPage() {
  const { data, activePerson, toggleActivity } = useFamilyFlow();
  const toast = useToast();
  const today = dateKey();

  const upcoming = [...data.activities].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Samen</h1>
        <p className="mt-1 text-sm text-muted">
          Dit telt net zo zwaar als de afspraken. Vaak zwaarder.
        </p>
      </header>

      {upcoming.length === 0 ? (
        <EmptyState
          title="Nog niets gepland"
          description="Een ouder kan hier een gezamenlijke activiteit toevoegen, bijvoorbeeld 20 minuten samen wandelen."
          icon="🧡"
        />
      ) : (
        <div className="space-y-4">
          {upcoming.map((activity) => {
            const joined = activity.completedBy.includes(activePerson.id);
            const isToday = activity.date === today;
            return (
              <Card key={activity.id} tone={isToday ? "sage" : "surface"}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{activity.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{activity.description}</p>
                  </div>
                  <Badge tone={isToday ? "green" : "muted"}>{isToday ? "vandaag" : activity.date.slice(5)}</Badge>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {activity.completedBy.length === 0 ? (
                      <span className="text-sm text-muted">Nog niemand</span>
                    ) : (
                      activity.completedBy.map((personId) => {
                        const person = personById(data, personId);
                        return person ? (
                          <Avatar
                            key={personId}
                            name={person.name}
                            color={person.color}
                            size="sm"
                            className="ring-2 ring-surface"
                          />
                        ) : null;
                      })
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={joined ? "soft" : "primary"}
                    onClick={() => {
                      toggleActivity(activity.id, activePerson.id);
                      if (!joined) toast(`+${activity.points} punten`, "Leuk dat je meedoet.");
                    }}
                  >
                    {joined ? "Je doet mee" : "Ik doe mee"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <section className="mt-8">
        <SectionTitle>Ideeën van Flow</SectionTitle>
        <Card tone="sand">
          <ul className="space-y-2 text-[15px] leading-relaxed text-ink">
            <li>Telefoonvrije 30 minuten na het eten.</li>
            <li>Vanavond kiest iemand anders het eten.</li>
            <li>Weekendchallenge: samen 5.000 stappen.</li>
          </ul>
          <p className="mt-3 text-sm text-muted">
            Een ouder kan deze toevoegen als activiteit voor het hele gezin.
          </p>
        </Card>
      </section>
    </AppShell>
  );
}
