import type { AppData } from "@/lib/types";
import type { Repository } from "./types";

const KEY = "familyflow.v2";

/** Development fallback: alles blijft op het apparaat van de gebruiker. */
export class LocalRepository implements Repository {
  readonly name = "localStorage";

  async load(): Promise<AppData | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AppData;
      if (!parsed || parsed.version !== 1) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  async save(data: AppData): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Quota vol of privemodus: de sessie werkt door, alleen niet bewaard.
    }
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY);
  }
}
