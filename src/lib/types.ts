/**
 * FamilyFlow domeinmodel.
 * Bewust plat gehouden: elk record heeft een id + timestamps zodat de
 * localStorage-repository 1-op-1 op de Postgres-tabellen (supabase/schema.sql)
 * gemapt kan worden zonder het datamodel te herschrijven.
 */

export type Role = "parent" | "child" | "coach";
export type Mood = "good" | "ok" | "low";

export type Category =
  | "ochtend"
  | "school"
  | "beweging"
  | "wellness"
  | "lezen"
  | "scherm"
  | "avond"
  | "huishouden"
  | "samen";

export type MessageKind =
  | "checkin"
  | "nudge"
  | "praise"
  | "insight"
  | "suggestion"
  | "parent-tip";

export interface Family {
  id: string;
  name: string;
  createdAt: string;
  pilotCode?: string;
}

export interface Person {
  id: string;
  familyId: string;
  name: string;
  role: Role;
  age?: number;
  color: string;
  interests: string[];
  school?: string;
  likes?: string;
  hard?: string;
  createdAt: string;
}

export interface IntakeAnswers {
  struggles: string[];
  goingWell: string[];
  morning: number;
  evening: number;
  school: number;
  screen: number;
  sleep: number;
  movement: "weinig" | "matig" | "veel";
  existingAgreements: string;
  forgottenAgreements: string;
  discussions: string[];
  lessNagging: string[];
  strengths: string[];
  motivators: string[];
  focusFourWeeks: string[];
}

export interface Intake {
  id: string;
  familyId: string;
  answers: IntakeAnswers;
  createdAt: string;
}

export interface CoachProfile {
  id: string;
  familyId: string;
  focusAreas: string[];
  motivation: string[];
  tone: string[];
  summary: string;
  createdAt: string;
  source: "ai" | "rules";
}

/** Een "afspraak". Intern task genoemd omdat hij afvinkbaar en herhalend is. */
export interface Task {
  id: string;
  familyId: string;
  personId: string;
  title: string;
  category: Category;
  time?: string; // "07:30"
  days: number[]; // 0 = zondag ... 6 = zaterdag
  points: number;
  shared: boolean;
  active: boolean;
  verification?: VerificationStatus;
  createdAt: string;
}

export type VerificationStatus =
  | "SELF_REPORTED"
  | "PARENT_CONFIRMED"
  | "EVIDENCE_ATTACHED"
  | "INTEGRATION_VERIFIED";

export type TaskAdjustmentAction = "postponed" | "skipped";

/**
 * Per-dag aanpassing op een terugkerende afspraak — het "Replan, don't fail"
 * mechanisme. Verandert nooit de Task zelf, alleen wat er voor één
 * specifieke dag geldt. Zonder record: gewoon de normale terugkerende dag.
 */
export interface TaskAdjustment {
  id: string;
  taskId: string;
  personId: string;
  date: string; // YYYY-MM-DD, de oorspronkelijk geplande dag
  action?: TaskAdjustmentAction;
  movedToDate?: string; // vereist wanneer action === "postponed"
  priority?: "high";
  createdAt: string;
}

export type WellnessKind = "water" | "fruit" | "breakfast" | "movement" | "reading" | "teeth";

export interface WellnessLog {
  id: string;
  familyId: string;
  personId: string;
  kind: WellnessKind;
  value: number;
  unit: string;
  date: string;
  note?: string;
  verification: VerificationStatus;
  createdAt: string;
}

export interface ReadingEntry {
  id: string;
  familyId: string;
  personId: string;
  title: string;
  minutes: number;
  pages?: number;
  reflection?: string;
  rating?: number;
  date: string;
  createdAt: string;
}

export type ConflictStatus = "open" | "attempting" | "resolved" | "unresolved" | "cooling_off";
export type FollowUpResult = "good" | "better" | "not_resolved" | "still_conflict";

export interface ConflictReport {
  id: string;
  familyId: string;
  personId: string;
  withWhom: string;
  topic: string;
  feeling: string;
  otherFeeling?: string;
  goal?: string;
  description: string;
  privacy: "PRIVATE" | "PARENT_VISIBLE" | "SAFETY_RELEVANT";
  status: ConflictStatus;
  suggestedMessage?: string;
  practiced?: boolean;
  followUpAt?: string;
  followUpResult?: FollowUpResult;
  followUpAnsweredAt?: string;
  createdAt: string;
}

export interface CoachEvent {
  id: string;
  familyId: string;
  personId: string;
  type: string;
  createdAt: string;
  handledAt?: string;
}

/** Zie lib/ai/agent.ts — het gestandaardiseerde event-vocabulaire dat Flow consumeert. */
export type FamilyFlowEventType =
  | "TASK_COMPLETED"
  | "TASK_MISSED"
  | "CONFLICT_REPORTED"
  | "CONFLICT_FOLLOWUP_DUE"
  | "CHECKIN_COMPLETED"
  | "STREAK_MILESTONE"
  | "WATER_LOGGED"
  | "READING_COMPLETED"
  | "SPORT_COMPLETED"
  | "REWARD_UNLOCKED"
  | "FAMILY_ACTIVITY_COMPLETED"
  | "NO_ACTIVITY"
  | "LOW_MOOD"
  | "HOMEWORK_COMPLETED"
  | "REMINDER_DUE";

/** Family Skills: bewust losstaand van punten. Nooit "geen ruzie" belonen, wel gedrag. */
export type FamilySkillType =
  | "calm_communication"
  | "listening"
  | "responsibility"
  | "apology"
  | "conflict_resolved"
  | "agreement_made";

export interface FamilySkillEvent {
  id: string;
  familyId: string;
  personId: string;
  type: FamilySkillType;
  points: number;
  conflictId?: string;
  createdAt: string;
}

export type MemoryCategory = "interest" | "preference" | "goal" | "pattern" | "dislike";

/** Long-term memory: korte, relevante feiten. Geen transcripten, geen gevoelige data. */
export interface MemoryFact {
  id: string;
  familyId: string;
  personId: string;
  category: MemoryCategory;
  text: string;
  source: "profile" | "conversation" | "manual";
  createdAt: string;
}

export type PendingActivity = {
  id: string;
  personId: string;
  label: string;
  minutes: number;
  startedAt: string;
};

export type ReminderStatus = "pending" | "done" | "snoozed" | "dismissed";

/**
 * Een door een ouder (of Flow) ingestelde herinnering voor een kind — voor
 * het moment dat een ouder even te druk is om zelf te seinen. Verschijnt als
 * Flow-suggestie zodra `dueAt` verstreken is (release 3 §14, §40).
 */
export interface Reminder {
  id: string;
  familyId: string;
  personId: string;
  createdBy: "parent" | "flow";
  title: string;
  dueAt: string;
  status: ReminderStatus;
  createdAt: string;
  respondedAt?: string;
  /** Wanneer de pushmelding voor deze reminder is verstuurd — voorkomt dubbel pushen. */
  notifiedAt?: string;
}

/**
 * Web Push-abonnement van één apparaat, voor echte meldingen ook als de app
 * dicht is (release 3 §14, §40). Leeft in dezelfde AppData-blob als de rest
 * van het gezin; de cron-taak (api/cron/reminders) leest dit met de
 * service-role key, buiten RLS om, over alle gezinnen heen.
 */
export interface PushSubscriptionRecord {
  id: string;
  personId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
}

export interface FamilyChallenge {
  id: string;
  familyId: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardPoints: number;
  dueDate: string;
  createdAt: string;
}

export interface WalletEntry {
  id: string;
  familyId: string;
  personId: string;
  amount: number;
  label: string;
  status: "earned" | "expected" | "paid";
  createdAt: string;
}

export interface AllowanceSettings {
  weeklyBase: number;
  weeklyMaximum: number;
  streakBonus: number;
  allTasksBonus: number;
  activityBonus: number;
}

export interface Completion {
  id: string;
  taskId: string;
  personId: string;
  date: string; // YYYY-MM-DD
  completedAt: string;
}

export interface CheckIn {
  id: string;
  personId: string;
  date: string;
  mood: Mood;
  note?: string;
  createdAt: string;
}

export type GoalDomain = "health" | "school" | "skills" | "relationships" | "responsibility" | "personal";

export interface GoalMilestone {
  id: string;
  label: string;
  threshold: number; // zelfde schaal als target
}

/** Klein reflectiemoment op een doel — geen dagboek, gewoon "hoe gaat dit eigenlijk". */
export interface GoalReflection {
  id: string;
  text: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  familyId: string;
  personId?: string; // leeg = gezinsdoel
  title: string;
  domain?: GoalDomain; // ontbreekt bij oudere data — behandel dan als "personal"
  target: number;
  unit?: string; // bv. "dagen", "keer", "boeken" — maakt het cijfer leesbaar
  /**
   * Basiswaarde. Bij een doel met linkedTaskIds is dit niet de bron van
   * waarheid — de effectieve voortgang wordt afgeleid uit echte afronding
   * van de gekoppelde afspraken, zie goalProgressFor() in lib/utils.ts.
   */
  progress: number;
  points: number;
  dueDate: string;
  createdAt: string;
  /** Afspraken die, wanneer afgerond, dit doel automatisch vooruit helpen. */
  linkedTaskIds?: string[];
  /** Optioneel eigen mijlpalen; zonder opgave worden ze afgeleid van target, zie milestonesFor(). */
  milestones?: GoalMilestone[];
  reflections?: GoalReflection[];
}

export type RewardType = "tijd" | "activiteit" | "autonomie" | "materieel";

export interface Reward {
  id: string;
  familyId: string;
  title: string;
  cost: number;
  type: RewardType;
  createdAt: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  personId: string;
  date: string;
  status: "aangevraagd" | "goedgekeurd";
  createdAt: string;
}

export interface FamilyActivity {
  id: string;
  familyId: string;
  title: string;
  description: string;
  date: string;
  points: number;
  completedBy: string[];
  createdAt: string;
}

export interface CoachMessage {
  id: string;
  familyId: string;
  personId: string;
  kind: MessageKind;
  body: string;
  suggestions: string[];
  source: "ai" | "rules";
  createdAt: string;
  answeredAt?: string;
  dismissedAt?: string;
}

export interface PilotFeedback {
  id: string;
  familyName: string;
  email: string;
  pilotCode: string;
  good: string;
  annoying: string;
  missing: string;
  score: number;
  extra: string;
  createdAt: string;
}

export interface Settings {
  quietFrom: string; // "21:30"
  quietTo: string; // "07:00"
  maxMomentsPerDay: number;
  minGapMinutes: number;
  aiEnabled: boolean;
  shareInterestsWithAI: boolean;
}

export interface AppData {
  version: number;
  onboarded: boolean;
  isDemo: boolean;
  activePersonId: string;
  family: Family;
  people: Person[];
  intake: Intake | null;
  coachProfile: CoachProfile | null;
  tasks: Task[];
  completions: Completion[];
  checkIns: CheckIn[];
  goals: Goal[];
  rewards: Reward[];
  redemptions: Redemption[];
  activities: FamilyActivity[];
  messages: CoachMessage[];
  pilotFeedback: PilotFeedback[];
  settings: Settings;
  wellnessLogs?: WellnessLog[];
  readingEntries?: ReadingEntry[];
  conflicts?: ConflictReport[];
  coachEvents?: CoachEvent[];
  challenges?: FamilyChallenge[];
  walletEntries?: WalletEntry[];
  allowance?: AllowanceSettings;
  familyPoints?: number;
  familySkillEvents?: FamilySkillEvent[];
  memoryFacts?: MemoryFact[];
  conversations?: ConversationSession[];
  pendingActivities?: PendingActivity[];
  reminders?: Reminder[];
  pushSubscriptions?: PushSubscriptionRecord[];
  taskAdjustments?: TaskAdjustment[];
}

/* --------------------------------------------------------------------- */
/* Flow conversation engine                                              */
/* --------------------------------------------------------------------- */

export type ConversationFlowId =
  | "conflict-coach"
  | "conflict-followup"
  | "activity-coach"
  | "free-chat"
  | "reminder-check";

export interface ConversationChoice {
  id: string;
  label: string;
  emoji?: string;
}

export type ConversationInputType = "choice" | "text" | "none" | "challenge";

export interface ConversationTurn {
  id: string;
  speaker: "flow" | "user";
  text: string;
  choices?: ConversationChoice[];
  createdAt: string;
  /** Alleen voor speaker "flow": kwam deze tekst van de AI-provider, of van de regelgebaseerde fallback? */
  source?: "ai" | "rules";
}

export type FlowAvatarState =
  | "idle"
  | "thinking"
  | "listening"
  | "happy"
  | "celebrating"
  | "concerned"
  | "coaching";

export interface ConversationSession {
  id: string;
  familyId: string;
  personId: string;
  flowId: ConversationFlowId;
  stepId: string;
  status: "active" | "completed" | "paused";
  turns: ConversationTurn[];
  answers: Record<string, string>;
  meta: Record<string, string>;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  relatedConflictId?: string;
}

export type FlowActionType =
  | "SEND_MESSAGE"
  | "ASK_QUESTION"
  | "OFFER_CHOICES"
  | "START_CONVERSATION"
  | "CREATE_REMINDER"
  | "SUGGEST_ACTIVITY"
  | "SUGGEST_REWARD"
  | "START_CONFLICT_COACH"
  | "START_RESEARCH"
  | "ESCALATE"
  | "DO_NOTHING";

export interface FlowAction {
  type: FlowActionType;
  message?: string;
  choices?: ConversationChoice[];
  flowId?: ConversationFlowId;
  avatarState?: FlowAvatarState;
  reason: string;
}

/** Wat er maximaal naar het AI-model gaat. Geen achternamen, geen e-mail, geen id's. */
export interface CoachContext {
  role: Role;
  firstName: string;
  age?: number;
  partOfDay: "ochtend" | "middag" | "avond";
  weekday: string;
  focusAreas: string[];
  motivation: string[];
  tone: string[];
  interests: string[];
  todayTasks: { title: string; done: boolean; time?: string; category: Category }[];
  openCount: number;
  doneCount: number;
  todayMood?: Mood;
  recentMoods: Mood[];
  streakDays: number;
  lastMessages: string[];
  childSummaries?: { firstName: string; done: number; total: number; mood?: Mood }[];
  weekStats?: { tasksDone: number; tasksTotal: number; checkIns: number; movementDays: number; activities: number };
  memoryFacts?: string[];
  simplifiedMode?: boolean;
  /** Dichtstbijzijnde nog niet behaalde doel — zodat Flow ook over groei kan praten, niet alleen over taken. */
  nearestGoal?: { title: string; progress: number; target: number; unit?: string };
  /** Aantal geplande afspraken morgen — voor vooruitkijkende momenten ("morgen wordt druk"). */
  tomorrowCount: number;
}
