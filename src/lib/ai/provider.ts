import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";

/**
 * Modelgewicht per taak (release 3 §36). Niet elke actie verdient het zwaarste
 * model: classificatie/intent draait op "fast", coaching/conflict op "strong",
 * researchsynthese op "research". Providers kiezen zelf het concrete model-id.
 */
export type ModelTier = "fast" | "strong" | "research";

export interface CompletionRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  tier?: ModelTier;
}

/**
 * Provider-agnostische AI-poort. De coachlogica kent alleen deze interface,
 * dus een extra provider toevoegen = een bestand toevoegen + registreren.
 */
export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  complete(request: CompletionRequest): Promise<string>;
}

class NullProvider implements AIProvider {
  readonly name = "none";
  isConfigured(): boolean {
    return false;
  }
  async complete(): Promise<string> {
    throw new Error("Geen AI-provider geconfigureerd");
  }
}

let cached: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (cached) return cached;
  const configured = (process.env.AI_PROVIDER ?? "none").toLowerCase();
  const providers: Record<string, () => AIProvider> = {
    claude: () => new ClaudeProvider(),
    anthropic: () => new ClaudeProvider(),
    openai: () => new OpenAIProvider(),
    gemini: () => new GeminiProvider(),
    google: () => new GeminiProvider(),
  };
  const factory = providers[configured];
  cached = factory ? factory() : new NullProvider();
  return cached;
}

export function providerStatus(): { provider: string; configured: boolean } {
  const provider = getProvider();
  return { provider: provider.name, configured: provider.isConfigured() };
}
