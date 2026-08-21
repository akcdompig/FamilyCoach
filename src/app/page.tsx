"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FlowMark } from "@/components/FlowMark";
import { Button } from "@/components/ui/Button";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import { cx } from "@/lib/utils";

const CHALLENGES = [
  "emotieregulatie en impulsiviteit",
  "conflicten tussen broers en zussen",
  "grenzen, planning en verantwoordelijkheid",
  "schoolwerk en motivatie",
  "sociale situaties en teleurstelling",
];

const PILLARS = [
  {
    emoji: "🏠",
    title: "Gezin",
    body: "Samen afspraken maken en doelen bepalen — structuur die van het gezin zelf is, niet opgelegd.",
  },
  {
    emoji: "🧠",
    title: "Coaching",
    body: "Leren omgaan met emoties, conflicten en keuzes, met een digitale coach die meedenkt op het moment zelf.",
  },
  {
    emoji: "📈",
    title: "Groei",
    body: "Inzicht in ontwikkeling en positieve vooruitgang — voor het kind, de ouders en wie het gezin begeleidt.",
  },
];

const FOR_CHILD = [
  "leert reflecteren op eigen gedrag",
  "oefent sociale vaardigheden in een veilige context",
  "leert emoties herkennen en benoemen",
  "ontwikkelt verantwoordelijkheid in kleine stappen",
  "krijgt directe, positieve feedback",
  "leert conflicten constructief oplossen",
];
const FOR_PARENTS = [
  "meer structuur, minder dagelijkse strijd",
  "concrete handvatten op lastige momenten",
  "beter inzicht in patronen door de week heen",
  "ondersteuning ook als er even geen tijd is",
  "een positieve, niet-belerende toon om op terug te vallen",
];
const FOR_PROFESSIONALS = [
  "zicht op dagelijkse situaties tussen begeleidingsmomenten in",
  "gestructureerde voortgang per gezin, per week",
  "maandelijkse inzichten in plaats van losse momentopnames",
  "meer continuïteit tussen gesprekken",
  "gezamenlijk doelen kunnen volgen met het gezin",
];

const PILOT_METRICS = [
  { label: "Afspraken nagekomen", value: "+24%" },
  { label: "Conflict-escalaties", value: "-31%" },
  { label: "Zelfstandigheid", value: "+18%" },
  { label: "Positieve ouder-kind interacties", value: "+22%" },
];

function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cx("mx-auto max-w-5xl px-6", className)}>
      {children}
    </section>
  );
}

export default function LandingPage() {
  const { data, loadDemo, update } = useFamilyFlow();
  const router = useRouter();

  useEffect(() => {
    if (!data.onboarded) return;
    const person = data.people.find((p) => p.id === data.activePersonId) ?? data.people[0];
    router.replace(person?.role === "child" ? "/kind" : "/ouder");
  }, [data.onboarded, data.activePersonId, data.people, router]);

  function openDemoFamily() {
    loadDemo();
    router.push("/ouder");
  }

  function startOwnFamily() {
    update((d) => {
      d.onboarded = false;
    });
    router.push("/onboarding");
  }

  return (
    <main className="min-h-screen bg-paper">
      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FlowMark size={30} calm />
            <span className="text-[15px] font-semibold tracking-tight text-ink">FamilyFlow</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted sm:flex">
            <a href="#hoe-het-werkt" className="hover:text-ink">Hoe het werkt</a>
            <a href="#professionals" className="hover:text-ink">Voor professionals</a>
            <a href="#pilot" className="hover:text-ink">Pilot</a>
          </nav>
          <Button size="sm" onClick={() => router.push("/demo")}>
            Start demo
          </Button>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <Section className="animate-fade-up pb-16 pt-16 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          Digitale gezinscoach
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
          Samen groeien.
          <br />
          <span className="text-primary">Stap voor stap.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          FamilyFlow helpt gezinnen met structuur, afspraken, communicatie en persoonlijke coaching —
          ondersteund door AI.
        </p>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
          Van dagelijkse afspraken en schooldoelen tot conflicten en emoties: FamilyFlow helpt kinderen
          leren omgaan met situaties, en helpt ouders om op een positieve en consequente manier te
          begeleiden.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => router.push("/demo")}>
            🚀 Start interactieve demo
          </Button>
          <Button size="lg" variant="secondary" onClick={() => document.getElementById("hoe-het-werkt")?.scrollIntoView({ behavior: "smooth" })}>
            Bekijk hoe FamilyFlow werkt
          </Button>
        </div>

        {/* Visual: fictief gezinsdashboard-fragment */}
        <div className="relative mt-14 overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-lift sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Voorbeeld — Familie Jansen (demo)</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-sage-light p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Vandaag</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                Laura ✓ huiswerk · ✓ sport · ⚠️ conflict met Milan — inmiddels besproken
              </p>
            </div>
            <div className="rounded-2xl bg-sand-light p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Family Coach</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                &ldquo;Je wilde eigenlijk dat Milan je spullen respecteerde. We keken samen naar een
                rustigere manier om dat te zeggen.&rdquo;
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-line p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Deze week</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">🟢 Structuur · 🟡 School · 🟢 Communicatie</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- Probleemstelling ---------- */}
      <Section className="py-16">
        <div className="rounded-3xl bg-ink px-6 py-12 text-paper sm:px-12 sm:py-16">
          <p className="max-w-2xl text-2xl font-semibold leading-snug sm:text-3xl">
            Opvoeden is belangrijk. Maar opvoeden is ook zwaar.
          </p>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-paper/75">
            Ouders combineren werk, huishouden, school, afspraken, sociale verplichtingen en de zorg voor
            hun kinderen. Daardoor ontstaat niet altijd een gebrek aan liefde of betrokkenheid, maar soms
            simpelweg een gebrek aan tijd, overzicht en consequentie.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-paper/75">
            Tegelijkertijd hebben kinderen soms extra ondersteuning nodig bij:
          </p>
          <ul className="mt-4 grid max-w-2xl gap-2 sm:grid-cols-2">
            {CHALLENGES.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[15px] text-paper/90">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-paper/75">
            FamilyFlow helpt ouders om juist op die momenten ondersteuning te bieden — niet als vervanging
            van opvoeding of begeleiding, maar als aanvulling erop.
          </p>
        </div>
      </Section>

      {/* ---------- Drie pijlers ---------- */}
      <Section id="hoe-het-werkt" className="py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Hoe het werkt</p>
        <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-ink">
          Eén digitale laag rondom het gezin
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="rounded-3xl border border-line bg-surface p-6">
              <span className="text-3xl">{pillar.emoji}</span>
              <p className="mt-4 text-lg font-semibold text-ink">{pillar.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{pillar.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-muted">
          Flow, de digitale coach binnen FamilyFlow, kent binnen elk gezin de afspraken, doelen en eerdere
          gesprekken. Flow stelt vragen, luistert, biedt keuzes aan en helpt een kind een concrete
          volgende stap te zetten — als coach, nooit als diagnose-instrument.
        </p>
      </Section>

      {/* ---------- Voor professionals ---------- */}
      <Section id="professionals" className="py-16">
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Voor professionals</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-ink">
            Ondersteuning tussen begeleidingsmomenten in
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            Een professional kan een gezin begeleiden tijdens een gesprek. FamilyFlow helpt het gezin ook
            op de momenten daartussen — thuis, aan de keukentafel, na school, tussen broers en zussen.
            FamilyFlow vervangt de begeleider niet: het versterkt menselijke begeleiding door structuur,
            reflectie en coaching ook buiten die momenten beschikbaar te maken.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Voor het kind</p>
              <ul className="mt-3 space-y-2">
                {FOR_CHILD.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Voor ouders</p>
              <ul className="mt-3 space-y-2">
                {FOR_PARENTS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Voor professionals</p>
              <ul className="mt-3 space-y-2">
                {FOR_PROFESSIONALS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mini-preview gezinsoverzicht */}
          <div className="mt-10 rounded-2xl bg-sage-light p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">Voorbeeld — Gezinsoverzicht (professional-weergave)</p>
              <Link href="/coach" className="text-sm font-medium text-primary hover:underline">
                Bekijk live →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
              {[
                ["Structuur", "🟢"],
                ["Afspraken", "🟢"],
                ["School", "🟡"],
                ["Communicatie", "🟡"],
                ["Conflicten", "🟠"],
                ["Ontwikkeling", "🟢"],
              ].map(([label, dot]) => (
                <div key={label} className="rounded-xl bg-surface px-3 py-2.5 text-center">
                  <p className="text-lg">{dot}</p>
                  <p className="mt-1 text-[11px] font-medium text-muted">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Voorbeelddata uit het demo-gezin, geen echte cliëntgegevens.</p>
          </div>
        </div>
      </Section>

      {/* ---------- Pilot / preventieve jeugdhulp ---------- */}
      <Section id="pilot" className="py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Samen bouwen</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-ink">
          Samen bouwen aan preventieve jeugdhulp
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
          FamilyFlow is ontwikkeld vanuit de gedachte dat vroegtijdige ondersteuning kan helpen voorkomen
          dat kleine problemen uitgroeien tot grotere problemen. Door gezinnen dagelijks te ondersteunen
          bij structuur, communicatie, verantwoordelijkheid en sociale vaardigheden ontstaat een
          laagdrempelige aanvulling op bestaande begeleiding.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-surface p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Mogelijke pilot</p>
            <dl className="mt-4 space-y-3 text-[15px] text-ink">
              <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">Omvang</dt><dd className="font-medium">10 gezinnen</dd></div>
              <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">Duur</dt><dd className="font-medium">12 weken</dd></div>
              <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">Opzet</dt><dd className="font-medium">Begeleiding + FamilyFlow</dd></div>
              <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">Meting</dt><dd className="font-medium">Voor- en nameting</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Afronding</dt><dd className="font-medium">Evaluatie + rapportage</dd></div>
            </dl>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Voorbeeld FamilyFlow-pilot</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {PILOT_METRICS.map((metric) => (
                <div key={metric.label}>
                  <p className="text-2xl font-semibold text-primary">{metric.value}</p>
                  <p className="mt-1 text-xs leading-snug text-muted">{metric.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Voorbeelddata ter illustratie — niet gebaseerd op een daadwerkelijke studie.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- Slot CTA ---------- */}
      <Section className="pb-24 pt-8">
        <div className="rounded-3xl bg-primary px-6 py-14 text-center text-white sm:px-12">
          <h2 className="mx-auto max-w-xl text-3xl font-semibold leading-snug tracking-tight">
            Klaar om gezinnen sterker te ondersteunen?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">
            FamilyFlow is ontwikkeld om gezinnen niet alleen te helpen wanneer het misgaat, maar juist ook
            om kinderen en ouders dagelijks te ondersteunen bij de kleine momenten die uiteindelijk het
            grootste verschil kunnen maken.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/pilot">
              <Button size="lg" variant="secondary">Start een pilot</Button>
            </Link>
            <Link href="/pilot">
              <Button size="lg" variant="secondary">Plan een demonstratie</Button>
            </Link>
            <Button size="lg" variant="secondary" onClick={openDemoFamily}>
              Ontdek FamilyFlow
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted">Al een gezin dat FamilyFlow gebruikt?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={openDemoFamily} className="text-sm font-medium text-primary hover:underline">
              Bekijk het demogezin
            </button>
            <span className="text-line">·</span>
            <button type="button" onClick={startOwnFamily} className="text-sm font-medium text-primary hover:underline">
              Ons eigen gezin instellen
            </button>
          </div>
        </div>

        <p className="mx-auto mt-14 max-w-xl text-center text-xs leading-relaxed text-muted">
          FamilyFlow is een ondersteunende gezinscoach en geen medisch diagnostisch of behandelplatform.
          Flow stelt geen diagnoses. Bij zorgen over de veiligheid van een kind verwijst Flow altijd naar
          een vertrouwde volwassene of passende professionele hulp.{" "}
          <Link href="/pilot" className="underline underline-offset-4 hover:text-ink">
            Feedback of vragen?
          </Link>
        </p>
      </Section>
    </main>
  );
}
