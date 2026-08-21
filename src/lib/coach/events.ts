import type { AppData, CoachEvent, Person } from "@/lib/types";
import { dateKey, dayProgress, streakDays } from "@/lib/utils";

export type CoachAction =
  | "SEND_COACH_MESSAGE"
  | "SEND_REMINDER"
  | "ASK_CHECKIN"
  | "SUGGEST_ACTIVITY"
  | "CELEBRATE"
  | "ESCALATE_TO_PARENT"
  | "DO_NOTHING";

export interface AgentDecision {
  action: CoachAction;
  priority: "low" | "normal" | "high";
  message?: string;
  reason: string;
}

export interface FamilyFlowAgentInput {
  user: Person;
  family: AppData["family"];
  event: CoachEvent["type"];
  context: AppData;
}

const positiveEvents = new Set(["TASK_COMPLETED", "SPORT_COMPLETED", "READING_COMPLETED", "FAMILY_ACTIVITY_COMPLETED", "REWARD_UNLOCKED"]);

export function handleCoachEvent(input: FamilyFlowAgentInput): AgentDecision {
  const { context, user, event } = input;
  const todayMessages = context.messages.filter(
    (message) => message.personId === user.id && message.createdAt.slice(0, 10) === dateKey(),
  );
  if (todayMessages.length >= context.settings.maxMomentsPerDay) {
    return { action: "DO_NOTHING", priority: "low", reason: "daily notification limit" };
  }
  if (event === "LOW_MOOD" || event === "CONFLICT_REPORTED") {
    return {
      action: "SEND_COACH_MESSAGE",
      priority: "high",
      message: "Dank je dat je dit deelt. Zullen we samen één kleine volgende stap kiezen?",
      reason: "supportive response",
    };
  }
  if (positiveEvents.has(event)) {
    const progress = dayProgress(context, user.id);
    return {
      action: "CELEBRATE",
      priority: "low",
      message: progress.done > 0 ? "Goed bezig. Je hebt vandaag alweer een stap gezet." : "Mooi moment. Dit telt mee.",
      reason: "positive event",
    };
  }
  if (event === "STREAK_STARTED" && streakDays(context, user.id) >= 3) {
    return { action: "CELEBRATE", priority: "normal", message: `${streakDays(context, user.id)} dagen achter elkaar. Je bent lekker op weg.`, reason: "streak milestone" };
  }
  if (event === "TASK_MISSED") {
    return { action: "DO_NOTHING", priority: "low", reason: "one missed task does not need a notification" };
  }
  return { action: "DO_NOTHING", priority: "low", reason: "no useful coach moment" };
}

export function appendCoachEvent(data: AppData, event: Omit<CoachEvent, "id" | "familyId" | "createdAt">): CoachEvent {
  const entry: CoachEvent = { ...event, id: `evt_${Math.random().toString(36).slice(2, 10)}`, familyId: data.family.id, createdAt: new Date().toISOString() };
  data.coachEvents = [...(data.coachEvents ?? []), entry];
  return entry;
}
