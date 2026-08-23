import type { AppData, CoachContext, Person } from "@/lib/types";
import {
  CATEGORY_LABEL,
  WEEKDAY_LONG,
  checkInFor,
  children,
  dateKey,
  dayProgress,
  goalProgressFor,
  isDone,
  movedInTasks,
  partOfDay,
  streakDays,
  tasksForPerson,
  weekStats,
  addDays,
} from "@/lib/utils";
import { recentMessageBodies } from "./memory";

/**
 * Context builder. Het model krijgt nooit de database te zien, alleen dit object.
 * Vrije intaketekst, e-mailadressen en id's blijven bewust buiten de context.
 */
export function buildCoachContext(
  data: AppData,
  person: Person,
  now: Date = new Date(),
): CoachContext {
  const tasks = tasksForPerson(data, person.id, now);
  const done = tasks.filter((t) => isDone(data, t.id, now));
  const profile = data.coachProfile;

  const recentMoods = Array.from({ length: 5 }, (_, i) => addDays(now, -(i + 1)))
    .map((day) => data.checkIns.find((c) => c.personId === person.id && c.date === dateKey(day))?.mood)
    .filter(Boolean) as CoachContext["recentMoods"];

  const base: CoachContext = {
    role: person.role,
    firstName: person.name,
    age: person.age,
    partOfDay: partOfDay(now),
    weekday: WEEKDAY_LONG[now.getDay()],
    focusAreas: profile?.focusAreas ?? [],
    motivation: profile?.motivation ?? [],
    tone: profile?.tone ?? [],
    interests: data.settings.shareInterestsWithAI ? person.interests : [],
    todayTasks: tasks.map((t) => ({
      title: t.title,
      done: isDone(data, t.id, now),
      time: t.time,
      category: t.category,
    })),
    openCount: tasks.length - done.length,
    doneCount: done.length,
    todayMood: checkInFor(data, person.id, now)?.mood,
    recentMoods,
    streakDays: streakDays(data, person.id, now),
    lastMessages: recentMessageBodies(data, person.id, 3),
    tomorrowCount: (() => {
      const tomorrow = addDays(now, 1);
      const scheduled = tasksForPerson(data, person.id, tomorrow);
      const incoming = movedInTasks(data, person.id, tomorrow);
      return scheduled.length + incoming.length;
    })(),
  };

  if (person.role === "child") {
    const openGoal = data.goals
      .filter((g) => (!g.personId || g.personId === person.id) && goalProgressFor(data, g) < g.target)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    if (openGoal) {
      base.nearestGoal = {
        title: openGoal.title,
        progress: goalProgressFor(data, openGoal),
        target: openGoal.target,
        unit: openGoal.unit,
      };
    }
  }

  if (person.role !== "child") {
    base.childSummaries = children(data).map((child) => {
      const progress = dayProgress(data, child.id, now);
      return {
        firstName: child.name,
        done: progress.done,
        total: progress.total,
        mood: checkInFor(data, child.id, now)?.mood,
      };
    });
    base.weekStats = weekStats(
      data,
      children(data).map((c) => c.id),
      now,
    );
  } else {
    base.weekStats = weekStats(data, [person.id], now);
  }

  return base;
}

/** Korte, geanonimiseerde samenvatting van de intake voor het profielprompt. */
export function summarizeIntake(data: AppData): string {
  const intake = data.intake;
  if (!intake) return "geen intake beschikbaar";
  const a = intake.answers;
  const scale = (n: number) => (n <= 2 ? "moeizaam" : n === 3 ? "wisselend" : "gaat goed");
  return [
    `knelpunten: ${a.struggles.join(", ") || "niet opgegeven"}`,
    `gaat goed: ${a.goingWell.join(", ") || "niet opgegeven"}`,
    `ochtend ${scale(a.morning)}`,
    `avond ${scale(a.evening)}`,
    `school ${scale(a.school)}`,
    `schermgebruik ${scale(a.screen)}`,
    `slaap ${scale(a.sleep)}`,
    `beweging ${a.movement}`,
    `discussies vooral over: ${a.discussions.join(", ") || "niet opgegeven"}`,
    `ouder wil minder achteraan zitten bij: ${a.lessNagging.join(", ") || "niet opgegeven"}`,
    `sterke kanten kind: ${a.strengths.join(", ") || "niet opgegeven"}`,
    `motiveert: ${a.motivators.join(", ") || "niet opgegeven"}`,
    `doelen 4 weken: ${a.focusFourWeeks.join(", ") || "niet opgegeven"}`,
  ].join("; ");
}

export const CATEGORY_TEXT = CATEGORY_LABEL;
