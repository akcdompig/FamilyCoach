import { NextResponse } from "next/server";
import { adminConfigured, processDueReminders } from "@/lib/push/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Aangeroepen door een externe scheduler (GitHub Actions, zie
 * .github/workflows/reminder-push.yml) — niet door Vercel Cron: Vercel's
 * gratis Hobby-plan staat maar 1x per dag cron toe, te grof voor tijdige
 * herinneringen. Beveiligd met een gedeeld geheim, niet met gebruikers-auth,
 * want er belt hier geen ingelogde gebruiker maar een geautomatiseerde taak.
 */
async function handle(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!adminConfigured()) {
    return NextResponse.json({ error: "push notifications zijn niet geconfigureerd" }, { status: 501 });
  }

  try {
    const result = await processDueReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[FamilyFlow] cron/reminders faalde:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
