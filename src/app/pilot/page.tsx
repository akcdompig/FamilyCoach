"use client";

import Link from "next/link";
import { useState } from "react";
import { FlowMark } from "@/components/FlowMark";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { cx } from "@/lib/utils";

export default function PilotPage() {
  const { data, addPilotFeedback } = useFamilyFlow();
  const toast = useToast();

  const [familyName, setFamilyName] = useState(data.family.name);
  const [email, setEmail] = useState("");
  const [pilotCode, setPilotCode] = useState(data.family.pilotCode ?? "");
  const [good, setGood] = useState("");
  const [annoying, setAnnoying] = useState("");
  const [missing, setMissing] = useState("");
  const [score, setScore] = useState(8);
  const [extra, setExtra] = useState("");
  const [sent, setSent] = useState(false);

  function submit() {
    addPilotFeedback({ familyName, email, pilotCode, good, annoying, missing, score, extra });
    toast("Bedankt", "Jullie feedback is opgeslagen");
    setSent(true);
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-muted hover:text-ink hover:underline">
        ← Terug
      </Link>

      <header className="mt-6 flex items-start gap-4">
        <FlowMark size={40} calm />
        <div>
          <h1 className="text-[28px] font-semibold leading-tight text-ink">FamilyFlow Pilot</h1>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">
            Jullie zijn een van de eerste gezinnen. Vertel gerust wat er niet werkt: daar hebben we het
            meeste aan.
          </p>
        </div>
      </header>

      {sent ? (
        <Card tone="sage" className="mt-8 animate-fade-up">
          <p className="text-[15px] leading-relaxed text-ink">
            Dank je wel. We nemen dit mee in de volgende versie.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setSent(false)}>
            Nog iets toevoegen
          </Button>
        </Card>
      ) : (
        <div className="mt-8 space-y-8">
          <section>
            <SectionTitle>Gezin aanmelden</SectionTitle>
            <Card className="space-y-4">
              <div>
                <label className="label" htmlFor="pilot-family">
                  Gezinsnaam
                </label>
                <input
                  id="pilot-family"
                  className="field"
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                  placeholder="Familie Jansen"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="pilot-email">
                    E-mail
                  </label>
                  <input
                    id="pilot-email"
                    type="email"
                    className="field"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="naam@voorbeeld.nl"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="pilot-code">
                    Pilotcode
                  </label>
                  <input
                    id="pilot-code"
                    className="field uppercase"
                    value={pilotCode}
                    onChange={(event) => setPilotCode(event.target.value.toUpperCase())}
                    placeholder="FLOW-2026"
                  />
                </div>
              </div>
            </Card>
          </section>

          <section>
            <SectionTitle>Feedback</SectionTitle>
            <Card className="space-y-4">
              <div>
                <label className="label" htmlFor="pilot-good">
                  Wat ging goed?
                </label>
                <textarea
                  id="pilot-good"
                  rows={2}
                  className="field resize-none"
                  value={good}
                  onChange={(event) => setGood(event.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="pilot-annoying">
                  Wat was irritant?
                </label>
                <textarea
                  id="pilot-annoying"
                  rows={2}
                  className="field resize-none"
                  value={annoying}
                  onChange={(event) => setAnnoying(event.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="pilot-missing">
                  Welke functie miste je?
                </label>
                <textarea
                  id="pilot-missing"
                  rows={2}
                  className="field resize-none"
                  value={missing}
                  onChange={(event) => setMissing(event.target.value)}
                />
              </div>
              <div>
                <span className="label">Hoe waarschijnlijk raden jullie FamilyFlow aan?</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={score === value}
                      onClick={() => setScore(value)}
                      className={cx(
                        "h-10 w-10 rounded-full border text-sm font-medium transition",
                        score === value
                          ? "border-primary bg-primary text-white"
                          : "border-line bg-surface text-muted hover:border-sage-dark",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="pilot-extra">
                  Verder nog iets? (optioneel)
                </label>
                <textarea
                  id="pilot-extra"
                  rows={2}
                  className="field resize-none"
                  value={extra}
                  onChange={(event) => setExtra(event.target.value)}
                />
              </div>
              <Button fullWidth size="lg" onClick={submit} disabled={!familyName.trim()}>
                Feedback versturen
              </Button>
            </Card>
          </section>
        </div>
      )}

      {data.pilotFeedback.length > 0 ? (
        <section className="mt-10">
          <SectionTitle>Eerder ingestuurd</SectionTitle>
          <div className="space-y-3">
            {data.pilotFeedback
              .slice()
              .reverse()
              .map((entry) => (
                <Card key={entry.id}>
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium text-ink">{entry.familyName}</p>
                    <span className="text-sm text-muted">{entry.score}/10</span>
                  </div>
                  {entry.good ? <p className="mt-2 text-sm text-muted">Goed: {entry.good}</p> : null}
                  {entry.annoying ? <p className="mt-1 text-sm text-muted">Irritant: {entry.annoying}</p> : null}
                </Card>
              ))}
          </div>
        </section>
      ) : null}

      <p className="mt-10 text-xs leading-relaxed text-muted">
        Feedback wordt in deze versie lokaal opgeslagen zodat pilotgezinnen later te herkennen zijn aan
        hun pilotcode. FamilyFlow is een ondersteunende gezinscoach en geen medisch diagnostisch of
        behandelplatform.
      </p>
    </main>
  );
}
