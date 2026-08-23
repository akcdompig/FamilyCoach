import type { AppData, FamilySkillEvent, FamilySkillType, Person } from "@/lib/types";
import { children, dateKey, pointsFor, streakDays } from "@/lib/utils";

/**
 * Family Skills: bewust losstaand van punten (release 3 §9). Beloont gedrag
 * — rustig communiceren, luisteren, verantwoordelijkheid nemen — nooit
 * "geen ruzie gehad". Zie lib/ai/flows/conflictCoach.ts voor de toekenning.
 */
export const FAMILY_SKILL_LABEL: Record<FamilySkillType, string> = {
  calm_communication: "Rustig communiceren",
  listening: "Luisteren",
  responsibility: "Verantwoordelijkheid nemen",
  apology: "Excuses aanbieden",
  conflict_resolved: "Conflict opgelost",
  agreement_made: "Afspraak gemaakt",
};

export function familySkillsFor(data: AppData, personId: string): number {
  return (data.familySkillEvents ?? [])
    .filter((event) => event.personId === personId)
    .reduce((total, event) => total + event.points, 0);
}

/** Gezinsbreed totaal — het gedeelde gedrag dat het hele gezin samen heeft opgebouwd, niet per persoon. */
export function familySkillsTotal(data: AppData): number {
  return (data.familySkillEvents ?? []).reduce((total, event) => total + event.points, 0);
}

export function awardFamilySkill(
  data: AppData,
  personId: string,
  type: FamilySkillType,
  points = 10,
  conflictId?: string,
): FamilySkillEvent {
  const entry: FamilySkillEvent = {
    id: `skill_${Math.random().toString(36).slice(2, 10)}`,
    familyId: data.family.id,
    personId,
    type,
    points,
    conflictId,
    createdAt: new Date().toISOString(),
  };
  data.familySkillEvents = [...(data.familySkillEvents ?? []), entry];
  return entry;
}

export function familyPoints(data: AppData): number {
  if (typeof data.familyPoints === "number") return data.familyPoints;
  return data.activities.reduce((total, activity) => total + (activity.completedBy.length > 1 ? activity.points : 0), 0);
}

export function streakBadge(streak: number): string {
  if (streak >= 30) return "30 day legend";
  if (streak >= 14) return "Two week flow";
  if (streak >= 7) return "7 day streak";
  if (streak >= 3) return "Goed op weg";
  return "Eerste stap";
}

export function todayEarned(data: AppData, personId: string): number {
  const today = dateKey();
  const taskPoints = data.completions
    .filter((completion) => completion.personId === personId && completion.date === today)
    .reduce((total, completion) => total + (data.tasks.find((task) => task.id === completion.taskId)?.points ?? 0), 0);
  const activityPoints = data.activities
    .filter((activity) => activity.date === today && activity.completedBy.includes(personId))
    .reduce((total, activity) => total + activity.points, 0);
  return taskPoints + activityPoints;
}

export function familyProgress(data: AppData): { done: number; total: number } {
  return children(data).reduce(
    (result, child) => {
      const today = data.tasks.filter((task) => task.personId === child.id && task.active);
      const done = data.completions.filter(
        (completion) => completion.personId === child.id && completion.date === dateKey(),
      ).length;
      return { done: result.done + done, total: result.total + today.length };
    },
    { done: 0, total: 0 },
  );
}

export function allowanceFor(data: AppData, person: Person): { earned: number; expected: number; maximum: number } {
  const allowance = data.allowance ?? {
    weeklyBase: 5,
    weeklyMaximum: 10,
    streakBonus: 1,
    allTasksBonus: 1,
    activityBonus: 0.5,
  };
  const streakBonus = streakDays(data, person.id) >= 7 ? allowance.streakBonus : 0;
  const expected = Math.min(allowance.weeklyMaximum, allowance.weeklyBase + streakBonus);
  const earned = (data.walletEntries ?? [])
    .filter((entry) => entry.personId === person.id && entry.status !== "expected")
    .reduce((total, entry) => total + entry.amount, 0);
  return { earned, expected, maximum: allowance.weeklyMaximum };
}

export function badgeLabel(data: AppData, personId: string): string {
  return streakBadge(streakDays(data, personId));
}

export function pointsSummary(data: AppData, personId: string) {
  return { total: pointsFor(data, personId), today: todayEarned(data, personId), streak: streakDays(data, personId) };
}
