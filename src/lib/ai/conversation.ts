import type {
  AppData,
  ConversationChoice,
  ConversationFlowId,
  ConversationInputType,
  ConversationSession,
  ConversationTurn,
  FlowAvatarState,
  Person,
} from "@/lib/types";

/**
 * Conversational decision engine (release 3 §3, §15).
 *
 *   Observe -> Ask -> Listen -> Interpret -> Offer choices -> Respond ->
 *   Suggest action -> Confirm -> Follow up
 *
 * Flows zijn data: een graaf van stappen (FlowStep) die met elkaar praten via
 * ConversationSession.answers. De graaf zelf is synchroon en deterministisch
 * (werkt zonder AI/netwerk); losse stappen mogen wél asynchroon naar de
 * server (api/flow) om een AI-tier te gebruiken voor synthese (analyse,
 * roleplay, research). Side effects op AppData lopen altijd via ctx.mutate,
 * zodat de FamilyFlowProvider de enige bron van waarheid blijft.
 */

export interface StepRender {
  text: string;
  choices?: ConversationChoice[];
  inputType: ConversationInputType;
  avatarState?: FlowAvatarState;
  placeholder?: string;
  meta?: Record<string, string>;
  /** Kwam deze tekst van de AI-provider of van de regelgebaseerde fallback? Puur voor transparantie in de UI. */
  source?: "ai" | "rules";
}

export interface StepContext {
  /** Werkkopie van de hele app-state voor deze ene "beurt". Alle mutaties in
   *  onSubmit-handlers werken op dit object; FlowRuntime commit't het geheel
   *  in één keer naar de store zodat een beurt nooit een gedeeltelijke of
   *  verouderde snapshot oplevert. */
  data: AppData;
  person: Person;
  session: ConversationSession;
  /** Mutaties op `data` buiten de session (bv. wellness-log, family skill). */
  mutate: (fn: (draft: AppData) => void) => void;
  setAnswer: (key: string, value: string) => void;
  setMeta: (key: string, value: string) => void;
  /** Server-call naar api/flow (AI-provider met safety-laag). */
  callServer: <T = unknown>(task: string, payload: Record<string, unknown>) => Promise<T>;
}

export interface FlowStep {
  id: string;
  render: (ctx: StepContext) => StepRender | Promise<StepRender>;
  /** Bepaalt de volgende stap-id op basis van het antwoord. `null` = gesprek klaar. */
  next: (ctx: StepContext, input: string) => string | null;
  /** Side effects voor het antwoord op DEZE stap (score, opslaan, event loggen). */
  onSubmit?: (ctx: StepContext, input: string) => void;
}

export interface FlowDefinition {
  id: ConversationFlowId;
  title: string;
  entryStepId: string;
  steps: Record<string, FlowStep>;
}

export function mkChoice(id: string, label: string, emoji?: string): ConversationChoice {
  return { id, label: emoji ? `${emoji} ${label}` : label, emoji };
}

export function newSession(
  familyId: string,
  personId: string,
  flowId: ConversationFlowId,
  entryStepId: string,
  meta: Record<string, string> = {},
): ConversationSession {
  const now = new Date().toISOString();
  return {
    id: `conv_${Math.random().toString(36).slice(2, 10)}`,
    familyId,
    personId,
    flowId,
    stepId: entryStepId,
    status: "active",
    turns: [],
    answers: {},
    meta,
    startedAt: now,
    updatedAt: now,
  };
}

export function mkTurn(
  speaker: ConversationTurn["speaker"],
  text: string,
  choices?: ConversationChoice[],
  source?: "ai" | "rules",
): ConversationTurn {
  return {
    id: `turn_${Math.random().toString(36).slice(2, 8)}`,
    speaker,
    text,
    choices,
    source,
    createdAt: new Date().toISOString(),
  };
}

/* --------------------------------------------------------------------- */
/* Intent classificatie (fast tier, geen netwerk nodig)                  */
/* --------------------------------------------------------------------- */

export type ConversationIntent =
  | "start_conflict"
  | "ask_question"
  | "request_activity"
  | "vent"
  | "small_talk";

const CONFLICT_HINTS = /\bruzie|conflict|boos op|boos ben op|scheldt|schreeuwde|pakte mijn|niet meer mijn vriend(in)?\b/i;
const ACTIVITY_HINTS = /\bwil (bewegen|sporten|iets doen)|help me kiezen|wat kan ik doen|geen zin\b/i;
const VENT_HINTS = /\bwil het gewoon (even )?vertellen|even luisteren|geen advies\b/i;

/** Lichte classifier: fast-tier taak, draait lokaal zonder API-call. */
export function classifyIntent(text: string): ConversationIntent {
  const trimmed = text.trim();
  if (CONFLICT_HINTS.test(trimmed)) return "start_conflict";
  if (VENT_HINTS.test(trimmed)) return "vent";
  if (ACTIVITY_HINTS.test(trimmed)) return "request_activity";
  if (/\?|\bhoeveel\b|\bwaarom\b|\bwat is\b|\bhoe werkt\b/i.test(trimmed)) return "ask_question";
  return "small_talk";
}

/** Zoekt een familielid-naam terug uit vrije tekst, voor prefill van "met wie". */
export function findMentionedPerson(text: string, people: Person[]): Person | undefined {
  const lower = text.toLowerCase();
  return people.find((p) => lower.includes(p.name.toLowerCase()));
}

/* --------------------------------------------------------------------- */
/* Runner                                                                */
/* --------------------------------------------------------------------- */

export async function renderCurrentStep(flow: FlowDefinition, ctx: StepContext): Promise<StepRender> {
  const step = flow.steps[ctx.session.stepId];
  if (!step) throw new Error(`FamilyFlow: onbekende stap "${ctx.session.stepId}" in flow "${flow.id}"`);
  return step.render(ctx);
}

/** Verwerkt een antwoord van de gebruiker op de HUIDIGE stap en levert de volgende stap-id. */
export function submitToStep(flow: FlowDefinition, ctx: StepContext, input: string): string | null {
  const step = flow.steps[ctx.session.stepId];
  if (!step) throw new Error(`FamilyFlow: onbekende stap "${ctx.session.stepId}" in flow "${flow.id}"`);
  if (step.onSubmit) step.onSubmit(ctx, input);
  return step.next(ctx, input);
}
