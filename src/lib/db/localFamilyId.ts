const KEY = "familyflow.local_family_id";

/**
 * Stabiele, per-browser identiteit — bewust NIET hetzelfde als AppData.family.id
 * (dat zit in de opgeslagen blob en is puur inhoud). Dit is de sleutel die
 * bepaalt WELKE rij in Supabase dit apparaat leest/schrijft.
 *
 * Zonder dit deelden alle bezoekers dezelfde hardcoded "fam_demo"-rij zodra
 * Supabase actief was — iedereen zag en overschreef letterlijk elkaars data.
 * Er is nog geen echt auth-systeem (zie supabase/schema.sql), dus dit is de
 * pragmatische isolatie voor nu: nieuw apparaat = nieuwe, lege rij.
 */
export function getOrCreateLocalFamilyId(): string {
  if (typeof window === "undefined") return "fam_local";
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    const generated = `fam_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(KEY, generated);
    return generated;
  } catch {
    return "fam_local";
  }
}
