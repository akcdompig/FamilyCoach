import type { AIProvider, CompletionRequest, ModelTier } from "./provider";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const MODEL_BY_TIER: Record<ModelTier, string> = {
  fast: process.env.GEMINI_MODEL_FAST ?? process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
  strong: process.env.GEMINI_MODEL_STRONG ?? process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
  research: process.env.GEMINI_MODEL_RESEARCH ?? process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
};

/** Gratis te gebruiken via een API key uit Google AI Studio (aistudio.google.com/apikey). */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async complete({ system, prompt, maxTokens = 400, temperature = 0.7, tier = "strong" }: CompletionRequest): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY ontbreekt");

    const res = await fetch(`${API_BASE}/${MODEL_BY_TIER[tier]}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: system }] },
        // Elke systeemprompt in deze app eist geldige JSON terug (zie lib/ai/prompts.ts).
        // Gemini volgt dat niet altijd betrouwbaar via instructie alleen (kwam terug als
        // markdown-opsomming) — responseMimeType dwingt het native af.
        generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return (data.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("\n")
      .trim();
  }
}
