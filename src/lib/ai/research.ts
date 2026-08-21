/**
 * ResearchService (release 3 §10-12, §31-32).
 *
 * Architectuur:
 *   vraag -> needsExternalInformation() (signaal) -> AI-provider (research-tier)
 *   beantwoordt zelf, op basis van eigen kennis -> kort, leeftijdspassend antwoord.
 *
 * Er is bewust geen kennisbank die als poort fungeert: needsExternalInformation()
 * bepaalt alleen welke prompt/toon gebruikt wordt (feitelijk en voorzichtig i.p.v.
 * coachend), nooit of de AI wel of niet mag antwoorden. TRUSTED_SOURCES blijft
 * bestaan als voorbeeldbronnen die de AI in de synthese-prompt mag noemen en die
 * in de JSON-respons als algemene suggestie meegaan — geen opgezochte bron voor
 * dít specifieke antwoord, gewoon "dit soort dingen check je normaal hier".
 *
 * Flow toont nooit een lijst met links aan een kind. Het antwoord is een korte
 * synthese plus "Ik heb dit gecontroleerd bij betrouwbare bronnen"; de
 * brongegevens zelf zijn alleen zichtbaar via "Meer informatie" (parent detail
 * mode, zie §34).
 */

export type SourceTier = "government" | "health" | "education" | "science" | "parenting";

export interface TrustedSource {
  name: string;
  domain: string;
  tier: SourceTier;
}

/**
 * Allowlist van bekende, gevestigde bronnen. Geen forums, geen blogs, geen
 * commerciële SEO-sites. Dit is configuratie, geen live index — een echte
 * SearchProvider zou zoekresultaten tegen deze lijst filteren voordat Flow ze
 * ooit ziet.
 */
export const TRUSTED_SOURCES: TrustedSource[] = [
  { name: "Rijksoverheid", domain: "rijksoverheid.nl", tier: "government" },
  { name: "Thuisarts.nl", domain: "thuisarts.nl", tier: "health" },
  { name: "Voedingscentrum", domain: "voedingscentrum.nl", tier: "health" },
  { name: "Nederlands Jeugdinstituut", domain: "nji.nl", tier: "parenting" },
  { name: "Kindertelefoon", domain: "kindertelefoon.nl", tier: "parenting" },
  { name: "GGD", domain: "ggd.nl", tier: "government" },
  { name: "World Health Organization", domain: "who.int", tier: "health" },
  { name: "UNICEF", domain: "unicef.org", tier: "parenting" },
  { name: "Sleep Foundation", domain: "sleepfoundation.org", tier: "science" },
];

const SOURCE_RANK: Record<SourceTier, number> = {
  government: 1,
  health: 2,
  education: 3,
  science: 4,
  parenting: 5,
};

export function rankSources(sources: TrustedSource[]): TrustedSource[] {
  return [...sources].sort((a, b) => SOURCE_RANK[a.tier] - SOURCE_RANK[b.tier]);
}

/** Herkent feitelijke vragen die baat hebben bij externe informatie i.p.v. coaching. */
const FACTUAL_PATTERNS = [
  /\bhoeveel (slaap|water|beweging|uur|minuten|suiker)\b/i,
  /\bwaarom is .* (belangrijk|nodig|gezond)\b/i,
  /\bwat is een? (goede|gezonde) manier\b/i,
  /\bhoe (werkt|plan ik|leer ik)\b/i,
  /\bwat gebeurt er als\b/i,
  /\bklopt het dat\b/i,
  /\bis het (slecht|erg|gevaarlijk|normaal)\b/i,
];

/**
 * Puur een signaal, geen poort: bepaalt of een vraag baat heeft bij een
 * feitelijke, voorzichtige toon (research-tier prompt) i.p.v. de gewone
 * coachende free-chat-toon. Levert nooit "nee" op een vraag die de AI niet
 * zou kunnen beantwoorden — dat oordeel ligt bij de AI zelf, met de
 * instructie om terughoudend te zijn bij onzekere feiten.
 */
export function needsExternalInformation(question: string): boolean {
  return FACTUAL_PATTERNS.some((pattern) => pattern.test(question));
}

/** Algemene bronsuggestie voor bij een research-antwoord — geen opgezochte bron voor dít antwoord. */
export function suggestedSources(limit = 3): TrustedSource[] {
  return rankSources(TRUSTED_SOURCES).slice(0, limit);
}
