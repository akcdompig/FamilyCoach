import type { AppData, MessageKind, Person } from "@/lib/types";
import {
  addDays,
  checkInFor,
  dateKey,
  dayProgress,
  minutesFromString,
  partOfDay,
  tasksForPerson,
  isDone,
} from "@/lib/utils";

export interface MomentDecision {
  allowed: boolean;
  kind: MessageKind;
  reason: string;
}

/**
 * Notification-/rules engine.
 *
 * Het uitgangspunt van FamilyFlow is minder nagging, dus de engine is
 * standaard stil. Een coachmoment moet zich verdienen: buiten quiet hours,
 * binnen het dagmaximum, met genoeg tussentijd, en niet als de vorige vraag
 * nog open staat.
 */
export function decideCoachMoment(data: AppData, person: Person, now: Date = new Date()): MomentDecision {
  const { quietFrom, quietTo, maxMomentsPerDay, minGapMinutes } = data.settings;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const from = minutesFromString(quietFrom);
  const to = minutesFromString(quietTo);
  const inQuietHours = from > to ? minutes >= from || minutes < to : minutes >= from && minutes < to;

  const today = dateKey(now);
  const todaysMessages = data.messages.filter(
    (m) => m.personId === person.id && m.createdAt.slice(0, 10) === today,
  );
  const last = [...todaysMessages].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const progress = dayProgress(data, person.id, now);
  const checkIn = checkInFor(data, person.id, now);
  const openTasks = tasksForPerson(data, person.id, now).filter((t) => !isDone(data, t.id, now));

  const deny = (reason: string): MomentDecision => ({ allowed: false, kind: "nudge", reason });

  if (inQuietHours) return deny("quiet hours");
  if (todaysMessages.length >= maxMomentsPerDay) return deny("dagmaximum bereikt");
  if (last) {
    const gap = (now.getTime() - new Date(last.createdAt).getTime()) / 60000;
    if (gap < minGapMinutes) return deny("te kort na vorig moment");
    // Geen herhaalde reminder als er nog niet gereageerd is.
    if (!last.answeredAt && !last.dismissedAt && last.kind !== "praise") {
      return deny("vorige bericht nog onbeantwoord");
    }
  }

  const period = partOfDay(now);

  if (person.role === "child") {
    if (!checkIn) return { allowed: true, kind: "checkin", reason: "nog geen check-in vandaag" };
    if (progress.total > 0 && progress.done === progress.total) {
      return { allowed: true, kind: "praise", reason: "alles afgerond" };
    }
    if (openTasks.length > 0 && period !== "ochtend") {
      return { allowed: true, kind: "suggestion", reason: "open afspraken" };
    }
    if (openTasks.length > 0) return { allowed: true, kind: "nudge", reason: "open afspraken" };
    return deny("niets zinnigs te melden");
  }

  if (!checkIn && period === "ochtend") {
    return { allowed: true, kind: "checkin", reason: "ouder-check-in" };
  }
  if (period === "avond") return { allowed: true, kind: "insight", reason: "dagafsluiting" };
  return { allowed: true, kind: "parent-tip", reason: "ouder-coaching" };
}

export interface Escalation {
  childName: string;
  taskTitle: string;
  days: number;
}

/**
 * Escalatie richting ouder gebeurt alleen bij een patroon, niet bij één gemiste
 * taak. Zo krijgt een ouder geen melding voor elk los vinkje.
 */
export function findEscalations(data: AppData, now: Date = new Date()): Escalation[] {
  const results: Escalation[] = [];
  for (const child of data.people.filter((p) => p.role === "child")) {
    for (const task of data.tasks.filter((t) => t.personId === child.id && t.active)) {
      let missed = 0;
      for (let i = 1; i <= 4; i += 1) {
        const day = addDays(now, -i);
        if (!task.days.includes(day.getDay())) continue;
        if (isDone(data, task.id, day)) break;
        missed += 1;
      }
      if (missed >= 3) results.push({ childName: child.name, taskTitle: task.title, days: missed });
    }
  }
  return results.slice(0, 2);
}

/** Wordt gebruikt in het ouderdashboard: één concrete actie, geen takenlijst. */
export function parentFocusSuggestion(data: AppData, now: Date = new Date()): string {
  const escalations = findEscalations(data, now);
  if (escalations.length > 0) {
    const first = escalations[0];
    return `"${first.taskTitle}" lukt bij ${first.childName} al een paar dagen niet. Maak de afspraak kleiner of verplaats hem naar een rustiger moment.`;
  }
  const children = data.people.filter((p) => p.role === "child");
  const behind = children
    .map((child) => ({ child, progress: dayProgress(data, child.id, now) }))
    .filter((entry) => entry.progress.total > 0)
    .sort((a, b) => a.progress.ratio - b.progress.ratio)[0];
  if (behind && behind.progress.ratio < 0.5) {
    return `Kies vandaag één afspraak van ${behind.child.name} die echt telt en laat de rest los.`;
  }
  return "Vandaag loopt het. Mooi moment om even niets te herinneren en iets leuks te doen.";
}
