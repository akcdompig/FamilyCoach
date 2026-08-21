import type { FlowDefinition } from "@/lib/ai/conversation";
import type { ConversationFlowId } from "@/lib/types";
import { activityCoachFlow } from "./activityCoach";
import { conflictCoachFlow } from "./conflictCoach";
import { conflictFollowupFlow } from "./conflictFollowup";
import { freeChatFlow } from "./freeChat";
import { reminderCheckFlow } from "./reminderCheck";

export const FLOW_REGISTRY: Record<ConversationFlowId, FlowDefinition> = {
  "conflict-coach": conflictCoachFlow,
  "conflict-followup": conflictFollowupFlow,
  "activity-coach": activityCoachFlow,
  "free-chat": freeChatFlow,
  "reminder-check": reminderCheckFlow,
};

export { activityCoachFlow, conflictCoachFlow, conflictFollowupFlow, freeChatFlow, reminderCheckFlow };
