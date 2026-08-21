import type { AppData, ConflictReport, FlowAction, Person, Reminder } from "@/lib/types";
import { dateKey, isDone, streakDays, tasksForPerson } from "@/lib/utils";

/**
 * AI Orchestrator / event-agent (release 3 §14, §37-38).
 *
 * FlowRuntime consumeert deze functies bij het openen van de app en op een
 * interval, en vertaalt events naar FlowAction. Dit is bewust gescheiden van
 * lib/coach/events.ts (de bestaande, kleine "toast na taak afvinken"-regel):
 * dit bestand beslist wanneer Flow een heel GESPREK moet starten, niet alleen
 * een los berichtje.
 */

function alreadyPromptedToday(data: AppData, personId: string, marker: string): boolean {
  const today = dateKey();
  return (data.coachEvents ?? []).some(
    (e) => e.personId === personId && e.type === marker && e.createdAt.slice(0, 10) === today,
  );
}

/** NO_ACTIVITY: stelt Flow's activity coach voor als er nog niet bewogen is. */
export function checkNoActivity(data: AppData, person: Person, now: Date = new Date()): FlowAction | null {
  if (person.role !== "child") return null;
  if (now.getHours() < 10 || now.getHours() >= 20) return null;
  if (alreadyPromptedToday(data, person.id, "NO_ACTIVITY_PROMPTED")) return null;

  const today = dateKey(now);
  const movementLog = (data.wellnessLogs ?? []).some(
    (l) => l.personId === person.id && l.date === today && l.kind === "movement",
  );
  if (movementLog) return null;

  const movementDone = tasksForPerson(data, person.id, now)
    .filter((t) => t.category === "beweging")
    .some((t) => isDone(data, t.id, now));
  if (movementDone) return null;

  const pending = (data.pendingActivities ?? []).some((p) => p.personId === person.id);
  if (pending) return null;

  return {
    type: "START_CONVERSATION",
    flowId: "activity-coach",
    message: "Je hebt vandaag nog niet bewogen. Wil je dat ik je help kiezen?",
    avatarState: "coaching",
    reason: "no movement logged today",
  };
}

/** Zoekt een conflict waarvan de follow-up-termijn (§30) is verstreken. */
export function findDueFollowUp(data: AppData, person: Person, now: Date = new Date()): ConflictReport | null {
  const due = (data.conflicts ?? []).find(
    (c) => c.personId === person.id && c.followUpAt && !c.followUpAnsweredAt && new Date(c.followUpAt).getTime() <= now.getTime(),
  );
  return due ?? null;
}

/**
 * Herinnering (§14, §40): een door een ouder ingestelde reminder waarvan de
 * tijd is verstreken. Dit is de "ouder is even te druk, Flow springt bij"-laag —
 * werkt puur op dueAt, geen AI nodig om te bepalen of het moment daar is.
 */
export function findDueReminder(data: AppData, person: Person, now: Date = new Date()): Reminder | null {
  const due = (data.reminders ?? []).find(
    (r) => r.personId === person.id && r.status === "pending" && new Date(r.dueAt).getTime() <= now.getTime(),
  );
  return due ?? null;
}

/** Zoekt een lopend pending activity (§40-41: "welkom terug") voor deze persoon. */
export function findPendingActivity(data: AppData, personId: string) {
  return (data.pendingActivities ?? []).find((p) => p.personId === personId) ?? null;
}

export function streakMilestoneAction(data: AppData, person: Person, now: Date = new Date()): FlowAction | null {
  const streak = streakDays(data, person.id, now);
  if (streak > 0 && streak % 7 === 0 && !alreadyPromptedToday(data, person.id, "STREAK_MILESTONE_PROMPTED")) {
    return {
      type: "SEND_MESSAGE",
      message: `🔥 ${streak} dagen op rij. Dat is een patroon aan het worden.`,
      avatarState: "celebrating",
      reason: "streak milestone",
    };
  }
  return null;
}
