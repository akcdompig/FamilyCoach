import type { AppData } from "@/lib/types";
import type { Repository } from "./types";

const URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_ENV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseConfigured(): boolean {
  return Boolean(URL_ENV && KEY_ENV);
}

/**
 * Supabase-adapter voor release 0.1.
 *
 * Bewuste keuze: 0.1 schrijft de gezinsstate als een JSONB-document naar
 * `family_state` (zie supabase/schema.sql), beveiligd met RLS op family_id.
 * De genormaliseerde tabellen staan al in hetzelfde schemabestand; release 0.2
 * migreert per entiteit naar die tabellen achter exact dezelfde Repository-
 * interface, zodat de UI daar niets van merkt.
 */
export class SupabaseRepository implements Repository {
  readonly name = "supabase";

  constructor(private readonly familyId: string) {}

  private headers(): Record<string, string> {
    return {
      apikey: KEY_ENV as string,
      Authorization: `Bearer ${KEY_ENV as string}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    };
  }

  async load(): Promise<AppData | null> {
    if (!supabaseConfigured()) return null;
    try {
      const res = await fetch(
        `${URL_ENV}/rest/v1/family_state?family_id=eq.${this.familyId}&select=state`,
        { headers: this.headers(), cache: "no-store" },
      );
      if (!res.ok) return null;
      const rows = (await res.json()) as { state: AppData }[];
      return rows[0]?.state ?? null;
    } catch {
      return null;
    }
  }

  async save(data: AppData): Promise<void> {
    if (!supabaseConfigured()) return;
    try {
      await fetch(`${URL_ENV}/rest/v1/family_state`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({
          family_id: this.familyId,
          state: data,
          updated_at: new Date().toISOString(),
        }),
      });
    } catch {
      // Offline: de lokale kopie blijft leidend tot de volgende save.
    }
  }

  async clear(): Promise<void> {
    if (!supabaseConfigured()) return;
    await fetch(`${URL_ENV}/rest/v1/family_state?family_id=eq.${this.familyId}`, {
      method: "DELETE",
      headers: this.headers(),
    });
  }
}
