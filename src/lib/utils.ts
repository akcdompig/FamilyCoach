import type { AppData, Category, Mood, Person, Task } from "@/lib/types";

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

export function tasksForPerson(data: AppData, personId: string, date: Date = new Date()): Task[] {
  return data.tasks
    .filter((t) => t.personId === personId && isTaskOnDay(t, date))
    .sort((a, b) => minutesFromString(a.time ?? "23:59") - minutesFromString(b.time ?? "23:59"));
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
    .filter((g) => (g.personId === personId || !g.personId) && g.progress >= g.target)
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

export const CATEGORY_ICON: Record<Category, string> = {
  ochtend: "☀️",
  school: "🎒",
  beweging: "🏃",
  wellness: "💧",
  lezen: "📖",
  scherm: "📱",
  avond: "🌙",
  huishouden: "🧺",
  samen: "🧡",
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
