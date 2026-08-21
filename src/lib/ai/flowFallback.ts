import { needsExternalInformation } from "@/lib/ai/research";
import { classifyIntent } from "@/lib/ai/conversation";

/**
 * Sjabloon-antwoorden voor de conversation engine. Draaien zonder API-key en
 * zonder netwerk (behalve de curated kennisbank in research.ts), zodat de
 * volledige Flow-conversatie (conflict coach, roleplay, research) getest kan
 * worden in demo mode. Zie api/flow/route.ts voor waar dit wordt ingezet.
 */

function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) value = (value * 31 + input.charCodeAt(i)) % 100000;
  return value;
}

function pick<T>(options: T[], seed: string): T {
  return options[hash(seed) % options.length];
}

export interface ConflictAnalysisInput {
  withWhom: string;
  topic: string;
  feeling: string;
  otherFeeling?: string;
  goal?: string;
  description: string;
  tone: "default" | "casual" | "alternative";
}

export function fallbackConflictAnalysis(input: ConflictAnalysisInput): { summary: string; message: string } {
  const summary = `Je werd ${input.feeling} door iets met ${input.withWhom} rond ${input.topic}. Dat gevoel mag er zijn — er is nog niet genoeg reden om te zeggen wie er "gelijk" heeft.`;

  const seed = `${input.withWhom}-${input.topic}-${input.tone}-${input.description.length}`;
  const goalPhrase = input.goal ?? "hier samen uitkomen";

  const templates: Record<ConflictAnalysisInput["tone"], string[]> = {
    default: [
      `Ik werd ${input.feeling} toen er iets gebeurde rond ${input.topic}. Kunnen we het er rustig over hebben? Ik wil ${goalPhrase}.`,
      `Toen dat gebeurde met ${input.topic}, werd ik ${input.feeling}. Ik wil graag dat je dat weet, en ik wil ${goalPhrase}.`,
    ],
    casual: [
      `Hé, ik werd best wel ${input.feeling} toen dat met ${input.topic} gebeurde. Kunnen we dat even rechtzetten?`,
      `Dat met ${input.topic} vond ik niet oké, ik werd er ${input.feeling} van. Zullen we het gewoon even uitpraten?`,
    ],
    alternative: [
      `Volgens mij snapten we elkaar niet helemaal bij dat met ${input.topic} — ik voelde me ${input.feeling}. Kunnen we opnieuw beginnen?`,
      `Ik denk dat we allebei ergens gelijk hadden bij ${input.topic}. Ik voelde me ${input.feeling}, wat vond jij ervan?`,
    ],
  };

  return { summary, message: pick(templates[input.tone], seed) };
}

export interface RoleplayInput {
  withWhom: string;
  topic: string;
  childSaid: string;
}

const ROLEPLAY_REPLIES = [
  "Oh... dat wist ik niet, sorry.",
  "Ja maar ik was ook boos, hoor.",
  "Oké, dat snap ik. Zullen we het anders doen volgende keer?",
  "Hmm, ik bedoelde het niet zo vervelend.",
  "Kunnen we het er nu rustig over hebben?",
];

export function fallbackRoleplayReply(input: RoleplayInput): { reply: string } {
  return { reply: pick(ROLEPLAY_REPLIES, `${input.withWhom}-${input.childSaid}`) };
}

export interface FreeChatInput {
  message: string;
  age?: number;
}

export interface FreeChatResult {
  body: string;
  choices: string[];
  suggestConflictCoach: boolean;
}

/**
 * Gesprekspipeline zonder AI: classificeert intent en formuleert een kort
 * antwoord. Dit is de "demo mode" waarin Flow blijft werken zonder
 * geconfigureerde AI-provider — feitelijke vragen krijgen hier bewust geen
 * verzonnen antwoord (dat vereist echt een AI-provider), maar een eerlijke
 * "dat kan ik nu niet zeker beantwoorden" met een concreet vervolg.
 */
export function fallbackFreeChat(input: FreeChatInput): FreeChatResult {
  if (needsExternalInformation(input.message)) {
    return {
      body: "Dat is een goede vraag, maar ik kan er nu niet zeker van zijn dat ik je goed antwoord — mijn AI is even niet beschikbaar. Vraag het gerust aan een ouder of leraar, of probeer het straks nog eens.",
      choices: ["Oké", "Iets anders vragen"],
      suggestConflictCoach: false,
    };
  }

  const intent = classifyIntent(input.message);
  if (intent === "start_conflict") {
    return {
      body: "Dat klinkt pittig. Zal ik je helpen dit rustig uit te praten?",
      choices: ["Ja, help me", "Straks"],
      suggestConflictCoach: true,
    };
  }
  if (intent === "vent") {
    return { body: "Ik luister. Vertel gerust wat er is.", choices: [], suggestConflictCoach: false };
  }
  if (intent === "request_activity") {
    return {
      body: "Zal ik met je meedenken over iets leuks om te doen?",
      choices: ["Ja, kies iets voor mij", "Niet nu"],
      suggestConflictCoach: false,
    };
  }
  return {
    body: "Vertel er iets meer over, dan denk ik met je mee.",
    choices: ["Het gaat over school", "Het gaat over thuis", "Laat maar"],
    suggestConflictCoach: false,
  };
}
