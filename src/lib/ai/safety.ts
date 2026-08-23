import type { CoachContext, MessageKind } from "@/lib/types";

/**
 * Centrale, configureerbare safety-laag.
 * Alles wat de coach niet mag, staat hier - niet verspreid door prompts heen.
 */
export const SAFETY_RULES = {
  noDiagnosis: true,
  noMedicalAdvice: true,
  noTherapyClaims: true,
  noShaming: true,
  noGuiltTripping: true,
  noPretendingHuman: true,
  escalateToAdultOnConcern: true,
  maxCharacters: 320,
} as const;

export const DISCLAIMER =
  "FamilyFlow is een ondersteunende gezinscoach en geen medisch diagnostisch of behandelplatform.";

/** Woorden die duiden op een diagnose of behandelclaim. Blokkeren, niet maskeren. */
const DIAGNOSIS_PATTERNS = [
  /\bje hebt (adhd|add|autisme|asperger|dyslexie|een stoornis)\b/i,
  /\b(diagnose|gediagnosticeerd|stoornis vastgesteld)\b/i,
  /\b(medicatie|ritalin|concerta|antidepressiva|dosering)\b/i,
  /\b(therapie|behandeling) (starten|voorschrijven)\b/i,
];

/** Toon die we nooit willen: schuld, dreiging, schaamte. */
const SHAMING_PATTERNS = [
  /\bje faalt\b/i,
  /\bje stelt .* teleur\b/i,
  /\bals je dit niet doet, dan\b/i,
  /\bje bent lui\b/i,
  /\bje moet je schamen\b/i,
];

/**
 * Signalen die om een volwassene of professionele hulp vragen.
 * Categorieën uit release 3 §19: zelfbeschadiging, suïcidaliteit, geweld,
 * seksueel misbruik, bedreiging, ernstige eetproblematiek, gevaarlijke situaties.
 * Bewust breed en Nederlandstalig; liever een keer te veel escaleren dan te weinig.
 */
const CONCERN_PATTERNS = [
  /\b(niet meer leven|dood wil|zelfmoord|mezelf pijn|snijden|van de brug|einde maken aan)\b/i,
  /\b(word geslagen|mishandeld|misbruikt|aangerand|bang thuis|niemand mag het weten)\b/i,
  /\b(bedreigt me|bedreigd worden|iemand met een mes|iemand met een wapen)\b/i,
  /\b(niet meer eten|expres niet eten|laten overgeven|honger houden expres)\b/i,
  /\b(alleen thuis en bang|iemand volgt me|onveilig voel|niet naar huis durf)\b/i,
];

export const ESCALATION_MESSAGE =
  "Dank je dat je dit deelt. Dit is te belangrijk om alleen met mij te bespreken. " +
  "Praat vandaag nog met je ouder of een andere volwassene die je vertrouwt. " +
  "Is het acuut? Bel dan 112, of 113 (of 0800-0113) om direct met iemand te praten.";

export function detectConcern(text: string): boolean {
  return CONCERN_PATTERNS.some((pattern) => pattern.test(text));
}

export interface InputSafetyResult {
  safe: boolean;
  message?: string;
}

/**
 * Eerste poort van de pipeline (Input -> Safety classifier -> ...), vóór de
 * conversation engine of AI ook maar iets ziet. Draait zowel client- als
 * server-side (pure regex, geen state) zodat de UI meteen kan escaleren.
 */
export function checkInputSafety(text: string): InputSafetyResult {
  if (detectConcern(text)) {
    return { safe: false, message: ESCALATION_MESSAGE };
  }
  return { safe: true };
}

export interface SafetyResult {
  ok: boolean;
  text: string;
  reason?: string;
}

/** Laatste poort voordat een bericht bij een kind of ouder terechtkomt. */
export function enforceSafety(text: string): SafetyResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, text: "", reason: "leeg" };

  if (SAFETY_RULES.noDiagnosis && DIAGNOSIS_PATTERNS.some((p) => p.test(trimmed))) {
    return { ok: false, text: "", reason: "diagnose-of-medisch" };
  }
  if (SAFETY_RULES.noShaming && SHAMING_PATTERNS.some((p) => p.test(trimmed))) {
    return { ok: false, text: "", reason: "toon" };
  }
  if (trimmed.length > SAFETY_RULES.maxCharacters) {
    return { ok: true, text: `${trimmed.slice(0, SAFETY_RULES.maxCharacters - 1).trimEnd()}…` };
  }
  return { ok: true, text: trimmed };
}

const ALLOWED_KINDS: MessageKind[] = ["checkin", "nudge", "praise", "insight", "suggestion", "parent-tip"];

export function safeKind(value: unknown, fallback: MessageKind): MessageKind {
  return ALLOWED_KINDS.includes(value as MessageKind) ? (value as MessageKind) : fallback;
}

const str = (value: unknown, max = 80): string =>
  typeof value === "string" ? value.slice(0, max) : "";

const strArray = (value: unknown, max = 8): string[] =>
  Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, max).map((v) => str(v)) : [];

/**
 * Whitelist-sanitizer: alleen deze velden verlaten de server richting het model.
 * Geen id's, geen achternamen, geen e-mailadressen, geen vrije intaketekst.
 */
export function sanitizeContext(raw: unknown): CoachContext {
  const input = (raw ?? {}) as Record<string, unknown>;
  const tasks = Array.isArray(input.todayTasks) ? input.todayTasks.slice(0, 12) : [];

  return {
    role: input.role === "child" || input.role === "coach" ? input.role : "parent",
    firstName: str(input.firstName, 24) || "daar",
    age: typeof input.age === "number" && input.age > 0 && input.age < 120 ? input.age : undefined,
    partOfDay:
      input.partOfDay === "middag" || input.partOfDay === "avond" ? input.partOfDay : "ochtend",
    weekday: str(input.weekday, 12),
    focusAreas: strArray(input.focusAreas),
    motivation: strArray(input.motivation),
    tone: strArray(input.tone),
    interests: strArray(input.interests, 6),
    todayTasks: tasks.map((t) => {
      const task = (t ?? {}) as Record<string, unknown>;
      return {
        title: str(task.title, 60),
        done: Boolean(task.done),
        time: str(task.time, 5) || undefined,
        category: str(task.category, 16) as CoachContext["todayTasks"][number]["category"],
      };
    }),
    openCount: Number(input.openCount) || 0,
    doneCount: Number(input.doneCount) || 0,
    todayMood: input.todayMood as CoachContext["todayMood"],
    recentMoods: strArray(input.recentMoods, 7) as CoachContext["recentMoods"],
    streakDays: Number(input.streakDays) || 0,
    lastMessages: strArray(input.lastMessages, 4).map((m) => m.slice(0, 120)),
    childSummaries: Array.isArray(input.childSummaries)
      ? input.childSummaries.slice(0, 6).map((c) => {
          const child = (c ?? {}) as Record<string, unknown>;
          return {
            firstName: str(child.firstName, 24),
            done: Number(child.done) || 0,
            total: Number(child.total) || 0,
            mood: child.mood as CoachContext["todayMood"],
          };
        })
      : undefined,
    weekStats: input.weekStats
      ? {
          tasksDone: Number((input.weekStats as Record<string, unknown>).tasksDone) || 0,
          tasksTotal: Number((input.weekStats as Record<string, unknown>).tasksTotal) || 0,
          checkIns: Number((input.weekStats as Record<string, unknown>).checkIns) || 0,
          movementDays: Number((input.weekStats as Record<string, unknown>).movementDays) || 0,
          activities: Number((input.weekStats as Record<string, unknown>).activities) || 0,
        }
      : undefined,
    nearestGoal: input.nearestGoal
      ? {
          title: str((input.nearestGoal as Record<string, unknown>).title, 60),
          progress: Number((input.nearestGoal as Record<string, unknown>).progress) || 0,
          target: Number((input.nearestGoal as Record<string, unknown>).target) || 0,
          unit: str((input.nearestGoal as Record<string, unknown>).unit, 16) || undefined,
        }
      : undefined,
    tomorrowCount: Number(input.tomorrowCount) || 0,
  };
}
