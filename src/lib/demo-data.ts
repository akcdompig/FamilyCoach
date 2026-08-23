import type { AppData, Completion, CheckIn, Mood, Task } from "@/lib/types";
import { addDays, dateKey, isTaskOnDay, uid } from "@/lib/utils";

export const DEFAULT_SETTINGS: AppData["settings"] = {
  quietFrom: "21:30",
  quietTo: "07:00",
  maxMomentsPerDay: 3,
  minGapMinutes: 90,
  aiEnabled: true,
  shareInterestsWithAI: true,
};

const now = () => new Date().toISOString();

/**
 * Demo-gezin — volledig fictief, bedoeld om FamilyFlow te kunnen laten zien
 * aan organisaties zonder een echt gezin te tonen. Wordt bij een lege store
 * geladen ("Bekijk het demogezin") zodat niemand tegen een lege applicatie
 * aankijkt. De historie van 12 dagen wordt gegenereerd t.o.v. vandaag, zodat
 * het weekoverzicht altijd gevuld is.
 */
export function createDemoData(): AppData {
  const familyId = "fam_demo";
  const pim = "per_pim";
  const vanessa = "per_vanessa";
  const laura = "per_laura";
  const milan = "per_milan";

  const people: AppData["people"] = [
    {
      id: pim,
      familyId,
      name: "Pim",
      role: "parent",
      color: "#315C4A",
      interests: ["hardlopen", "koken"],
      createdAt: now(),
      avatarVariant: "adult-m",
    },
    {
      id: vanessa,
      familyId,
      name: "Vanessa",
      role: "parent",
      color: "#4C7A65",
      interests: ["wandelen"],
      createdAt: now(),
      avatarVariant: "adult-f",
    },
    {
      id: laura,
      familyId,
      name: "Laura",
      role: "child",
      age: 13,
      color: "#E5B96A",
      interests: ["voetbal", "muziek", "vriendinnen"],
      school: "Brugklas",
      likes: "Voetbal met vriendinnen, muziek uitzoeken",
      hard: "Op tijd beginnen met huiswerk en omgaan met frustratie",
      createdAt: now(),
      avatarVariant: "teen-f",
    },
    {
      id: milan,
      familyId,
      name: "Milan",
      role: "child",
      age: 10,
      color: "#C2913F",
      interests: ["gamen", "voetbal", "buiten spelen"],
      school: "Groep 7",
      likes: "Gamen, voetballen met vrienden",
      hard: "Wachten op zijn beurt en dingen delen",
      createdAt: now(),
      avatarVariant: "child-m",
    },
  ];

  const school = [1, 2, 3, 4, 5];
  const week = [0, 1, 2, 3, 4, 5, 6];
  const saturday = [6];

  const t = (
    personId: string,
    title: string,
    category: Task["category"],
    time: string,
    days: number[],
    points: number,
  ): Task => ({
    id: uid("task"),
    familyId,
    personId,
    title,
    category,
    time,
    days,
    points,
    shared: false,
    active: true,
    createdAt: now(),
  });

  // Weerspiegelt de afspraken die het gezin samen heeft gemaakt (structuur,
  // schermtijd, verantwoordelijkheid, respectvolle communicatie).
  const lauraHomework = t(laura, "Huiswerk vóór gamen of tv", "school", "16:00", school, 10);
  const lauraPhoneAway = t(laura, "Telefoon tijdens het eten weg", "scherm", "18:00", week, 5);
  const milanPhoneAway = t(milan, "Telefoon/tablet tijdens het eten weg", "scherm", "18:00", week, 5);
  const milanChores = t(milan, "Speelgoed opruimen", "huishouden", "19:00", week, 5);

  const tasks: Task[] = [
    t(laura, "Ontbijten voor je vertrekt", "ochtend", "07:20", school, 5),
    lauraHomework,
    lauraPhoneAway,
    t(laura, "20 minuten bewegen", "beweging", "16:30", week, 10),
    t(laura, "Kamer opgeruimd vóór zaterdagavond", "huishouden", "18:00", saturday, 10),
    t(laura, "Tanden poetsen", "avond", "21:00", week, 5),
    t(milan, "Ontbijten en aankleden", "ochtend", "07:30", school, 5),
    t(milan, "Huiswerk/lezen vóór gamen", "school", "16:00", school, 10),
    milanPhoneAway,
    t(milan, "Buiten spelen of sporten", "beweging", "16:30", week, 10),
    milanChores,
    t(milan, "Tanden poetsen", "avond", "20:30", week, 5),
  ];

  const completions: Completion[] = [];
  const checkIns: CheckIn[] = [];
  const moods: Mood[] = ["good", "good", "ok", "good", "ok", "low", "good"];

  for (let i = 12; i >= 1; i -= 1) {
    const day = addDays(new Date(), -i);
    const key = dateKey(day);
    for (const person of [laura, milan]) {
      const dayTasks = tasks.filter((task) => task.personId === person && isTaskOnDay(task, day));
      // Laura wordt richting nu iets stabieler, Milan zit al hoog: dat geeft
      // het weekoverzicht een eerlijk verhaal in plaats van willekeurige ruis.
      const base = person === laura ? 0.55 + (12 - i) * 0.025 : 0.82;
      dayTasks.forEach((task, index) => {
        const bump = task.category === "school" && person === laura ? -0.15 : 0;
        if ((index * 7 + i * 13) % 100 < (base + bump) * 100) {
          completions.push({
            id: uid("cmp"),
            taskId: task.id,
            personId: person,
            date: key,
            completedAt: day.toISOString(),
          });
        }
      });
      if (i % 2 === 0 || person === milan) {
        checkIns.push({
          id: uid("chk"),
          personId: person,
          date: key,
          mood: moods[(i + (person === laura ? 0 : 3)) % moods.length],
          createdAt: day.toISOString(),
        });
      }
    }
  }

  const today = dateKey();

  return {
    version: 1,
    onboarded: false,
    isDemo: true,
    activePersonId: pim,
    family: { id: familyId, name: "Familie Jansen", createdAt: now(), pilotCode: "FAMILYFLOW-DEMO" },
    people,
    intake: {
      id: uid("intake"),
      familyId,
      createdAt: now(),
      answers: {
        struggles: ["ochtendroutine", "schermtijd", "huiswerk"],
        goingWell: ["samen eten", "sporten", "weekenden"],
        morning: 2,
        evening: 3,
        school: 3,
        screen: 2,
        sleep: 3,
        movement: "matig",
        existingAgreements: "Telefoon tijdens het eten weg, kamer opgeruimd voor zaterdagavond.",
        forgottenAgreements: "Huiswerk vóór gamen, tas klaarzetten.",
        discussions: ["schermtijd", "ochtend"],
        lessNagging: ["huiswerk", "opruimen"],
        strengths: ["humor", "sportief", "behulpzaam"],
        motivators: ["punten", "tijd samen", "kleine doelen"],
        focusFourWeeks: ["rustigere ochtend", "zelfstandig huiswerk starten"],
      },
    },
    coachProfile: {
      id: uid("prof"),
      familyId,
      focusAreas: ["ochtendroutine", "school", "beweging", "schermgebruik", "communicatie", "zelfstandigheid"],
      motivation: ["korte doelen", "punten", "positieve feedback"],
      tone: ["kort", "vriendelijk", "niet belerend", "humoristisch wanneer passend"],
      summary:
        "Uit de intake blijkt dat ochtendstructuur en huiswerk nu de meeste aandacht vragen. Samen eten en het weekend zijn juist sterke punten om op door te bouwen. Conflicten tussen Laura en Milan komen af en toe voor, vooral rond spullen en schermtijd.",
      createdAt: now(),
      source: "rules",
    },
    tasks,
    completions,
    checkIns,
    goals: [
      {
        id: uid("goal"),
        familyId,
        personId: laura,
        title: "Vier dagen op tijd met huiswerk beginnen",
        domain: "school",
        target: 4,
        unit: "dagen",
        progress: 0,
        points: 25,
        dueDate: dateKey(addDays(new Date(), 4)),
        createdAt: addDays(new Date(), -3).toISOString(),
        linkedTaskIds: [lauraHomework.id],
      },
      {
        id: uid("goal"),
        familyId,
        personId: milan,
        title: "Vijf keer speelgoed opruimen zonder herinnering",
        domain: "responsibility",
        target: 5,
        unit: "keer",
        progress: 0,
        points: 25,
        dueDate: dateKey(addDays(new Date(), 3)),
        createdAt: addDays(new Date(), -9).toISOString(),
        linkedTaskIds: [milanChores.id],
      },
      {
        id: uid("goal"),
        familyId,
        title: "Gezinsdoel: drie avonden telefoonvrij eten",
        domain: "relationships",
        target: 3,
        unit: "avonden",
        progress: 0,
        points: 50,
        dueDate: dateKey(addDays(new Date(), 6)),
        createdAt: addDays(new Date(), -6).toISOString(),
        linkedTaskIds: [lauraPhoneAway.id, milanPhoneAway.id],
      },
      {
        id: uid("goal"),
        familyId,
        personId: laura,
        title: "Drie boeken uitlezen deze maand",
        domain: "skills",
        target: 3,
        unit: "boeken",
        progress: 1,
        points: 30,
        dueDate: dateKey(addDays(new Date(), 14)),
        createdAt: addDays(new Date(), -8).toISOString(),
        reflections: [
          {
            id: uid("reflect"),
            text: "Het eerste boek ging sneller dan ik dacht. Ik lees het liefst vlak voor het slapen.",
            createdAt: addDays(new Date(), -2).toISOString(),
          },
        ],
      },
    ],
    rewards: [
      { id: uid("rw"), familyId, title: "Filmavond kiezen", cost: 50, type: "autonomie", createdAt: now() },
      { id: uid("rw"), familyId, title: "Favoriete maaltijd kiezen", cost: 75, type: "autonomie", createdAt: now() },
      { id: uid("rw"), familyId, title: "Activiteit met papa of mama", cost: 100, type: "tijd", createdAt: now() },
      { id: uid("rw"), familyId, title: "Een uur later opblijven in het weekend", cost: 60, type: "autonomie", createdAt: now() },
      { id: uid("rw"), familyId, title: "Samen naar het voetbalveld", cost: 90, type: "activiteit", createdAt: now() },
    ],
    redemptions: [],
    activities: [
      {
        id: uid("act"),
        familyId,
        title: "20 minuten samen wandelen",
        description: "Na het eten een blokje om. Telefoons blijven thuis.",
        date: today,
        points: 10,
        completedBy: [],
        createdAt: now(),
      },
      {
        id: uid("act"),
        familyId,
        title: "Iemand anders kiest het eten",
        description: "Vanavond mag Milan kiezen wat er op tafel komt.",
        date: dateKey(addDays(new Date(), 1)),
        points: 10,
        completedBy: [],
        createdAt: now(),
      },
      {
        id: uid("act"),
        familyId,
        title: "Weekendchallenge: samen 5.000 stappen",
        description: "Iedereen die meedoet vinkt af.",
        date: dateKey(addDays(new Date(), 3)),
        points: 25,
        completedBy: [],
        createdAt: now(),
      },
    ],
    messages: [],
    pilotFeedback: [],
    settings: DEFAULT_SETTINGS,
    wellnessLogs: [
      { id: uid("well"), familyId, personId: laura, kind: "water", value: 500, unit: "ml", date: today, verification: "SELF_REPORTED", createdAt: now() },
      { id: uid("well"), familyId, personId: laura, kind: "fruit", value: 1, unit: "portie", date: today, verification: "SELF_REPORTED", createdAt: now() },
      { id: uid("well"), familyId, personId: milan, kind: "water", value: 750, unit: "ml", date: today, verification: "SELF_REPORTED", createdAt: now() },
    ],
    readingEntries: [
      { id: uid("read"), familyId, personId: laura, title: "Een boek naar keuze", minutes: 20, pages: 12, rating: 4, date: dateKey(addDays(new Date(), -1)), createdAt: now() },
    ],
    conflicts: [
      {
        id: uid("conf"),
        familyId,
        personId: laura,
        withWhom: "Milan",
        topic: "iets wat iemand zei",
        feeling: "gefrustreerd",
        otherFeeling: "boos",
        goal: "dat het stopt",
        description: "Milan bleef mijn kamer binnenlopen terwijl ik met huiswerk bezig was, ook nadat ik het al een keer had gevraagd.",
        privacy: "PRIVATE",
        status: "resolved",
        suggestedMessage: "Ik werd afgeleid en gefrustreerd toen je steeds binnenkwam. Wil je eerst kloppen als mijn deur dicht is?",
        practiced: true,
        followUpAt: dateKey(addDays(new Date(), -9)),
        followUpResult: "good",
        followUpAnsweredAt: addDays(new Date(), -9).toISOString(),
        createdAt: addDays(new Date(), -10).toISOString(),
      },
      {
        id: uid("conf"),
        familyId,
        personId: laura,
        withWhom: "Milan",
        topic: "telefoon/scherm",
        feeling: "boos",
        otherFeeling: "verdrietig",
        goal: "dat ze begrijpt waarom ik boos ben",
        description: "Milan pakte mijn telefoon zonder te vragen om een spelletje te spelen.",
        privacy: "PRIVATE",
        status: "resolved",
        suggestedMessage: "Ik werd boos omdat je mijn telefoon pakte zonder te vragen. Kun je dat de volgende keer eerst vragen?",
        practiced: false,
        followUpAt: dateKey(addDays(new Date(), -3)),
        followUpResult: "better",
        followUpAnsweredAt: addDays(new Date(), -3).toISOString(),
        createdAt: addDays(new Date(), -4).toISOString(),
      },
    ],
    familySkillEvents: [
      { id: uid("skill"), familyId, personId: laura, type: "calm_communication", points: 5, createdAt: addDays(new Date(), -10).toISOString() },
      { id: uid("skill"), familyId, personId: laura, type: "conflict_resolved", points: 15, createdAt: addDays(new Date(), -9).toISOString() },
      { id: uid("skill"), familyId, personId: laura, type: "apology", points: 10, createdAt: addDays(new Date(), -4).toISOString() },
      { id: uid("skill"), familyId, personId: laura, type: "conflict_resolved", points: 10, createdAt: addDays(new Date(), -3).toISOString() },
    ],
    coachEvents: [],
    challenges: [
      { id: uid("challenge"), familyId, title: "7 Day Family Challenge", description: "7 dagen samen minstens 20 minuten bewegen.", target: 7, progress: 6, rewardPoints: 100, dueDate: dateKey(addDays(new Date(), 1)), createdAt: now() },
    ],
    walletEntries: [
      { id: uid("wallet"), familyId, personId: laura, amount: 1, label: "7-day streak", status: "earned", createdAt: now() },
      { id: uid("wallet"), familyId, personId: laura, amount: 0.5, label: "Sport", status: "earned", createdAt: now() },
      { id: uid("wallet"), familyId, personId: laura, amount: 0.5, label: "Taak", status: "earned", createdAt: now() },
    ],
    allowance: { weeklyBase: 5, weeklyMaximum: 10, streakBonus: 1, allTasksBonus: 1, activityBonus: 0.5 },
    familyPoints: 245,
    reminders: [],
  };
}

/** Leeg gezin voor een echte onboarding (geen demo-inhoud). */
export function createEmptyData(): AppData {
  const familyId = uid("fam");
  return {
    version: 1,
    onboarded: false,
    isDemo: false,
    activePersonId: "",
    family: { id: familyId, name: "", createdAt: now() },
    people: [],
    intake: null,
    coachProfile: null,
    tasks: [],
    completions: [],
    checkIns: [],
    goals: [],
    rewards: [],
    redemptions: [],
    activities: [],
    messages: [],
    pilotFeedback: [],
    settings: DEFAULT_SETTINGS,
  };
}

/** Startset afspraken die na de onboarding wordt voorgesteld. */
export function starterTasks(familyId: string, personId: string, focus: string[]): Task[] {
  const school = [1, 2, 3, 4, 5];
  const week = [0, 1, 2, 3, 4, 5, 6];
  const all: Task[] = [
    { title: "Ontbijten voor je vertrekt", category: "ochtend", time: "07:30", days: school, points: 5 },
    { title: "Tas klaarmaken voor morgen", category: "avond", time: "20:30", days: school, points: 5 },
    { title: "20 minuten bewegen", category: "beweging", time: "16:30", days: week, points: 10 },
    { title: "Huiswerk: 25 minuten focus", category: "school", time: "17:00", days: school, points: 10 },
    { title: "Telefoon om 21:30 op de oplader", category: "scherm", time: "21:30", days: week, points: 5 },
  ].map((item) => ({
    id: uid("task"),
    familyId,
    personId,
    shared: false,
    active: true,
    createdAt: now(),
    ...item,
  })) as Task[];

  const wanted = new Set<string>();
  if (focus.includes("ochtendroutine")) wanted.add("ochtend");
  if (focus.includes("huiswerk") || focus.includes("school")) wanted.add("school");
  if (focus.includes("schermtijd")) wanted.add("scherm");
  if (focus.includes("beweging")) wanted.add("beweging");
  if (focus.includes("avondroutine") || focus.includes("slapen")) wanted.add("avond");

  const filtered = all.filter((task) => wanted.has(task.category));
  return filtered.length >= 3 ? filtered : all.slice(0, 4);
}
