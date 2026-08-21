import type { AIProvider, CompletionRequest, ModelTier } from "./provider";

const API_URL = "https://api.anthropic.com/v1/messages";

const MODEL_BY_TIER: Record<ModelTier, string> = {
  fast: process.env.ANTHROPIC_MODEL_FAST ?? process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
  strong: process.env.ANTHROPIC_MODEL_STRONG ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
  research: process.env.ANTHROPIC_MODEL_RESEARCH ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
};

export class ClaudeProvider implements AIProvider {
  readonly name = "claude";

  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async complete({ system, prompt, maxTokens = 400, temperature = 0.7, tier = "strong" }: CompletionRequest): Promise<string> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY ontbreekt");

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL_BY_TIER[tier],
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return (data.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("\n")
      .trim();
  }
}
