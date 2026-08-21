import type { CoachContext, CoachProfile, IntakeAnswers, MessageKind } from "@/lib/types";

export interface CoachReply {
  body: string;
  kind: MessageKind;
  suggestions: string[];
  source: "ai" | "rules";
}

/** Stabiele pseudo-random keuze: zelfde dag + zelfde situatie = zelfde bericht. */
function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) % 100000;
  }
  return value;
}

function pick<T>(options: T[], seed: string): T {
  return options[hash(seed) % options.length];
}

function stripEmoji(text: string): string {
  return text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s{2,}/g, " ").trim();
}

/**
 * Regelgebaseerde coach. Draait zonder API key en zonder netwerk, zodat de app
 * altijd werkt. Dit is ook de vangnetlaag als een AI-antwoord wordt geblokkeerd.
 */
export function fallbackCoachMessage(kind: MessageKind, context: CoachContext): CoachReply {
  const seed = `${context.firstName}-${context.weekday}-${context.partOfDay}-${kind}-${context.doneCount}-${context.lastMessages.length}`;
  const open = context.todayTasks.filter((t) => !t.done);
  const first = open[0]?.title.toLowerCase() ?? "";
  const teen = (context.age ?? 0) >= 15;
  const interest = context.interests[0];

  let body: string;
  let suggestions: string[] = [];
  let resolved: MessageKind = kind;

  if (context.role === "child") {
    if (context.todayMood === "low") {
      resolved = "checkin";
      body = pick(
        [
          "Je gaf net aan dat het niet zo lekker gaat. Wil je er iets over kwijt, of houden we het vandaag klein?",
          "Minder goede dag. Dat mag. Zullen we één klein ding kiezen en de rest laten?",
        ],
        seed,
      );
      suggestions = ["Vertel meer", "Hou het klein", "Gaat wel weer"];
    } else if (kind === "checkin") {
      const pool =
        context.partOfDay === "ochtend"
          ? [
              "Ochtendcheck ☀️ Heb je al iets gegeten?",
              "Goedemorgen. Even kort: lig je een beetje op schema?",
              "Nieuwe dag. Wat is het eerste dat je gaat doen?",
            ]
          : context.partOfDay === "middag"
            ? [
                "Hoe gaat je dag tot nu toe?",
                "Even tussendoor: gaat het lekker vandaag?",
                "School gehad. Hoe was het?",
              ]
            : [
                "Avondcheck. Hoe kijk je terug op vandaag?",
                "Bijna klaar met de dag. Hoe ging het?",
                "Laatste check van vandaag: hoe voel je je?",
              ];
      body = pick(pool, seed);
      suggestions = ["Goed", "Gaat wel", "Niet zo goed"];
    } else if (kind === "praise" || (context.openCount === 0 && context.doneCount > 0)) {
      resolved = "praise";
      body = pick(
        [
          `Alles van vandaag staat af. Mooi, dat heb je zelf gedaan.`,
          `${context.doneCount} van de ${context.doneCount + context.openCount} gelukt. Lekker bezig.`,
          context.streakDays > 2
            ? `${context.streakDays} dagen op rij goed op gang. Dat is een patroon aan het worden.`
            : "Je hebt je afspraken van vandaag rond. Goed bezig.",
        ],
        seed,
      );
      suggestions = [];
    } else if (kind === "suggestion" && interest) {
      resolved = "suggestion";
      body = pick(
        [
          `Nog één ding open: ${first}. Daarna is je tijd van jou, ook voor ${interest}.`,
          `Zet ${interest} aan en doe ondertussen ${first}. Klaar voor je het doorhebt.`,
          `Klein plan: eerst ${first}, daarna ${interest}.`,
        ],
        seed,
      );
      suggestions = ["Doe ik", "Straks"];
    } else if (open.length > 0) {
      resolved = "nudge";
      body = pick(
        [
          `Je hebt nog één klein doel openstaan: ${first}. Zullen we die samen aanpakken?`,
          `${open[0]?.title}. Twee minuten werk, dan is het weg.`,
          `Nog even ${first} en je dag is rond.`,
        ],
        seed,
      );
      suggestions = ["Doe ik nu", "Straks", "Vandaag niet"];
    } else {
      resolved = "praise";
      body = "Niks meer op de lijst vandaag. Geniet ervan.";
    }
  } else {
    const child = (context.childSummaries ?? []).slice().sort((a, b) => a.done / (a.total || 1) - b.done / (b.total || 1))[0];
    const week = context.weekStats;
    if (kind === "checkin") {
      body = pick(
        [
          `Goedemorgen 👋 Kleine check-in: hoe gaat het vandaag met jou?`,
          "Even voor jezelf: hoe start jouw dag?",
          "Voordat het gezin op gang komt: hoe zit jij erbij vandaag?",
        ],
        seed,
      );
      suggestions = ["Goed", "Gaat wel", "Niet zo goed"];
    } else if (kind === "insight" && week) {
      resolved = "insight";
      body = pick(
        [
          `Deze week zijn ${week.tasksDone} van de ${week.tasksTotal} afspraken gelukt. De ochtend vraagt nu de meeste aandacht.`,
          "Jullie boeken vooral vooruitgang wanneer afspraken klein en concreet zijn.",
          week.activities > 0
            ? "De momenten samen lopen goed. Die zijn een handig anker voor de rest van de week."
            : "Er stond deze week weinig samen gepland. Eén gedeeld moment maakt de rest vaak makkelijker.",
        ],
        seed,
      );
    } else {
      resolved = "parent-tip";
      body = pick(
        [
          child && child.total > 0 && child.done < child.total
            ? `${child.firstName} heeft vandaag ${child.done} van de ${child.total} afspraken rond. Misschien kunnen jullie er samen één anders formuleren, zodat ${child.firstName} hem zelfstandiger kan uitvoeren.`
            : "Vandaag loopt het redelijk. Mooi moment om even niets te herinneren.",
          "Schermtijd lijkt op dit moment de meeste discussie te geven. Misschien is het interessant om hier samen één duidelijke afspraak van te maken.",
          "Maak vandaag één duidelijke afspraak over het klaarzetten van schoolspullen. Eén afspraak werkt beter dan drie herinneringen.",
        ],
        seed,
      );
      suggestions = ["Goed idee", "Later"];
    }
  }

  return {
    body: teen ? stripEmoji(body) : body,
    kind: resolved,
    suggestions,
    source: "rules",
  };
}

const SCALE_TO_FOCUS: { key: keyof IntakeAnswers; area: string }[] = [
  { key: "morning", area: "ochtendroutine" },
  { key: "evening", area: "avondroutine" },
  { key: "school", area: "school en huiswerk" },
  { key: "screen", area: "schermgebruik" },
  { key: "sleep", area: "slaap en rust" },
];

/** Coachprofiel afleiden uit de intake als er geen AI beschikbaar is. */
export function deriveCoachProfile(
  familyId: string,
  answers: IntakeAnswers,
  ages: number[],
): Omit<CoachProfile, "id" | "createdAt"> {
  const focus = new Set<string>(answers.struggles);
  for (const item of SCALE_TO_FOCUS) {
    if ((answers[item.key] as number) <= 2) focus.add(item.area);
  }
  if (answers.movement === "weinig") focus.add("beweging");
  for (const goal of answers.focusFourWeeks) focus.add(goal);
  focus.add("zelfstandigheid");

  const tone = ["kort", "vriendelijk", "niet belerend"];
  if (ages.some((age) => age >= 14)) tone.push("volwassen richting tieners");
  else tone.push("speels wanneer passend");

  const topFocus = Array.from(focus).slice(0, 3).join(", ");
  const strong = answers.goingWell.slice(0, 2).join(" en ");

  return {
    familyId,
    focusAreas: Array.from(focus).slice(0, 6),
    motivation: answers.motivators.length ? answers.motivators : ["korte doelen", "positieve feedback"],
    tone,
    summary: `Uit jullie intake blijkt dat ${topFocus || "structuur"} op dit moment de meeste aandacht vraagt.${
      strong ? ` ${strong.charAt(0).toUpperCase()}${strong.slice(1)} gaat juist goed; daar bouwen we op door.` : ""
    }`,
    source: "rules",
  };
}
