import type { ConversationFlowId } from "@/lib/types";

/**
 * Best-effort voortgangsindicator (release 3 §21: "progress dots"). Puur UI —
 * geen invloed op de engine. Stappen die niet in de lijst staan (regeneraties,
 * roleplay-lussen) tellen mee als "onderweg" op de dichtstbijzijnde milestone.
 */
export const FLOW_MILESTONES: Partial<Record<ConversationFlowId, string[]>> = {
  "conflict-coach": [
    "withWhom",
    "topic",
    "feeling",
    "whatHappened",
    "otherFeeling",
    "goal",
    "resolutionPath",
    "solution",
    "practiceOffer",
    "reconnection",
    "followUpOffer",
  ],
  "activity-coach": ["askType", "askDuration", "challengeLaunch"],
};

export function flowProgress(flowId: ConversationFlowId, stepId: string): { index: number; total: number } | null {
  const milestones = FLOW_MILESTONES[flowId];
  if (!milestones || milestones.length === 0) return null;
  const index = milestones.indexOf(stepId);
  if (index === -1) return null;
  return { index, total: milestones.length };
}
