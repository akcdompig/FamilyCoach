import { NextResponse } from "next/server";
import { fallbackCoachMessage } from "@/lib/ai/fallback";
import { getProvider, providerStatus } from "@/lib/ai/provider";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompts";
import { enforceSafety, safeKind, sanitizeContext } from "@/lib/ai/safety";
import type { MessageKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Statuscheck voor de instellingenpagina. Verklapt nooit de key zelf. */
export async function GET() {
  return NextResponse.json(providerStatus());
}

function parseReply(raw: string): { body?: string; kind?: unknown; suggestions?: unknown } | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return { body: cleaned };
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return { body: cleaned };
    }
  }
}

export async function POST(request: Request) {
  let payload: { kind?: string; context?: unknown };
  try {
    payload = (await request.json()) as { kind?: string; context?: unknown };
  } catch {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });
  }

  const kind = safeKind(payload.kind, "nudge") as MessageKind;
  const context = sanitizeContext(payload.context);
  const fallback = fallbackCoachMessage(kind, context);

  const provider = getProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json(fallback);
  }

  try {
    const raw = await provider.complete({
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(kind, context),
      maxTokens: 300,
      temperature: 0.8,
    });
    const parsed = parseReply(raw);
    const checked = enforceSafety(String(parsed?.body ?? ""));
    if (!checked.ok) {
      // Geblokkeerd door de safety-laag: stilletjes terugvallen op de regelcoach.
      console.warn(`[FamilyFlow] AI-bericht geblokkeerd (${checked.reason})`);
      return NextResponse.json(fallback);
    }
    const suggestions = Array.isArray(parsed?.suggestions)
      ? (parsed?.suggestions as unknown[])
          .filter((s): s is string => typeof s === "string")
          .slice(0, 3)
          .map((s) => s.slice(0, 24))
      : [];

    return NextResponse.json({
      body: checked.text,
      kind: safeKind(parsed?.kind, kind),
      suggestions,
      source: "ai",
    });
  } catch (error) {
    console.error("[FamilyFlow] AI-provider faalde:", error);
    return NextResponse.json(fallback);
  }
}
