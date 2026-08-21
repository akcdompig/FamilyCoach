import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";
import {
  CONFLICT_COACH_SYSTEM_PROMPT,
  FREE_CHAT_SYSTEM_PROMPT,
  RESEARCH_SYSTEM_PROMPT,
  ROLEPLAY_SYSTEM_PROMPT,
  buildConflictAnalysisPrompt,
  buildFreeChatPrompt,
  buildResearchSynthesisPrompt,
  buildRoleplayPrompt,
} from "@/lib/ai/prompts";
import { checkInputSafety, enforceSafety, ESCALATION_MESSAGE } from "@/lib/ai/safety";
import { fallbackConflictAnalysis, fallbackFreeChat, fallbackRoleplayReply } from "@/lib/ai/flowFallback";
import { needsExternalInformation, suggestedSources } from "@/lib/ai/research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side orchestrator voor de Flow conversation engine (release 3 §35).
 *
 * Input -> safety classifier -> (research indien nodig) -> AI-provider met
 * de juiste model-tier -> output safety check -> antwoord. Draait zonder
 * ANTHROPIC_API_KEY volledig op de sjablonen in lib/ai/flowFallback.ts, zodat
 * de conversation engine end-to-end te testen is zonder credentials.
 */

const str = (value: unknown, max = 200): string => (typeof value === "string" ? value.slice(0, max) : "");
const num = (value: unknown): number | undefined => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
const strArray = (value: unknown, max = 6): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, max).map((v) => v.slice(0, 200)) : [];

function parseJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}

async function handleConflictAnalysis(payload: Record<string, unknown>) {
  const description = str(payload.description, 800);
  const withWhom = str(payload.withWhom, 40) || "iemand";
  const topic = str(payload.topic, 40) || "iets";
  const feeling = str(payload.feeling, 30) || "overstuur";
  const otherFeeling = str(payload.otherFeeling, 30) || undefined;
  const goal = str(payload.goal, 80) || undefined;
  const tone: "default" | "casual" | "alternative" =
    payload.tone === "casual" || payload.tone === "alternative" ? payload.tone : "default";
  const age = num(payload.age);

  const fallback = { ...fallbackConflictAnalysis({ withWhom, topic, feeling, otherFeeling, goal, description, tone }), source: "rules" as const };

  if (!checkInputSafety(description).safe) {
    return NextResponse.json({
      summary: "Dank je dat je dit deelt.",
      message: "Praat hierover met een volwassene die je vertrouwt.",
      source: "rules",
    });
  }

  const provider = getProvider();
  if (!provider.isConfigured()) return NextResponse.json(fallback);

  try {
    const raw = await provider.complete({
      system: CONFLICT_COACH_SYSTEM_PROMPT,
      prompt: buildConflictAnalysisPrompt({ age, withWhom, topic, feeling, otherFeeling, goal, description, tone }),
      maxTokens: 320,
      temperature: 0.7,
      tier: "strong",
    });
    const parsed = parseJson(raw);
    const summary = enforceSafety(str(parsed.summary, 400));
    const message = enforceSafety(str(parsed.message, 240));
    if (!summary.ok || !message.ok || !summary.text || !message.text) return NextResponse.json(fallback);
    return NextResponse.json({ summary: summary.text, message: message.text, source: "ai" });
  } catch (error) {
    console.error("[FamilyFlow] conflict-analysis faalde:", error);
    return NextResponse.json(fallback);
  }
}

async function handleRoleplay(payload: Record<string, unknown>) {
  const withWhom = str(payload.withWhom, 40) || "de ander";
  const topic = str(payload.topic, 40) || "dit";
  const childSaid = str(payload.childSaid, 300);
  const fallback = { ...fallbackRoleplayReply({ withWhom, topic, childSaid }), source: "rules" as const };

  if (!checkInputSafety(childSaid).safe) {
    return NextResponse.json({
      reply: "Laten we dit even stoppen. Praat hierover met een volwassene die je vertrouwt.",
      source: "rules",
    });
  }

  const provider = getProvider();
  if (!provider.isConfigured()) return NextResponse.json(fallback);

  try {
    const raw = await provider.complete({
      system: ROLEPLAY_SYSTEM_PROMPT,
      prompt: buildRoleplayPrompt({ withWhom, topic, childSaid }),
      maxTokens: 120,
      temperature: 0.8,
      tier: "strong",
    });
    const parsed = parseJson(raw);
    const reply = enforceSafety(str(parsed.reply, 200));
    if (!reply.ok || !reply.text) return NextResponse.json(fallback);
    return NextResponse.json({ reply: reply.text, source: "ai" });
  } catch (error) {
    console.error("[FamilyFlow] roleplay-reply faalde:", error);
    return NextResponse.json(fallback);
  }
}

async function handleFreeChat(payload: Record<string, unknown>) {
  const message = str(payload.message, 500);
  const age = num(payload.age);
  const memoryFacts = strArray(payload.memoryFacts, 4);
  const recentTurns = strArray(payload.recentTurns, 4);
  const fallback = { ...fallbackFreeChat({ message, age }), source: "rules" as const };

  if (!checkInputSafety(message).safe) {
    return NextResponse.json({ body: ESCALATION_MESSAGE, choices: ["Begrepen"], suggestConflictCoach: false, source: "rules" });
  }

  const provider = getProvider();
  if (!provider.isConfigured()) return NextResponse.json(fallback);

  try {
    if (needsExternalInformation(message)) {
      const raw = await provider.complete({
        system: RESEARCH_SYSTEM_PROMPT,
        prompt: buildResearchSynthesisPrompt(message, age),
        maxTokens: 260,
        temperature: 0.5,
        tier: "research",
      });
      const parsed = parseJson(raw);
      const answer = enforceSafety(str(parsed.answer, 400));
      if (!answer.ok || !answer.text) {
        console.warn(`[FamilyFlow] research-antwoord verworpen (${answer.reason ?? "leeg"}). Raw: ${raw.slice(0, 200)}`);
        return NextResponse.json(fallback);
      }
      const followUp = str(parsed.followUp, 140);
      return NextResponse.json({
        body: `${answer.text}${followUp ? ` ${followUp}` : ""}`.trim(),
        choices: ["Dat helpt", "Vertel meer"],
        suggestConflictCoach: false,
        source: "ai",
        // Algemene suggestie ("dit soort dingen check je normaal hier"), geen opgezochte bron voor dit antwoord.
        sources: suggestedSources().map((s) => ({ name: s.name, domain: s.domain })),
      });
    }

    const raw = await provider.complete({
      system: FREE_CHAT_SYSTEM_PROMPT,
      prompt: buildFreeChatPrompt({ message, age, memoryFacts, recentTurns }),
      maxTokens: 240,
      temperature: 0.75,
      tier: "strong",
    });
    const parsed = parseJson(raw);
    const body = enforceSafety(str(parsed.body, 400));
    if (!body.ok || !body.text) return NextResponse.json(fallback);
    return NextResponse.json({
      body: body.text,
      choices: strArray(parsed.choices, 4).map((c) => c.slice(0, 28)),
      suggestConflictCoach: Boolean(parsed.suggestConflictCoach),
      source: "ai",
    });
  } catch (error) {
    console.error("[FamilyFlow] free-chat faalde:", error);
    return NextResponse.json(fallback);
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });
  }

  switch (payload.task) {
    case "conflict-analysis":
      return handleConflictAnalysis(payload);
    case "roleplay-reply":
      return handleRoleplay(payload);
    case "free-chat":
      return handleFreeChat(payload);
    default:
      return NextResponse.json({ error: "Onbekende taak" }, { status: 400 });
  }
}
