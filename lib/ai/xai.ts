/**
 * lib/ai/xai.ts
 * ---------------------------------------------------------------------------
 * Minimal typed wrapper around the xAI Chat Completions API.
 * Mirrors the OpenAI-compatible endpoint xAI exposes at api.x.ai/v1.
 * ---------------------------------------------------------------------------
 */

import { XAI_API_BASE, XAI_MODELS } from "@/lib/constants";

export interface XAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface XAIChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface XAIChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Send a chat completion request to the xAI API.
 * Throws on non-2xx responses so callers can handle errors cleanly.
 */
export async function xaiChat(
  messages: XAIMessage[],
  opts: XAIChatOptions = {}
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured in environment variables.");
  }

  const res = await fetch(`${XAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model ?? XAI_MODELS.text,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 1024,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`xAI API error ${res.status}: ${body}`);
  }

  const data: XAIChatResponse = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return content.trim();
}
