"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlowMark } from "@/components/FlowMark";
import { Button } from "@/components/ui/Button";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";

const LAURA_ID = "per_laura";

interface DemoStep {
  number: number;
  title: string;
  body: string;
  cta: string;
  personId?: string;
  path: string;
}

const STEPS: DemoStep[] = [
  {
    number: 1,
    title: "Het gezin maakt afspraken",
    body: "Pim en Vanessa stellen samen met Laura (13) en Milan (10) afspraken op: huiswerk vóór gamen, telefoon tijdens het eten weg, kamer opgeruimd vóór zaterdagavond, respectvol communiceren. FamilyFlow bewaart deze afspraken en houdt ze zichtbaar voor het hele gezin.",
    cta: "Bekijk het gezin",
    path: "/ouder/gezin",
  },
  {
    number: 2,
    title: "Het kind krijgt verantwoordelijkheid",
    body: "Laura ziet haar eigen dag en week: welke afspraken open staan, wat al gelukt is, en wat ze zelf kan plannen. Niet als controlemiddel, maar als overzicht dat van haarzelf is.",
    cta: "Bekijk Laura's dag",
    personId: LAURA_ID,
    path: "/kind",
  },
  {
    number: 3,
    title: "Er ontstaat een conflict",
    body: "Milan pakt Laura's spullen zonder te vragen. Laura is boos en meldt dit bij Flow, de digitale coach van FamilyFlow.",
    cta: "Start de conflict-situatie",
    personId: LAURA_ID,
    path: "/kind/conflict",
  },
  {
    number: 4,
    title: "Family Coach interveniëert",
    body: "Flow stelt vragen: wat gebeurde er, wat voelde je, wat wilde je eigenlijk bereiken? Op basis daarvan volgt een kindvriendelijke analyse — geen oordeel, wel duiding.",
    cta: "Doorloop het gesprek",
    personId: LAURA_ID,
    path: "/kind/conflict",
  },
  {
    number: 5,
    title: "Laura oefent de oplossing",
    body: "In plaats van ‘Jij pakt altijd mijn spullen!’ oefent Laura een rustigere formulering, en speelt Flow desgewenst even Milan om het gesprek veilig te oefenen voordat het echt gebeurt.",
    cta: "Oefen het gesprek",
    personId: LAURA_ID,
    path: "/kind/conflict",
  },
  {
    number: 6,
    title: "Voortgang wordt zichtbaar",
    body: "Niet alleen het conflict, maar ook de manier waarop Laura het oploste telt mee: rustig communiceren, luisteren, een excuus aanbieden. FamilyFlow noemt dit Family Skills — bewust losstaand van gewone punten.",
    cta: "Bekijk voortgang",
    personId: LAURA_ID,
    path: "/kind/profiel",
  },
  {
    number: 7,
    title: "De begeleider ziet het grotere plaatje",
    body: "Een jeugdcoach of begeleider ziet geen los incident, maar een patroon over de weken heen: structuur, communicatie en conflicten in één overzicht, aangevuld met een maandrapportage.",
    cta: "Bekijk professional-dashboard",
    path: "/coach",
  },
];

export default function DemoPage() {
  const { loadDemo, setActivePerson } = useFamilyFlow();
  const router = useRouter();

  function goTo(step: DemoStep) {
    loadDemo();
    if (step.personId) setActivePerson(step.personId);
    router.push(step.path);
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line/70 bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link href="/" className="text-sm text-muted hover:text-ink hover:underline">
            ← Terug naar FamilyFlow
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <FlowMark size={36} calm />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Interactieve demo</p>
              <h1 className="text-2xl font-semibold leading-tight text-ink sm:text-3xl">Demo — Familie Jansen</h1>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Een volledig fictief gezin, gebruikt om FamilyFlow te laten zien. Loop de zeven stappen door in
            volgorde, of spring direct naar wat je wilt zien — elke stap opent de echte, werkende
            applicatie, niet een schermafbeelding.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <ol className="space-y-4">
          {STEPS.map((step) => (
            <li key={step.number} className="flex gap-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-semibold text-primary-dark">
                {step.number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-ink">{step.title}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{step.body}</p>
                <Button size="sm" variant="soft" className="mt-4" onClick={() => goTo(step)}>
                  {step.cta} →
                </Button>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-dashed border-line p-5 text-sm leading-relaxed text-muted">
          Elke stap laadt het demo-gezin (Familie Jansen, volledig fictief) en opent het bijbehorende
          scherm in de echte applicatie. Gebruik de navigatie in de app, of kom hierheen terug voor de
          volgende stap in het verhaal.
        </div>
      </div>
    </main>
  );
}
