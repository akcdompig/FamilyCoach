import type { AppData, CoachMessage, ConflictReport, MemoryFact, Person } from "@/lib/types";

/**
 * Lichte "memory": geen vectorstore, wel genoeg om herhaling te voorkomen.
 * Alleen de laatste berichten van deze persoon gaan mee als context.
 */
export function recentMessages(data: AppData, personId: string, limit = 4): CoachMessage[] {
  return data.messages
    .filter((m) => m.personId === personId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function recentMessageBodies(data: AppData, personId: string, limit = 4): string[] {
  return recentMessages(data, personId, limit).map((m) => m.body);
}

/** Voorkomt dat een (fallback)bericht letterlijk hetzelfde is als kort geleden. */
export function isRepeat(data: AppData, personId: string, body: string): boolean {
  return recentMessageBodies(data, personId, 6).some(
    (previous) => previous.trim().toLowerCase() === body.trim().toLowerCase(),
  );
}

/* --------------------------------------------------------------------- */
/* Long-term memory (release 3 §16)                                      */
/*                                                                       */
/* Short-term memory = de actieve ConversationSession (lib/ai/conversation)  */
/* Long-term memory  = MemoryFact[], hier beheerd: kort, relevant, geen   */
/* transcripten en geen gevoelige data.                                  */
/* --------------------------------------------------------------------- */

const MAX_FACTS_PER_PERSON = 20;

export function memoryFactsFor(data: AppData, personId: string): MemoryFact[] {
  return (data.memoryFacts ?? [])
    .filter((f) => f.personId === personId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Platte zinnen voor in een AI-prompt. Geen id's, geen timestamps. */
export function memoryFactTexts(data: AppData, personId: string, limit = 6): string[] {
  return memoryFactsFor(data, personId).slice(0, limit).map((f) => f.text);
}

function pushFact(data: AppData, fact: Omit<MemoryFact, "id" | "familyId" | "createdAt">): void {
  const existing = memoryFactsFor(data, fact.personId);
  if (existing.some((f) => f.text === fact.text)) return;
  const entry: MemoryFact = {
    ...fact,
    id: `mem_${Math.random().toString(36).slice(2, 10)}`,
    familyId: data.family.id,
    createdAt: new Date().toISOString(),
  };
  const all = [...(data.memoryFacts ?? []), entry];
  // Cap per persoon: oudste feiten van deze persoon vallen als eerste weg.
  const mine = all.filter((f) => f.personId === fact.personId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const overflow = mine.slice(MAX_FACTS_PER_PERSON).map((f) => f.id);
  data.memoryFacts = all.filter((f) => !overflow.includes(f.id));
}

/** Zaait een paar feiten uit het profiel. Idempotent (pushFact dedupliceert). */
export function seedMemoryFromProfile(data: AppData, person: Person): void {
  if (person.interests[0]) {
    pushFact(data, {
      personId: person.id,
      category: "interest",
      text: `${person.name} vindt ${person.interests[0]} leuk.`,
      source: "profile",
    });
  }
}

/**
 * Emergente patroonherkenning: als eenzelfde soort conflict herhaaldelijk
 * niet oplost, is dat relevant voor Flow om te weten — zonder te oordelen.
 */
export function noteConflictPattern(data: AppData, conflict: ConflictReport): void {
  const similar = (data.conflicts ?? []).filter(
    (c) => c.personId === conflict.personId && c.withWhom === conflict.withWhom && c.topic === conflict.topic,
  );
  if (similar.length >= 2) {
    pushFact(data, {
      personId: conflict.personId,
      category: "pattern",
      text: `Conflicten met ${conflict.withWhom} over ${conflict.topic} komen vaker terug.`,
      source: "conversation",
    });
  }
}

export function addManualMemoryFact(
  data: AppData,
  personId: string,
  category: MemoryFact["category"],
  text: string,
): void {
  pushFact(data, { personId, category, text, source: "manual" });
}

export function forgetMemoryFact(data: AppData, factId: string): void {
  data.memoryFacts = (data.memoryFacts ?? []).filter((f) => f.id !== factId);
}
