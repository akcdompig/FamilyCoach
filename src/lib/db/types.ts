import type { AppData } from "@/lib/types";

/**
 * Persistence-poort. De app praat nooit rechtstreeks met localStorage of
 * Supabase, alleen met deze interface. Daardoor is de opslaglaag vervangbaar
 * zonder dat er UI-code verandert.
 */
export interface Repository {
  readonly name: string;
  load(): Promise<AppData | null>;
  save(data: AppData): Promise<void>;
  clear(): Promise<void>;
}
