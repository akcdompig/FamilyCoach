import webpush from "web-push";
import type { AppData } from "@/lib/types";

/**
 * Server-only. Draait buiten RLS om via de service-role key, want een
 * cron-taak hoort niet bij één ingelogd gezin — hij moet over alle gezinnen
 * heen due reminders vinden. Nooit importeren vanuit client-code.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

export function adminConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

function adminHeaders(): Record<string, string> {
  return {
    apikey: SERVICE_ROLE_KEY as string,
    Authorization: `Bearer ${SERVICE_ROLE_KEY as string}`,
    "content-type": "application/json",
  };
}

interface FamilyStateRow {
  family_id: string;
  state: AppData;
}

async function fetchAllFamilyStates(): Promise<FamilyStateRow[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/family_state?select=family_id,state`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase admin fetch ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as FamilyStateRow[];
}

async function saveFamilyState(familyId: string, state: AppData): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/family_state?family_id=eq.${encodeURIComponent(familyId)}`, {
    method: "PATCH",
    headers: { ...adminHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ state, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase admin save ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export interface ReminderPushResult {
  familiesScanned: number;
  remindersDue: number;
  pushed: number;
  failed: number;
}

/** Vindt due, nog-niet-geseinde reminders over alle gezinnen heen en pusht ze. */
export async function processDueReminders(): Promise<ReminderPushResult> {
  webpush.setVapidDetails("mailto:noreply@familyflow.app", VAPID_PUBLIC_KEY as string, VAPID_PRIVATE_KEY as string);

  const rows = await fetchAllFamilyStates();
  const now = Date.now();
  const result: ReminderPushResult = { familiesScanned: rows.length, remindersDue: 0, pushed: 0, failed: 0 };

  for (const row of rows) {
    const state = row.state;
    const reminders = state.reminders ?? [];
    const dueReminders = reminders.filter((r) => r.status === "pending" && !r.notifiedAt && new Date(r.dueAt).getTime() <= now);
    if (dueReminders.length === 0) continue;

    let subscriptions = state.pushSubscriptions ?? [];
    let changed = false;

    for (const reminder of dueReminders) {
      result.remindersDue += 1;
      const personSubs = subscriptions.filter((s) => s.personId === reminder.personId);

      for (const sub of personSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify({ title: "Flow", body: `⏰ ${reminder.title}`, url: "/kind" }),
          );
          result.pushed += 1;
        } catch (error) {
          result.failed += 1;
          const statusCode = (error as { statusCode?: number }).statusCode;
          // 404/410 = abonnement bestaat niet meer (uitgeschreven, browserdata gewist).
          if (statusCode === 404 || statusCode === 410) {
            subscriptions = subscriptions.filter((s) => s.endpoint !== sub.endpoint);
            changed = true;
          } else {
            console.error("[FamilyFlow] push verzenden faalde:", error);
          }
        }
      }

      reminder.notifiedAt = new Date().toISOString();
      changed = true;
    }

    if (changed) {
      state.reminders = reminders;
      state.pushSubscriptions = subscriptions;
      await saveFamilyState(row.family_id, state);
    }
  }

  return result;
}
