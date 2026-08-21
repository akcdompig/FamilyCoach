"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FlowMark } from "@/components/FlowMark";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deriveCoachProfile } from "@/lib/ai/fallback";
import { createEmptyData, starterTasks } from "@/lib/demo-data";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { AppData, IntakeAnswers, Person, Role } from "@/lib/types";
import { cx, uid } from "@/lib/utils";

const COLORS = ["#315C4A", "#4C7A65", "#E5B96A", "#C2913F", "#6E7973"];

const STRUGGLES = [
  "ochtendroutine",
  "huiswerk",
  "schermtijd",
  "avondroutine",
  "opruimen",
  "sporten",
  "slapen",
  "communicatie",
];
const GOING_WELL = ["samen eten", "sporten", "weekenden", "school", "vriendschappen", "humor"];
const DISCUSSIONS = ["schermtijd", "ochtend", "huiswerk", "bedtijd", "taken in huis"];
const LESS_NAGGING = ["huiswerk", "tas klaarmaken", "opstaan", "opruimen", "telefoon wegleggen"];
const STRENGTHS = ["humor", "sportief", "creatief", "behulpzaam", "doorzetter", "sociaal", "nieuwsgierig"];
const MOTIVATORS = ["punten", "complimenten", "tijd samen", "autonomie", "kleine doelen", "uitdaging"];
const FOCUS = ["rustigere ochtend", "zelfstandig huiswerk starten", "meer bewegen", "minder schermdiscussie", "beter slapen"];
const INTERESTS = ["voetbal", "gamen", "muziek", "dansen", "tekenen", "dieren", "lezen", "koken", "buiten spelen"];

interface ChildDraft {
  key: string;
  name: string;
  age: string;
  interests: string[];
  school: string;
  likes: string;
  hard: string;
}

const emptyChild = (): ChildDraft => ({
  key: uid("draft"),
  name: "",
  age: "",
  interests: [],
  school: "",
  likes: "",
  hard: "",
});

const DEFAULT_INTAKE: IntakeAnswers = {
  struggles: [],
  goingWell: [],
  morning: 3,
  evening: 3,
  school: 3,
  screen: 3,
  sleep: 3,
  movement: "matig",
  existingAgreements: "",
  forgottenAgreements: "",
  discussions: [],
  lessNagging: [],
  strengths: [],
  motivators: [],
  focusFourWeeks: [],
};

function Chips({
  options,
  value,
  onChange,
  max,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() =>
              onChange(
                active
                  ? value.filter((item) => item !== option)
                  : max && value.length >= max
                    ? value
                    : [...value, option],
              )
            }
            className={cx("chip", active && "chip-active")}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const words = ["moeizaam", "wisselend", "redelijk", "goed", "heel goed"];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm text-muted">{words[value - 1]}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-primary"
        aria-label={label}
      />
    </div>
  );
}

export default function OnboardingPage() {
  const { replaceAll } = useFamilyFlow();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("parent");
  const [familyName, setFamilyName] = useState("");
  const [parentName, setParentName] = useState("");
  const [kids, setKids] = useState<ChildDraft[]>([emptyChild()]);
  const [intake, setIntake] = useState<IntakeAnswers>(DEFAULT_INTAKE);
  const [busy, setBusy] = useState(false);

  const steps = ["Welkom", "Rol", "Gezin", "Kinderen", "Intake", "Focus", "Klaar"];
  const progress = Math.round((step / (steps.length - 1)) * 100);

  const patchKid = (key: string, patch: Partial<ChildDraft>) =>
    setKids((current) => current.map((kid) => (kid.key === key ? { ...kid, ...patch } : kid)));

  const canContinue = useMemo(() => {
    if (step === 2) return familyName.trim().length > 1 && parentName.trim().length > 1;
    if (step === 3) return kids.every((kid) => kid.name.trim().length > 0);
    return true;
  }, [step, familyName, parentName, kids]);

  async function finish() {
    setBusy(true);
    const base: AppData = createEmptyData();
    const familyId = base.family.id;

    const parent: Person = {
      id: uid("per"),
      familyId,
      name: parentName.trim() || "Ouder",
      role: "parent",
      color: COLORS[0],
      interests: [],
      createdAt: new Date().toISOString(),
    };

    const childPeople: Person[] = kids
      .filter((kid) => kid.name.trim())
      .map((kid, index) => ({
        id: uid("per"),
        familyId,
        name: kid.name.trim(),
        role: "child" as const,
        age: kid.age ? Number(kid.age) : undefined,
        color: COLORS[(index + 2) % COLORS.length],
        interests: kid.interests,
        school: kid.school || undefined,
        likes: kid.likes || undefined,
        hard: kid.hard || undefined,
        createdAt: new Date().toISOString(),
      }));

    const ages = childPeople.map((child) => child.age ?? 0).filter(Boolean);
    let profile = deriveCoachProfile(familyId, intake, ages);

    // Als er een AI-provider is geconfigureerd, verrijkt die het profiel.
    // Zonder key of bij een fout blijft het afgeleide profiel staan.
    try {
      const summary = [
        `knelpunten: ${intake.struggles.join(", ")}`,
        `gaat goed: ${intake.goingWell.join(", ")}`,
        `discussies: ${intake.discussions.join(", ")}`,
        `minder achteraan zitten bij: ${intake.lessNagging.join(", ")}`,
        `motiveert: ${intake.motivators.join(", ")}`,
        `doelen: ${intake.focusFourWeeks.join(", ")}`,
      ].join("; ");
      const res = await fetch("/api/coach/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ summary, ages }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        focusAreas?: string[];
        motivation?: string[];
        tone?: string[];
        summary?: string;
      };
      if (json.ok && json.summary) {
        profile = {
          familyId,
          focusAreas: json.focusAreas?.length ? json.focusAreas : profile.focusAreas,
          motivation: json.motivation?.length ? json.motivation : profile.motivation,
          tone: json.tone?.length ? json.tone : profile.tone,
          summary: json.summary,
          source: "ai",
        };
      }
    } catch {
      // stilte is prima: het regelprofiel is al gevuld
    }

    const next: AppData = {
      ...base,
      onboarded: true,
      isDemo: false,
      activePersonId: role === "child" && childPeople[0] ? childPeople[0].id : parent.id,
      family: { ...base.family, name: familyName.trim() || "Ons gezin" },
      people: [parent, ...childPeople],
      intake: { id: uid("intake"), familyId, answers: intake, createdAt: new Date().toISOString() },
      coachProfile: { ...profile, id: uid("prof"), createdAt: new Date().toISOString() },
      tasks: childPeople.flatMap((child) => starterTasks(familyId, child.id, profile.focusAreas)),
      rewards: [
        { id: uid("rw"), familyId, title: "Filmavond kiezen", cost: 50, type: "autonomie", createdAt: new Date().toISOString() },
        { id: uid("rw"), familyId, title: "Favoriete maaltijd kiezen", cost: 75, type: "autonomie", createdAt: new Date().toISOString() },
        { id: uid("rw"), familyId, title: "Activiteit met papa of mama", cost: 100, type: "tijd", createdAt: new Date().toISOString() },
      ],
      activities: [
        {
          id: uid("act"),
          familyId,
          title: "20 minuten samen wandelen",
          description: "Na het eten een blokje om. Telefoons blijven thuis.",
          date: new Date().toISOString().slice(0, 10),
          points: 10,
          completedBy: [],
          createdAt: new Date().toISOString(),
        },
      ],
    };

    replaceAll(next);
    setBusy(false);
    setStep(6);
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-10">
      <div className="flex items-center gap-3">
        <FlowMark size={32} calm />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sage">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-16 text-right text-xs text-muted">
          {step + 1}/{steps.length}
        </span>
      </div>

      <div className="mt-10 animate-fade-up" key={step}>
        {step === 0 ? (
          <section>
            <h1 className="text-3xl font-semibold leading-tight text-ink">Welkom bij FamilyFlow</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Geen perfecte gezinnen. Wel gezinnen die samen willen groeien.
            </p>
            <Card tone="sage" className="mt-8">
              <p className="text-[15px] leading-relaxed text-ink">
                In een paar minuten stel je jullie gezin in. Daarna stelt Flow een coachprofiel voor
                dat past bij waar jullie nu staan. Je kunt alles later aanpassen.
              </p>
            </Card>
          </section>
        ) : null}

        {step === 1 ? (
          <section>
            <h1 className="text-2xl font-semibold text-ink">Wie ben je?</h1>
            <div className="mt-6 space-y-3">
              {(
                [
                  { value: "parent", title: "Ouder", body: "Je beheert het gezin en stelt afspraken in." },
                  { value: "child", title: "Kind of tiener", body: "Je ziet je eigen dag, doelen en punten." },
                  { value: "coach", title: "Coach", body: "Je begeleidt later meerdere gezinnen." },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                  className={cx(
                    "w-full rounded-3xl border p-5 text-left transition",
                    role === option.value
                      ? "border-primary bg-sage-light shadow-soft"
                      : "border-line bg-surface hover:border-sage-dark",
                  )}
                >
                  <p className="font-semibold text-ink">{option.title}</p>
                  <p className="mt-1 text-sm text-muted">{option.body}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <h1 className="text-2xl font-semibold text-ink">Jullie gezin</h1>
            <div className="mt-6 space-y-5">
              <div>
                <label className="label" htmlFor="familyName">
                  Gezinsnaam
                </label>
                <input
                  id="familyName"
                  className="field"
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                  placeholder="Familie Jansen"
                />
              </div>
              <div>
                <label className="label" htmlFor="parentName">
                  Jouw naam
                </label>
                <input
                  id="parentName"
                  className="field"
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  placeholder="Pim"
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <h1 className="text-2xl font-semibold text-ink">Wie horen erbij?</h1>
            <p className="mt-2 text-sm text-muted">
              Alleen wat nodig is om de coach te laten kloppen. Je kunt later aanvullen.
            </p>
            <div className="mt-6 space-y-4">
              {kids.map((kid, index) => (
                <Card key={kid.key}>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Kind {index + 1}
                    </p>
                    {kids.length > 1 ? (
                      <button
                        type="button"
                        className="text-sm text-muted hover:text-ink hover:underline"
                        onClick={() => setKids((current) => current.filter((item) => item.key !== kid.key))}
                      >
                        Verwijderen
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor={`name-${kid.key}`}>
                        Naam
                      </label>
                      <input
                        id={`name-${kid.key}`}
                        className="field"
                        value={kid.name}
                        onChange={(event) => patchKid(kid.key, { name: event.target.value })}
                        placeholder="Laura"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`age-${kid.key}`}>
                        Leeftijd
                      </label>
                      <input
                        id={`age-${kid.key}`}
                        className="field"
                        inputMode="numeric"
                        value={kid.age}
                        onChange={(event) => patchKid(kid.key, { age: event.target.value.replace(/\D/g, "") })}
                        placeholder="13"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="label">Interesses</span>
                    <Chips
                      options={INTERESTS}
                      value={kid.interests}
                      onChange={(next) => patchKid(kid.key, { interests: next })}
                      max={5}
                    />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor={`school-${kid.key}`}>
                        School of groep
                      </label>
                      <input
                        id={`school-${kid.key}`}
                        className="field"
                        value={kid.school}
                        onChange={(event) => patchKid(kid.key, { school: event.target.value })}
                        placeholder="Brugklas"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor={`likes-${kid.key}`}>
                        Waar wordt hij of zij blij van?
                      </label>
                      <input
                        id={`likes-${kid.key}`}
                        className="field"
                        value={kid.likes}
                        onChange={(event) => patchKid(kid.key, { likes: event.target.value })}
                        placeholder="Voetbal met vrienden"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="label" htmlFor={`hard-${kid.key}`}>
                      Wat vindt hij of zij moeilijk?
                    </label>
                    <input
                      id={`hard-${kid.key}`}
                      className="field"
                      value={kid.hard}
                      onChange={(event) => patchKid(kid.key, { hard: event.target.value })}
                      placeholder="Op tijd beginnen in de ochtend"
                    />
                  </div>
                </Card>
              ))}
              <Button variant="secondary" fullWidth onClick={() => setKids((current) => [...current, emptyChild()])}>
                Nog een kind toevoegen
              </Button>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section>
            <h1 className="text-2xl font-semibold text-ink">Hoe gaat het nu?</h1>
            <p className="mt-2 text-sm text-muted">Er zijn geen goede of foute antwoorden.</p>
            <div className="mt-6 space-y-6">
              <div>
                <span className="label">Waar lopen jullie tegenaan?</span>
                <Chips
                  options={STRUGGLES}
                  value={intake.struggles}
                  onChange={(next) => setIntake({ ...intake, struggles: next })}
                />
              </div>
              <div>
                <span className="label">Waar gaat het juist goed?</span>
                <Chips
                  options={GOING_WELL}
                  value={intake.goingWell}
                  onChange={(next) => setIntake({ ...intake, goingWell: next })}
                />
              </div>
              <Card tone="sage" className="space-y-5">
                <Slider label="De ochtend" value={intake.morning} onChange={(v) => setIntake({ ...intake, morning: v })} />
                <Slider label="De avond" value={intake.evening} onChange={(v) => setIntake({ ...intake, evening: v })} />
                <Slider label="School en huiswerk" value={intake.school} onChange={(v) => setIntake({ ...intake, school: v })} />
                <Slider label="Schermgebruik" value={intake.screen} onChange={(v) => setIntake({ ...intake, screen: v })} />
                <Slider label="Slaap en rust" value={intake.sleep} onChange={(v) => setIntake({ ...intake, sleep: v })} />
                <div>
                  <span className="label">Hoeveel beweging is er?</span>
                  <div className="flex gap-2">
                    {(["weinig", "matig", "veel"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={intake.movement === option}
                        onClick={() => setIntake({ ...intake, movement: option })}
                        className={cx("chip", intake.movement === option && "chip-active")}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
              <div>
                <label className="label" htmlFor="existing">
                  Welke afspraken bestaan al?
                </label>
                <textarea
                  id="existing"
                  rows={2}
                  className="field resize-none"
                  value={intake.existingAgreements}
                  onChange={(event) => setIntake({ ...intake, existingAgreements: event.target.value })}
                  placeholder="Telefoon uit de slaapkamer, om 21:45 naar bed."
                />
              </div>
              <div>
                <label className="label" htmlFor="forgotten">
                  Welke afspraken worden vaak vergeten?
                </label>
                <textarea
                  id="forgotten"
                  rows={2}
                  className="field resize-none"
                  value={intake.forgottenAgreements}
                  onChange={(event) => setIntake({ ...intake, forgottenAgreements: event.target.value })}
                  placeholder="Tas klaarzetten."
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <section>
            <h1 className="text-2xl font-semibold text-ink">Waar wil je naartoe?</h1>
            <div className="mt-6 space-y-6">
              <div>
                <span className="label">Waar ontstaan de meeste discussies?</span>
                <Chips
                  options={DISCUSSIONS}
                  value={intake.discussions}
                  onChange={(next) => setIntake({ ...intake, discussions: next })}
                />
              </div>
              <div>
                <span className="label">Waar wil je minder achteraan zitten?</span>
                <Chips
                  options={LESS_NAGGING}
                  value={intake.lessNagging}
                  onChange={(next) => setIntake({ ...intake, lessNagging: next })}
                />
              </div>
              <div>
                <span className="label">Positieve eigenschappen van je kind(eren)</span>
                <Chips
                  options={STRENGTHS}
                  value={intake.strengths}
                  onChange={(next) => setIntake({ ...intake, strengths: next })}
                />
              </div>
              <div>
                <span className="label">Wat motiveert het meest?</span>
                <Chips
                  options={MOTIVATORS}
                  value={intake.motivators}
                  onChange={(next) => setIntake({ ...intake, motivators: next })}
                />
              </div>
              <div>
                <span className="label">Wat is de komende 4 weken belangrijk?</span>
                <Chips
                  options={FOCUS}
                  value={intake.focusFourWeeks}
                  onChange={(next) => setIntake({ ...intake, focusFourWeeks: next })}
                  max={3}
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === 6 ? (
          <section className="text-center">
            <div className="mx-auto w-fit">
              <FlowMark size={56} />
            </div>
            <h1 className="mt-6 text-2xl font-semibold text-ink">Jullie profiel staat klaar</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Flow houdt hier rekening mee bij elk bericht. Je kunt het profiel altijd bekijken en
              aanpassen bij Profiel.
            </p>
            <Card className="mt-8 text-left">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
                Coachprofiel
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">
                {deriveCoachProfile("preview", intake, []).summary}
              </p>
            </Card>
            <Button
              size="lg"
              fullWidth
              className="mt-8"
              onClick={() => router.push(role === "child" ? "/kind" : role === "coach" ? "/coach" : "/ouder")}
            >
              Naar mijn dashboard
            </Button>
          </section>
        ) : null}
      </div>

      {step < 6 ? (
        <div className="mt-10 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? router.push("/") : setStep((current) => current - 1))}
          >
            Terug
          </Button>
          <Button
            size="lg"
            disabled={!canContinue || busy}
            onClick={() => (step === 5 ? void finish() : setStep((current) => current + 1))}
          >
            {busy ? "Flow denkt na…" : step === 5 ? "Profiel maken" : "Verder"}
          </Button>
        </div>
      ) : null}

      <p className="mt-10 text-xs leading-relaxed text-muted">
        FamilyFlow is een ondersteunende gezinscoach en geen medisch diagnostisch of behandelplatform.
        Je gegevens blijven in deze versie op dit apparaat staan.
      </p>
    </main>
  );
}
