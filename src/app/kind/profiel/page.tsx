"use client";

import { AppShell } from "@/components/AppShell";
import { PushOptIn } from "@/components/flow/PushOptIn";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionTitle } from "@/components/ui/Card";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { MOOD_EMOJI, addDays, children, dateKey, pointsFor, streakDays, weekStats } from "@/lib/utils";

export default function ChildProfilePage() {
  const { data, activePerson } = useFamilyFlow();
  const child = activePerson.role === "child" ? activePerson : children(data)[0];
  const person = child ?? activePerson;
  const stats = weekStats(data, [person.id]);

  const lastDays = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(new Date(), -(6 - index));
    return {
      day,
      mood: data.checkIns.find((c) => c.personId === person.id && c.date === dateKey(day))?.mood,
    };
  });

  return (
    <AppShell>
      <header className="mb-6 flex items-center gap-4">
        <Avatar name={person.name} color={person.color} size="lg" />
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-ink">{person.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {person.age ? `${person.age} jaar · ` : ""}
            {data.family.name}
          </p>
        </div>
      </header>

      <Card>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-ink">{pointsFor(data, person.id)}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted">Punten</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-ink">{streakDays(data, person.id)}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted">Dagen op rij</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-ink">
              {stats.tasksDone}/{stats.tasksTotal}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted">Deze week</p>
          </div>
        </div>
      </Card>

      <section className="mt-8">
        <SectionTitle>Hoe ging het deze week?</SectionTitle>
        <Card>
          <div className="flex justify-between">
            {lastDays.map(({ day, mood }) => (
              <div key={day.toISOString()} className="flex flex-col items-center gap-1.5">
                <span className="text-xl">{mood ? MOOD_EMOJI[mood] : "·"}</span>
                <span className="text-[11px] uppercase tracking-wider text-muted">
                  {["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"][day.getDay()]}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Alleen jij en je ouder zien dit. Er wordt niets vergeleken met anderen.
          </p>
        </Card>
      </section>

      <PushOptIn person={person} />

      {person.interests.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>Wat ik leuk vind</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {person.interests.map((interest) => (
              <Badge key={interest} tone="neutral">
                {interest}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionTitle>Laatste berichten van Flow</SectionTitle>
        <div className="space-y-2">
          {data.messages
            .filter((message) => message.personId === person.id)
            .slice(-5)
            .reverse()
            .map((message) => (
              <Card key={message.id} tone="sage">
                <p className="text-[15px] leading-relaxed text-ink">{message.body}</p>
                <p className="mt-2 text-xs text-muted">
                  {new Date(message.createdAt).toLocaleString("nl-NL", {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Card>
            ))}
          {data.messages.filter((message) => message.personId === person.id).length === 0 ? (
            <p className="text-sm text-muted">Nog geen berichten. Flow meldt zich als het nuttig is.</p>
          ) : null}
        </div>
      </section>

      <p className="mt-10 px-1 text-xs leading-relaxed text-muted">
        Flow is een digitale coach, geen mens en geen dokter. Zit je ergens echt mee? Praat dan met je
        ouder of een andere volwassene die je vertrouwt.
      </p>
    </AppShell>
  );
}
