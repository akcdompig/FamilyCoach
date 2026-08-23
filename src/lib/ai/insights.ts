import type { AppData, Person, Task } from "@/lib/types";
import {
  addDays,
  dateKey,
  goalProgressFor,
  isDone,
  isTaskOnDay,
  milestonesFor,
  movedInTasks,
  partOfDay,
  tasksForPerson,
} from "@/lib/utils";

/**
 * FLOW's contextuele reflectie-inzichten (release 4). Dit is bewust GEEN
 * conversatie-trigger zoals lib/ai/agent.ts (dat opent een heel gesprek) —
 * een insight is een op zichzelf staand kaartje met hooguit één link naar een
 * bestaand scherm, geen chatvenster. Alles hier leest bestaande data
 * (afspraken, doelen, taskAdjustments); er wordt niets nieuws bijgehouden.
 */
export interface FlowInsight {
  /** Stabiele sleutel — voorkomt dat hetzelfde moment blijft terugkomen. */
  id: string;
  title: string;
  message: string;
  tone: "celebrate" | "reflect" | "plan";
  href?: string;
  linkLabel?: string;
}

function hasCoachEvent(data: AppData, personId: string, marker: string): boolean {
  return (data.coachEvents ?? []).some((e) => e.personId === personId && e.type === marker);
}

function alreadyShownToday(data: AppData, personId: string, marker: string): boolean {
  const today = dateKey();
  return (data.coachEvents ?? []).some(
    (e) => e.personId === personId && e.type === marker && e.createdAt.slice(0, 10) === today,
  );
}

/** Hoeveel keer op rij een specifieke afspraak is afgerond, alleen tellend op dagen dat hij gepland stond. */
export function taskConsistencyStreak(data: AppData, task: Task, now: Date = new Date()): number {
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    const day = addDays(now, -i);
    if (!isTaskOnDay(task, day)) continue;
    if (isDone(data, task.id, day)) streak += 1;
    else break;
  }
  return streak;
}

/** "Je doel schiet op" — vuurt op de dag dat een gekoppeld doel écht een mijlpaal passeert, nooit twee keer voor dezelfde. */
export function goalMomentumInsight(data: AppData, person: Person, now: Date = new Date()): FlowInsight | null {
  if (person.role !== "child") return null;
  const todayKey = dateKey(now);
  const goals = data.goals.filter(
    (g) => (!g.personId || g.personId === person.id) && g.linkedTaskIds && g.linkedTaskIds.length > 0,
  );
  for (const goal of goals) {
    const completedToday = data.completions.some(
      (c) => c.date === todayKey && c.personId === person.id && goal.linkedTaskIds!.includes(c.taskId),
    );
    if (!completedToday) continue;
    const progress = goalProgressFor(data, goal);
    const crossed = milestonesFor(goal).find((m) => m.threshold === progress);
    if (!crossed) continue;
    const marker = `INSIGHT_GOAL_${goal.id}_${crossed.threshold}`;
    if (hasCoachEvent(data, person.id, marker)) continue;
    const achieved = progress >= goal.target;
    return {
      id: marker,
      title: achieved ? "Doel behaald" : "Doel in beweging",
      message: achieved
        ? `Je doel "${goal.title}" is behaald. Waar wil je nu naartoe werken?`
        : `Je doel "${goal.title}" schiet op — ${progress}/${goal.target}${goal.unit ? ` ${goal.unit}` : ""}. Waar wil je je nu op focussen?`,
      tone: "celebrate",
      href: "/kind/doelen",
      linkLabel: "Bekijk mijn doelen",
    };
  }
  return null;
}

/** "Je houdt dit al drie weken vol" — beloont vol te houden gedrag op een specifieke afspraak, niet de dag als geheel. */
export function taskConsistencyInsight(data: AppData, person: Person, now: Date = new Date()): FlowInsight | null {
  if (person.role !== "child") return null;
  for (const task of data.tasks.filter((t) => t.personId === person.id && t.active)) {
    const streak = taskConsistencyStreak(data, task, now);
    if (streak < 5 || streak % 5 !== 0) continue;
    const marker = `INSIGHT_TASK_${task.id}_${streak}`;
    if (hasCoachEvent(data, person.id, marker)) continue;
    return {
      id: marker,
      title: "Vol gehouden",
      message: `Je houdt "${task.title}" al ${streak} keer op rij vol. Dat wordt een gewoonte.`,
      tone: "celebrate",
    };
  }
  return null;
}

/** "Vandaag liep anders — kijk mee naar morgen" — alleen 's avonds, en alleen als er vandaag echt is bijgestuurd. */
export function replanReflectionInsight(data: AppData, person: Person, now: Date = new Date()): FlowInsight | null {
  if (person.role !== "child") return null;
  if (partOfDay(now) !== "avond") return null;
  const marker = "INSIGHT_REPLAN_REFLECTION";
  if (alreadyShownToday(data, person.id, marker)) return null;

  const todayKey = dateKey(now);
  const adjustedToday = (data.taskAdjustments ?? []).some(
    (a) => a.personId === person.id && a.date === todayKey && a.action,
  );
  if (!adjustedToday) return null;

  return {
    id: marker,
    title: "Vandaag bijgestuurd",
    message: "Vandaag liep anders dan gepland. Kijk je nog even mee naar morgen?",
    tone: "reflect",
    href: "/kind/plan?tab=week",
    linkLabel: "Bekijk de week",
  };
}

/** "Morgen wordt druk" — een vooruitblik, geen taak-verplaatsknop: Plan ondersteunt vandaag nog geen bewerken van andere dagen. */
export function tomorrowLoadInsight(data: AppData, person: Person, now: Date = new Date()): FlowInsight | null {
  if (person.role !== "child") return null;
  if (partOfDay(now) !== "avond") return null;
  const marker = "INSIGHT_TOMORROW_LOAD";
  if (alreadyShownToday(data, person.id, marker)) return null;

  const tomorrow = addDays(now, 1);
  const count = tasksForPerson(data, person.id, tomorrow).length + movedInTasks(data, person.id, tomorrow).length;
  if (count < 3) return null;

  return {
    id: marker,
    title: "Morgen alvast bekijken",
    message: `Morgen staan er ${count} dingen gepland. Vast even kijken of dat haalbaar voelt?`,
    tone: "plan",
    href: "/kind/plan?tab=week",
    linkLabel: "Bekijk de week",
  };
}

/** Eén inzicht tegelijk, in volgorde van wat het meest de moeite waard is om te tonen. */
export function computeFlowInsight(data: AppData, person: Person, now: Date = new Date()): FlowInsight | null {
  return (
    goalMomentumInsight(data, person, now) ??
    taskConsistencyInsight(data, person, now) ??
    replanReflectionInsight(data, person, now) ??
    tomorrowLoadInsight(data, person, now)
  );
}
