import type { AppData } from "@/lib/types";
import { familySkillsFor } from "@/lib/gamification";
import { children, weekStats } from "@/lib/utils";

/**
 * Professional-/rapportagelaag (release 4): leest uitsluitend af wat er al
 * aan echte (in de demo: fictieve) gezinsdata bestaat — geen losse
 * verzonnen cijfers. Bedoeld voor het professional-dashboard (/coach) en de
 * maandrapportage, altijd met een expliciete "voorbeelddata"-context.
 */

export type TrafficLight = "green" | "amber" | "orange";

export interface OverviewIndicator {
  key: string;
  label: string;
  level: TrafficLight;
  note: string;
}

/** Tailwind-kleurklasse per niveau — bewust geen emoji, zie de FamilyFlow-iconenset/kleursysteem. */
export const TRAFFIC_COLOR: Record<TrafficLight, string> = {
  green: "bg-primary",
  amber: "bg-accent",
  orange: "bg-danger",
};

function levelFromRatio(ratio: number | null): TrafficLight {
  if (ratio === null) return "amber";
  if (ratio >= 0.75) return "green";
  if (ratio >= 0.5) return "amber";
  return "orange";
}

function withinDays(iso: string, days: number, now: Date): boolean {
  const diff = now.getTime() - new Date(iso).getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

/** Gezinsoverzicht met stoplichten (release 3 §11) — voor de professional-weergave. */
export function familyOverview(data: AppData, now: Date = new Date()): OverviewIndicator[] {
  const kids = children(data);
  const ids = kids.map((k) => k.id);
  const stats = weekStats(data, ids, now);
  const taskRatio = stats.tasksTotal > 0 ? stats.tasksDone / stats.tasksTotal : null;

  const schoolTasks = data.tasks.filter((t) => ids.includes(t.personId) && t.category === "school");
  const schoolCompletions = data.completions.filter(
    (c) => schoolTasks.some((t) => t.id === c.taskId) && withinDays(c.completedAt, 7, now),
  );
  const schoolRatio = schoolTasks.length > 0 ? Math.min(1, schoolCompletions.length / (schoolTasks.length * 5)) : null;

  const conflicts = (data.conflicts ?? []).filter((c) => ids.includes(c.personId));
  const recentConflicts = conflicts.filter((c) => withinDays(c.createdAt, 14, now));
  const unresolved = recentConflicts.filter((c) => c.status === "unresolved");
  const practiced = recentConflicts.filter((c) => c.practiced || c.status === "resolved");

  const skillsTotal = ids.reduce((sum, id) => sum + familySkillsFor(data, id), 0);

  return [
    {
      key: "structuur",
      label: "Structuur",
      level: levelFromRatio(taskRatio),
      note: stats.tasksTotal > 0 ? `${stats.tasksDone}/${stats.tasksTotal} afspraken deze week` : "Nog geen afspraken deze week",
    },
    {
      key: "afspraken",
      label: "Afspraken",
      level: levelFromRatio(taskRatio),
      note: `${stats.checkIns} check-ins deze week`,
    },
    {
      key: "school",
      label: "School",
      level: levelFromRatio(schoolRatio),
      note: schoolTasks.length > 0 ? "Op basis van schoolgerelateerde afspraken" : "Geen schoolafspraken ingesteld",
    },
    {
      key: "communicatie",
      label: "Communicatie",
      level: recentConflicts.length === 0 ? "green" : practiced.length >= unresolved.length ? "amber" : "orange",
      note: recentConflicts.length > 0 ? `${practiced.length}/${recentConflicts.length} conflicten samen besproken` : "Geen recente conflicten gemeld",
    },
    {
      key: "conflicten",
      label: "Conflicten",
      level: unresolved.length > 0 ? "orange" : recentConflicts.length > 0 ? "amber" : "green",
      note: unresolved.length > 0 ? `${unresolved.length} nog niet opgelost` : "Geen openstaande conflicten",
    },
    {
      key: "ontwikkeling",
      label: "Positieve ontwikkeling",
      level: skillsTotal > 0 ? "green" : "amber",
      note: `${skillsTotal} Family Skills opgebouwd`,
    },
  ];
}

export interface MonthlyReport {
  period: string;
  positives: string[];
  attentionPoints: string[];
  observation: string;
  nextGoals: string[];
}

const MONTH_NAMES = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/**
 * Deterministieve maandrapportage (release 3 §36: niet elke actie verdient
 * een AI-call). Voor een rapport dat betrouwbaar moet renderen tijdens een
 * live demo is een zorgvuldig sjabloon passender dan een AI-call die kan
 * falen op een quotum — zie release 3 §22, dat dit expliciet toestaat.
 */
export function generateMonthlyReport(data: AppData, now: Date = new Date()): MonthlyReport {
  const kids = children(data);
  const ids = kids.map((k) => k.id);
  const stats = weekStats(data, ids, now);
  const overview = familyOverview(data, now);
  const skillsTotal = ids.reduce((sum, id) => sum + familySkillsFor(data, id), 0);
  const conflicts = (data.conflicts ?? []).filter((c) => ids.includes(c.personId));
  const resolved = conflicts.filter((c) => c.status === "resolved").length;
  const firstName = kids[0]?.name ?? "je kind";

  const positives: string[] = [];
  if (stats.tasksTotal > 0 && stats.tasksDone / stats.tasksTotal >= 0.6) positives.push("Meer afspraken nagekomen dan gemist deze week");
  if (resolved > 0) positives.push(`${resolved} ${resolved === 1 ? "conflict" : "conflicten"} samen opgelost in plaats van laten escaleren`);
  if (skillsTotal > 0) positives.push(`${skillsTotal} Family Skills opgebouwd — rustig communiceren, luisteren, verantwoordelijkheid nemen`);
  if (stats.movementDays >= 3) positives.push(`Beweging op ${stats.movementDays} van de 7 dagen`);
  if (positives.length === 0) positives.push("Een rustige periode zonder grote uitschieters");

  const attentionPoints: string[] = [];
  const orange = overview.filter((o) => o.level === "orange");
  const amber = overview.filter((o) => o.level === "amber");
  for (const item of [...orange, ...amber].slice(0, 3)) attentionPoints.push(`${item.label} — ${item.note}`);
  if (attentionPoints.length === 0) attentionPoints.push("Geen bijzondere aandachtspunten deze periode");

  const observation =
    resolved > 0 || skillsTotal > 0
      ? `${firstName} laat de afgelopen periode meer zelfstandigheid zien, vooral op het gebied van afspraken en communicatie. Conflictsituaties komen nog voor, maar worden vaker samen besproken in plaats van dat ze escaleren.`
      : `Deze periode geeft nog een beperkt beeld. Zodra er meer afspraken, check-ins en gesprekken zijn vastgelegd, wordt dit overzicht betekenisvoller.`;

  const focus = data.coachProfile?.focusAreas ?? [];
  const nextGoals = (focus.length > 0 ? focus : ["structuur in de ochtend", "zelfstandig huiswerk starten", "rustig blijven bij conflicten"])
    .slice(0, 3)
    .map((area) => `Doorbouwen op ${area}`);

  return {
    period: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`,
    positives,
    attentionPoints,
    observation,
    nextGoals,
  };
}

