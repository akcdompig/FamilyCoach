import type { AIProvider, CompletionRequest, ModelTier } from "./provider";

const API_URL = "https://api.openai.com/v1/chat/completions";

const MODEL_BY_TIER: Record<ModelTier, string> = {
  fast: process.env.OPENAI_MODEL_FAST ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  strong: process.env.OPENAI_MODEL_STRONG ?? process.env.OPENAI_MODEL ?? "gpt-4o",
  research: process.env.OPENAI_MODEL_RESEARCH ?? process.env.OPENAI_MODEL ?? "gpt-4o",
};

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async complete({ system, prompt, maxTokens = 400, temperature = 0.7, tier = "strong" }: CompletionRequest): Promise<string> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY ontbreekt");

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL_BY_TIER[tier],
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return (data.choices?.[0]?.message?.content ?? "").trim();
  }
}
