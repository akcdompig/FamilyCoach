import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";
import { SYSTEM_PROMPT, buildProfilePrompt } from "@/lib/ai/prompts";
import { enforceSafety } from "@/lib/ai/safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const strings = (value: unknown, max: number): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string").slice(0, max).map((v) => v.slice(0, 40))
    : [];

/** Stelt het coachprofiel samen na de intake. Valt terug op regels bij twijfel. */
export async function POST(request: Request) {
  let payload: { summary?: string; ages?: number[] };
  try {
    payload = (await request.json()) as { summary?: string; ages?: number[] };
  } catch {
    return NextResponse.json({ error: "Ongeldige body" }, { status: 400 });
  }

  const provider = getProvider();
  if (!provider.isConfigured()) return NextResponse.json({ ok: false });

  try {
    const raw = await provider.complete({
      system: SYSTEM_PROMPT,
      prompt: buildProfilePrompt(String(payload.summary ?? "").slice(0, 1200), payload.ages ?? []),
      maxTokens: 400,
      temperature: 0.5,
    });
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const summary = enforceSafety(String(parsed.summary ?? ""));
    if (!summary.ok) return NextResponse.json({ ok: false });

    return NextResponse.json({
      ok: true,
      focusAreas: strings(parsed.focusAreas, 6),
      motivation: strings(parsed.motivation, 5),
      tone: strings(parsed.tone, 5),
      summary: summary.text,
    });
  } catch (error) {
    console.error("[FamilyFlow] Profielgeneratie faalde:", error);
    return NextResponse.json({ ok: false });
  }
}
