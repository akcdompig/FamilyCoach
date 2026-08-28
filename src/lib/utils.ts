import type { AppData, Category, Goal, GoalDomain, GoalMilestone, Mood, Person, Task, TaskAdjustment } from "@/lib/types";
import type { IconName } from "@/components/Icons";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function dateKey(d: Date = new Date()): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(d: Date, amount: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export const WEEKDAYS = [
  { index: 1, short: "Ma" },
  { index: 2, short: "Di" },
  { index: 3, short: "Wo" },
  { index: 4, short: "Do" },
  { index: 5, short: "Vr" },
  { index: 6, short: "Za" },
  { index: 0, short: "Zo" },
];

export const WEEKDAY_LONG = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

export function partOfDay(d: Date = new Date()): "ochtend" | "middag" | "avond" {
  const h = d.getHours();
  if (h < 12) return "ochtend";
  if (h < 18) return "middag";
  return "avond";
}

export function greeting(d: Date = new Date()): string {
  const p = partOfDay(d);
  if (p === "ochtend") return "Goedemorgen";
  if (p === "middag") return "Goedemiddag";
  return "Goedenavond";
}

export function minutesFromString(value: string): number {
  const [h, m] = value.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

export function isTaskOnDay(task: Task, date: Date): boolean {
  return task.active && task.days.includes(date.getDay());
}

export function adjustmentFor(
  data: AppData,
  taskId: string,
  personId: string,
  date: Date = new Date(),
): TaskAdjustment | undefined {
  const key = dateKey(date);
  return (data.taskAdjustments ?? []).find(
    (a) => a.taskId === taskId && a.personId === personId && a.date === key,
  );
}

/**
 * Een afspraak telt voor vandaag mee tenzij hij voor vandaag is verplaatst of
 * overgeslagen ("Replan, don't fail") — dit is de enige plek waar dat wordt
 * bepaald, dus streaks/inzichten/oudersweergaven erven het automatisch.
 */
export function tasksForPerson(data: AppData, personId: string, date: Date = new Date()): Task[] {
  const key = dateKey(date);
  const movedAway = new Set(
    (data.taskAdjustments ?? [])
      .filter((a) => a.personId === personId && a.date === key && a.action)
      .map((a) => a.taskId),
  );
  return data.tasks
    .filter((t) => t.personId === personId && isTaskOnDay(t, date) && !movedAway.has(t.id))
    .sort((a, b) => minutesFromString(a.time ?? "23:59") - minutesFromString(b.time ?? "23:59"));
}

/** Afspraken die vanaf een andere dag hierheen zijn verplaatst — de andere helft van "Replan, don't fail". */
export function movedInTasks(data: AppData, personId: string, date: Date = new Date()): Task[] {
  const key = dateKey(date);
  const incomingIds = new Set(
    (data.taskAdjustments ?? [])
      .filter((a) => a.personId === personId && a.action === "postponed" && a.movedToDate === key)
      .map((a) => a.taskId),
  );
  if (incomingIds.size === 0) return [];
  return data.tasks.filter((t) => incomingIds.has(t.id));
}

export function taskPriorityFor(
  data: AppData,
  taskId: string,
  personId: string,
  date: Date = new Date(),
): "high" | "normal" {
  return adjustmentFor(data, taskId, personId, date)?.priority === "high" ? "high" : "normal";
}

export function minutesNow(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function startOfWeek(date: Date = new Date()): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0 = zondag
  const diff = day === 0 ? -6 : 1 - day; // maandag als eerste dag van de week
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export type OccurrenceStatus =
  | "completed"
  | "overdue"
  | "today"
  | "postponed"
  | "moved-in"
  | "upcoming"
  | "past";

export interface TaskOccurrence {
  task: Task;
  date: string;
  status: OccurrenceStatus;
  priority: "high" | "normal";
}

/**
 * Alle voorkomens van iemands afspraken op één dag — inclusief verplaatste en
 * overgeslagen exemplaren, in tegenstelling tot tasksForPerson (dat alleen
 * teruggeeft "wat er nu nog moet"). Bedoeld voor de Plan-ervaring, waar
 * eerlijk laten zien wat er is gebeurd meer waard is dan een schone lijst.
 */
export function occurrencesForDay(data: AppData, personId: string, date: Date): TaskOccurrence[] {
  const key = dateKey(date);
  const todayKey = dateKey(new Date());
  const isToday = key === todayKey;
  const isFuture = key > todayKey;
  const nowMinutes = minutesNow();

  const rows: TaskOccurrence[] = [];

  for (const task of data.tasks) {
    if (task.personId !== personId || !isTaskOnDay(task, date)) continue;
    const adjustment = adjustmentFor(data, task.id, personId, date);
    const done = isDone(data, task.id, date);
    const priority: "high" | "normal" = adjustment?.priority === "high" ? "high" : "normal";

    if (done) {
      rows.push({ task, date: key, status: "completed", priority });
      continue;
    }
    if (adjustment?.action === "postponed" || adjustment?.action === "skipped") {
      rows.push({ task, date: key, status: "postponed", priority: "normal" });
      continue;
    }
    if (isToday) {
      const overdue = Boolean(task.time) && minutesFromString(task.time as string) < nowMinutes;
      rows.push({ task, date: key, status: overdue ? "overdue" : "today", priority });
    } else if (isFuture) {
      rows.push({ task, date: key, status: "upcoming", priority });
    } else {
      rows.push({ task, date: key, status: "past", priority: "normal" });
    }
  }

  for (const task of movedInTasks(data, personId, date)) {
    if (rows.some((r) => r.task.id === task.id)) continue;
    const done = isDone(data, task.id, date);
    rows.push({ task, date: key, status: done ? "completed" : "moved-in", priority: "normal" });
  }

  return rows.sort((a, b) => minutesFromString(a.task.time ?? "23:59") - minutesFromString(b.task.time ?? "23:59"));
}

export function occurrencesForRange(data: AppData, personId: string, days: Date[]): TaskOccurrence[][] {
  return days.map((day) => occurrencesForDay(data, personId, day));
}

export const GOAL_DOMAIN_LABEL: Record<GoalDomain, string> = {
  health: "Gezondheid",
  school: "School & leren",
  skills: "Vaardigheden",
  relationships: "Relaties",
  responsibility: "Verantwoordelijkheid",
  personal: "Persoonlijke groei",
};

export const GOAL_DOMAIN_ICON: Record<GoalDomain, IconName> = {
  health: "activity",
  school: "backpack",
  skills: "spark",
  relationships: "heart",
  responsibility: "shield",
  personal: "target",
};

export function goalDomain(goal: Goal): GoalDomain {
  return goal.domain ?? "personal";
}

/**
 * De echte voortgang van een doel. Bij gekoppelde afspraken (linkedTaskIds)
 * is dit volledig afgeleid uit voltooiingen — nooit de losstaande, mogelijk
 * verouderde progress-waarde — zodat een afspraak die je afrondt altijd en
 * overal hetzelfde doel vooruit helpt. Zonder koppeling blijft progress de
 * (handmatig bijgewerkte) bron van waarheid.
 */
export function goalProgressFor(data: AppData, goal: Goal): number {
  if (!goal.linkedTaskIds || goal.linkedTaskIds.length === 0) {
    return Math.min(goal.progress, goal.target);
  }
  const since = dateKey(new Date(goal.createdAt));
  const linked = new Set(goal.linkedTaskIds);
  const qualifyingDays = new Set(
    data.completions
      .filter((c) => linked.has(c.taskId) && c.date >= since)
      .filter((c) => !goal.personId || c.personId === goal.personId)
      .map((c) => c.date),
  );
  return Math.min(qualifyingDays.size, goal.target);
}

export function goalAchieved(data: AppData, goal: Goal): boolean {
  return goal.target > 0 && goalProgressFor(data, goal) >= goal.target;
}

/** Mijlpalen om een doel te tonen als reis in plaats van één balk — eigen mijlpalen winnen, anders gelijk verdeeld over target. */
export function milestonesFor(goal: Goal): GoalMilestone[] {
  if (goal.milestones && goal.milestones.length > 0) return goal.milestones;
  const count = Math.min(4, Math.max(1, Math.round(goal.target)));
  const step = goal.target / count;
  return Array.from({ length: count }, (_, i) => ({
    id: `auto-${i}`,
    label: i === count - 1 ? "Doel bereikt" : `Mijlpaal ${i + 1}`,
    threshold: Math.round(step * (i + 1)),
  }));
}

/** Welke doelen een specifieke afspraak vooruit helpt — voor de "+1 richtingje doel"-feedback bij afronden. */
export function goalsLinkedToTask(data: AppData, taskId: string): Goal[] {
  return data.goals.filter((g) => g.linkedTaskIds?.includes(taskId));
}

export function isDone(data: AppData, taskId: string, date: Date = new Date()): boolean {
  const key = dateKey(date);
  return data.completions.some((c) => c.taskId === taskId && c.date === key);
}

export function dayProgress(data: AppData, personId: string, date: Date = new Date()) {
  const tasks = tasksForPerson(data, personId, date);
  const done = tasks.filter((t) => isDone(data, t.id, date)).length;
  return { done, total: tasks.length, ratio: tasks.length ? done / tasks.length : 0 };
}

export function checkInFor(data: AppData, personId: string, date: Date = new Date()) {
  const key = dateKey(date);
  return data.checkIns.find((c) => c.personId === personId && c.date === key);
}

/** Punten worden altijd afgeleid, nooit los opgeslagen: één bron van waarheid. */
export function pointsFor(data: AppData, personId: string): number {
  const earned = data.completions
    .filter((c) => c.personId === personId)
    .reduce((sum, c) => sum + (data.tasks.find((t) => t.id === c.taskId)?.points ?? 0), 0);
  const activityPoints = data.activities
    .filter((a) => a.completedBy.includes(personId))
    .reduce((sum, a) => sum + a.points, 0);
  const goalPoints = data.goals
    .filter((g) => (g.personId === personId || !g.personId) && goalAchieved(data, g))
    .reduce((sum, g) => sum + g.points, 0);
  const spent = data.redemptions
    .filter((r) => r.personId === personId)
    .reduce((sum, r) => sum + (data.rewards.find((w) => w.id === r.rewardId)?.cost ?? 0), 0);
  return earned + activityPoints + goalPoints - spent;
}

export function streakDays(data: AppData, personId: string, from: Date = new Date()): number {
  let streak = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = addDays(from, -i);
    const { total, done } = dayProgress(data, personId, day);
    if (total === 0) continue;
    if (done > 0 && done >= Math.ceil(total * 0.6)) streak += 1;
    else break;
  }
  return streak;
}

export function weekStats(data: AppData, personIds: string[], from: Date = new Date()) {
  let tasksDone = 0;
  let tasksTotal = 0;
  let checkIns = 0;
  const movementDays = new Set<string>();
  let activities = 0;

  for (let i = 0; i < 7; i += 1) {
    const day = addDays(from, -i);
    const key = dateKey(day);
    for (const personId of personIds) {
      const tasks = tasksForPerson(data, personId, day);
      tasksTotal += tasks.length;
      for (const task of tasks) {
        if (isDone(data, task.id, day)) {
          tasksDone += 1;
          if (task.category === "beweging") movementDays.add(key);
        }
      }
      if (data.checkIns.some((c) => c.personId === personId && c.date === key)) checkIns += 1;
    }
    activities += data.activities.filter((a) => a.date === key && a.completedBy.length > 0).length;
  }

  return { tasksDone, tasksTotal, checkIns, movementDays: movementDays.size, activities };
}

/**
 * Eén samengevoegd percentage (0-100) uit al bestaande, afgeleide cijfers —
 * nooit een los opgeslagen score. Gewogen: vandaag-taken 50%, actieve
 * doelen-voortgang 30%, reeks-gezondheid 20%. Gebruikt door StarRating.
 */
export function combinedAchievementFor(data: AppData, personId: string): number {
  const { ratio: taskRatio, total: taskTotal } = dayProgress(data, personId);

  const activeGoals = data.goals.filter((g) => (g.personId === personId || !g.personId) && g.target > 0);
  const goalRatio = activeGoals.length
    ? activeGoals.reduce((sum, g) => sum + Math.min(1, goalProgressFor(data, g) / g.target), 0) / activeGoals.length
    : null;

  const streakRatio = Math.min(1, streakDays(data, personId) / 7);

  const parts: { ratio: number; weight: number }[] = [];
  if (taskTotal > 0) parts.push({ ratio: taskRatio, weight: 0.5 });
  if (goalRatio !== null) parts.push({ ratio: goalRatio, weight: 0.3 });
  parts.push({ ratio: streakRatio, weight: 0.2 });

  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = parts.reduce((sum, p) => sum + p.ratio * p.weight, 0) / totalWeight;
  return Math.round(weighted * 100);
}

/** 0-100% -> 1-5 sterren. Elke echte voortgang telt voor minstens één ster; pas op 0% blijft het 0. */
export function starsFor(percentage: number): number {
  if (percentage <= 0) return 0;
  return Math.max(1, Math.round((percentage / 100) * 5));
}

export function children(data: AppData): Person[] {
  return data.people.filter((p) => p.role === "child");
}

export function parents(data: AppData): Person[] {
  return data.people.filter((p) => p.role === "parent");
}

export function personById(data: AppData, id: string): Person | undefined {
  return data.people.find((p) => p.id === id);
}

export const CATEGORY_LABEL: Record<Category, string> = {
  ochtend: "Ochtend",
  school: "School",
  beweging: "Beweging",
  wellness: "Wellness",
  lezen: "Lezen",
  scherm: "Schermtijd",
  avond: "Avond",
  huishouden: "Huishouden",
  samen: "Samen",
};

/** FamilyFlow-iconenset per categorie — bewust geen emoji, zie Icons.tsx. */
export const CATEGORY_ICON: Record<Category, IconName> = {
  ochtend: "sun",
  school: "backpack",
  beweging: "activity",
  wellness: "droplet",
  lezen: "book",
  scherm: "device",
  avond: "moon",
  huishouden: "basket",
  samen: "heart",
};

/** Elke categorie krijgt een eigen getinte kleur (naast het icoon) zodat een dag herkenbaar oogt, niet als een grijze lijst. */
export const CATEGORY_COLOR: Record<Category, { bg: string; text: string }> = {
  ochtend: { bg: "bg-accent-soft", text: "text-accent-dark" },
  school: { bg: "bg-sage-light", text: "text-primary-dark" },
  beweging: { bg: "bg-progress-soft", text: "text-progress-dark" },
  wellness: { bg: "bg-navy/10", text: "text-navy" },
  lezen: { bg: "bg-sand-light", text: "text-accent-dark" },
  scherm: { bg: "bg-ink/5", text: "text-muted" },
  avond: { bg: "bg-navy/10", text: "text-navy" },
  huishouden: { bg: "bg-sand", text: "text-ink/70" },
  samen: { bg: "bg-sage", text: "text-primary-dark" },
};

export const MOOD_LABEL: Record<Mood, string> = {
  good: "Goed",
  ok: "Gaat wel",
  low: "Niet zo goed",
};

export const MOOD_EMOJI: Record<Mood, string> = {
  good: "🙂",
  ok: "😐",
  low: "🙁",
};
