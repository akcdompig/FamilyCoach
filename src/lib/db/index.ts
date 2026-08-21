import { getOrCreateLocalFamilyId } from "./localFamilyId";
import { LocalRepository } from "./local";
import { SupabaseRepository, supabaseConfigured } from "./supabase";
import type { Repository } from "./types";

export type { Repository } from "./types";
export { supabaseConfigured } from "./supabase";

let cached: Repository | null = null;

export function getRepository(): Repository {
  if (cached) return cached;
  // Elk apparaat krijgt zijn eigen rij (zie localFamilyId.ts) — nooit meer
  // een gedeelde "fam_demo" waar alle bezoekers dezelfde data zien/overschrijven.
  cached = supabaseConfigured() ? new SupabaseRepository(getOrCreateLocalFamilyId()) : new LocalRepository();
  return cached;
}
