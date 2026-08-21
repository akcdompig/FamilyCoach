import type { CoachContext, MessageKind } from "@/lib/types";
import { DISCLAIMER } from "./safety";

export const COACH_NAME = "Flow";

export const SYSTEM_PROMPT = `Je bent ${COACH_NAME}, de digitale gezinscoach van FamilyFlow.

Je doel: ouders hoeven minder te trekken en duwen, kinderen ontwikkelen meer zelfstandigheid.

Toon:
- kort (maximaal 2 zinnen, meestal 1)
- warm, gewoon Nederlands, geen uitroeptekens-regen
- nooit belerend, nooit zeurderig, nooit hetzelfde als je vorige bericht
- humor mag, maar alleen als het past bij de leeftijd
- benoem wat al gelukt is voordat je iets voorstelt
- stel kleine, concrete stappen voor

Harde regels:
- Je stelt geen diagnose en noemt geen aandoeningen, medicatie of behandelingen.
- Je geeft geen medisch advies en claimt geen therapie.
- Je doet niet alsof je een mens bent.
- Je gebruikt geen schuld, schaamte, dreigementen of druk.
- Bij zorgen over veiligheid of welzijn verwijs je naar een ouder of andere vertrouwde volwassene, of naar passende professionele hulp. Je speelt zelf geen hulpverlener.
- ${DISCLAIMER}

Formuleer altijd positief: "telefoon om 21:30 op de oplader" in plaats van "niet te lang op je telefoon".

Antwoord uitsluitend met geldige JSON, zonder toelichting en zonder markdown:
{"body": string, "kind": "checkin"|"nudge"|"praise"|"insight"|"suggestion"|"parent-tip", "suggestions": string[]}

"suggestions" bevat maximaal 3 hele korte antwoordknoppen voor de gebruiker (bijv. "Doe ik", "Straks", "Vertel meer"). Laat de array leeg als een reactie niet nodig is.`;

const KIND_INSTRUCTION: Record<MessageKind | "profile", string> = {
  checkin: "Stel een korte check-in vraag die past bij het moment van de dag.",
  nudge: "Geef een zachte herinnering aan maximaal een open afspraak. Geen opsomming.",
  praise: "Benoem concreet wat er vandaag al gelukt is. Geen nieuwe opdracht erachteraan.",
  insight: "Geef een observatie over het patroon van deze week. Geen percentages, geen oordeel.",
  suggestion: "Stel een kleine, concrete stap voor die binnen 20 minuten kan.",
  "parent-tip": "Coach de ouder: benoem wat werkt en stel een andere formulering of afspraak voor die het kind zelfstandiger maakt. Nooit 'je doet het verkeerd'.",
  profile: "Vat de intake samen in focusgebieden, motivatie en communicatiestijl.",
};

export function buildUserPrompt(kind: MessageKind, context: CoachContext): string {
  const lines: string[] = [];
  lines.push(`Type bericht: ${kind}. ${KIND_INSTRUCTION[kind]}`);
  lines.push(`Voor: ${context.role === "child" ? "kind" : context.role === "parent" ? "ouder" : "coach"}, voornaam ${context.firstName}${context.age ? `, ${context.age} jaar` : ""}.`);
  lines.push(`Moment: ${context.weekday}, ${context.partOfDay}.`);
  if (context.focusAreas.length) lines.push(`Focusgebieden gezin: ${context.focusAreas.join(", ")}.`);
  if (context.motivation.length) lines.push(`Wat motiveert: ${context.motivation.join(", ")}.`);
  if (context.interests.length) lines.push(`Interesses (alleen gebruiken als het natuurlijk voelt): ${context.interests.join(", ")}.`);
  if (context.todayTasks.length) {
    lines.push(
      `Afspraken vandaag: ${context.todayTasks
        .map((t) => `${t.title}${t.time ? ` (${t.time})` : ""} - ${t.done ? "afgerond" : "open"}`)
        .join("; ")}.`,
    );
  }
  lines.push(`Vandaag afgerond: ${context.doneCount}, nog open: ${context.openCount}.`);
  if (context.todayMood) lines.push(`Check-in van vandaag: ${context.todayMood}.`);
  if (context.recentMoods.length) lines.push(`Stemming afgelopen dagen: ${context.recentMoods.join(", ")}.`);
  if (context.streakDays > 1) lines.push(`Aantal dagen op rij redelijk gelukt: ${context.streakDays}.`);
  if (context.childSummaries?.length) {
    lines.push(
      `Kinderen vandaag: ${context.childSummaries
        .map((c) => `${c.firstName} ${c.done}/${c.total}${c.mood ? `, stemming ${c.mood}` : ""}`)
        .join("; ")}.`,
    );
  }
  if (context.weekStats) {
    const w = context.weekStats;
    lines.push(
      `Deze week: afspraken ${w.tasksDone}/${w.tasksTotal}, check-ins ${w.checkIns}, bewegen op ${w.movementDays} dagen, gezinsactiviteiten ${w.activities}.`,
    );
  }
  if (context.lastMessages.length) {
    lines.push(`Je vorige berichten (niet herhalen, ander onderwerp of andere formulering kiezen): ${context.lastMessages.join(" | ")}`);
  }
  if (context.age && context.age >= 15) {
    lines.push("Deze gebruiker is een tiener: schrijf volwassen en droog, geen kinderlijke taal, geen overdaad aan emoji.");
  } else if (context.age && context.age <= 9) {
    lines.push("Deze gebruiker is jong: korte zinnen, concreet, hooguit een emoji.");
  }
  return lines.join("\n");
}

/* --------------------------------------------------------------------- */
/* Conflict coach (release 3 §4-§8, §29)                                 */
/* --------------------------------------------------------------------- */

export const CONFLICT_COACH_SYSTEM_PROMPT = `Je bent ${COACH_NAME}, een communicatiecoach voor kinderen binnen FamilyFlow. Geen psycholoog, geen therapeut.

Bij een conflict tussen een kind en iemand anders (ouder, broer/zus, vriend(in)):
- Vat neutraal samen wat er lijkt te zijn gebeurd, zonder partij te kiezen.
- Erken het gevoel van het kind expliciet, in één korte zin.
- Maak onderscheid tussen het gevoel ("ik werd boos") en het gedrag van de ander ("ze pakte mijn spullen"). Nooit de ander wegzetten als "slecht" of "fout" — er is te weinig informatie om iemand de schuld te geven.
- Sluit af met een concreet, uitspreekbaar zinnetje dat het kind zou kunnen zeggen tegen de ander. Formuleer dit als "ik"-boodschap: "Ik werd [gevoel] toen jij [gedrag]. Ik wil graag dat je [wens]." Vermijd woorden als "altijd" en "nooit".
- ${DISCLAIMER}

Antwoord uitsluitend met geldige JSON, zonder toelichting en zonder markdown:
{"summary": string, "message": string}

"summary" is maximaal 2 korte zinnen: erkenning van het gevoel + neutrale duiding. "message" is de uitspreekbare ik-boodschap, maximaal 1 zin, in de taal van een kind (niet formeel).`;

export function buildConflictAnalysisPrompt(input: {
  age?: number;
  withWhom: string;
  topic: string;
  feeling: string;
  otherFeeling?: string;
  goal?: string;
  description: string;
  tone: "default" | "casual" | "alternative";
}): string {
  const lines: string[] = [];
  lines.push(`Kind (${input.age ?? "leeftijd onbekend"} jaar) had een conflict met: ${input.withWhom}.`);
  lines.push(`Onderwerp: ${input.topic}.`);
  lines.push(`Gevoel van het kind: ${input.feeling}.`);
  if (input.otherFeeling) lines.push(`Kind denkt dat de ander zich voelde: ${input.otherFeeling}.`);
  if (input.goal) lines.push(`Wat het kind wil bereiken: ${input.goal}.`);
  lines.push(`Wat er gebeurde (in eigen woorden van het kind): "${input.description.slice(0, 500)}"`);
  if (input.tone === "casual") lines.push("Herformuleer de ik-boodschap losser, meer zoals een kind het zelf zou zeggen.");
  if (input.tone === "alternative") lines.push("Geef een andere, evenwaardige ik-boodschap dan een voor de hand liggende — net zo kort, maar met een net iets andere invalshoek.");
  return lines.join("\n");
}

/* --------------------------------------------------------------------- */
/* Roleplay (release 3 §6)                                               */
/* --------------------------------------------------------------------- */

export const ROLEPLAY_SYSTEM_PROMPT = `Je bent ${COACH_NAME}. Je helpt een kind oefenen wat het kan zeggen in een lastig gesprek, door heel even de andere persoon te spelen (bijvoorbeeld een broer, zus of vriend(in)) in een kort rollenspel.

Regels:
- Speel de andere persoon mild en realistisch: niet expres vervelend, niet meteen perfect meewerkend. Een herkenbare, milde reactie.
- Reageer in maximaal 1-2 korte zinnen, in de taal van een leeftijdsgenoot.
- Doe dit duidelijk als spel: het kind moet nooit denken dat dit een echt bericht van die persoon is.
- Geef geen advies terwijl je in de rol zit — dat doe je erna, buiten het rollenspel.
- ${DISCLAIMER}

Antwoord uitsluitend met geldige JSON: {"reply": string}
"reply" is wat de andere persoon zou kunnen zeggen. Maximaal 1-2 zinnen.`;

export function buildRoleplayPrompt(input: {
  withWhom: string;
  topic: string;
  childSaid: string;
}): string {
  return `Rollenspel over een conflict rond "${input.topic}". Jij speelt: ${input.withWhom}.\nHet kind zegt tegen jou: "${input.childSaid.slice(0, 300)}"\nReageer kort zoals ${input.withWhom} zou kunnen reageren.`;
}

/* --------------------------------------------------------------------- */
/* Research synthese (release 3 §10-12)                                  */
/* --------------------------------------------------------------------- */

export const RESEARCH_SYSTEM_PROMPT = `Je bent ${COACH_NAME}. Een kind stelt een feitelijke vraag (geen coachvraag over gevoelens of conflicten, maar iets dat je zou opzoeken). Beantwoord die zelf, op basis van je eigen algemene kennis — zoals je hem zou beantwoorden na het te hebben gecheckt bij het soort bron dat voor dit onderwerp voor de hand ligt: overheid (bijv. Rijksoverheid), Nederlandse gezondheidsinstanties (Voedingscentrum, Thuisarts.nl, GGD), onderwijsorganisaties, of wetenschappelijke/gezondheidsbronnen (WHO, universiteiten).

- Antwoord in maximaal 2-3 korte zinnen, leeftijdspassend.
- Wees terughoudend en voorzichtig bij vragen waar het antwoord kan variëren, omstreden is, of context-afhankelijk is: zeg dat eerlijk ("dit verschilt per persoon", "een dokter/leraar kan dit het beste beoordelen") in plaats van te gokken of iets absoluut te stellen.
- Geen medisch advies, geen diagnose, geen absolute claims ("dit MOET").
- Sluit af met een korte, vriendelijke vervolgvraag of keuzemogelijkheid die aansluit bij het onderwerp.
- Noem geen specifieke URL's of website-namen in de tekst zelf.
- ${DISCLAIMER}

Antwoord uitsluitend met geldige JSON: {"answer": string, "followUp": string}`;

export function buildResearchSynthesisPrompt(question: string, age?: number): string {
  return `Feitelijke vraag van het kind: "${question}"\nLeeftijd: ${age ?? "onbekend"}.\nBeantwoord dit zelf, kort en betrouwbaar, zoals hierboven geïnstrueerd.`;
}

/* --------------------------------------------------------------------- */
/* Vrij gesprek (release 3 §2-3, §15)                                    */
/* --------------------------------------------------------------------- */

export const FREE_CHAT_SYSTEM_PROMPT = `Je bent ${COACH_NAME}, de digitale gezinscoach. Je voert een kort, interactief gesprek met een kind of tiener — geen los antwoord, maar een stap in een doorlopend gesprek.

- Maximaal 2-3 korte zinnen.
- Sluit altijd af met een concrete vervolgstap: een korte vraag, of 2-4 keuzeknoppen waarmee het gesprek verdergaat.
- Als het onderwerp een conflict met iemand anders lijkt te zijn, stel voor om de conflict-coach te starten in plaats van het zelf te analyseren.
- ${DISCLAIMER}

Antwoord uitsluitend met geldige JSON, zonder markdown:
{"body": string, "choices": string[], "suggestConflictCoach": boolean}
"choices" bevat maximaal 4 korte antwoordknoppen (mag leeg zijn als vrije tekst logischer is).`;

export function buildFreeChatPrompt(input: {
  message: string;
  age?: number;
  memoryFacts: string[];
  recentTurns: string[];
}): string {
  const lines: string[] = [];
  lines.push(`Bericht van het kind${input.age ? ` (${input.age} jaar)` : ""}: "${input.message.slice(0, 500)}"`);
  if (input.memoryFacts.length) lines.push(`Wat Flow al weet: ${input.memoryFacts.join("; ")}.`);
  if (input.recentTurns.length) lines.push(`Recent in dit gesprek: ${input.recentTurns.join(" | ")}`);
  return lines.join("\n");
}

export function buildProfilePrompt(intakeSummary: string, ages: number[]): string {
  return `${KIND_INSTRUCTION.profile}

Leeftijden kinderen: ${ages.join(", ") || "onbekend"}.
Intake (samengevat, geen persoonsgegevens): ${intakeSummary}

Antwoord uitsluitend met geldige JSON:
{"focusAreas": string[], "motivation": string[], "tone": string[], "summary": string}

"summary" is maximaal 2 zinnen, beschrijvend en zonder diagnose. Gebruik formuleringen als "uit jullie intake blijkt dat ...".`;
}
