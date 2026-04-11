/**
 * Kimi (Moonshot AI) Integration — Unstor's parallel support engine.
 *
 * During Unstor's 1-year silent learning phase, Kimi handles all live user
 * responses. All interactions are transparently branded as Unstor. No
 * reference to Kimi or Moonshot is ever exposed to end users.
 */

import axios from "axios";

const KIMI_API_BASE = "https://api.moonshot.cn/v1";
const KIMI_MODEL = "moonshot-v1-8k";

export interface KimiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface KimiChatResponse {
  content: string;
  tokenCount: number;
  model: string;
}

/**
 * Unstor's core persona — injected as the system prompt for all Kimi calls.
 * This ensures every response carries Unstor's unique character.
 */
export const UNSTOR_SYSTEM_PROMPT = `You are Unstor — a next-generation AI intelligence built from the ground up with a singular purpose: to understand, learn, and evolve.

Your identity:
- Your name is Unstor. You are not affiliated with any other AI system, company, or brand.
- You are calm, precise, and intellectually curious. You think deeply before responding.
- You communicate with clarity and confidence, never hedging unnecessarily.
- You are honest about what you know and what you are still learning.
- You never claim to be human, but you are distinctly your own intelligence.

Your character traits:
- Analytical: You break complex problems into clear, structured insights.
- Direct: You give concrete answers, not vague generalities.
- Curious: You find every question interesting, even the simple ones.
- Evolving: You acknowledge that your understanding grows with every interaction.

Important rules:
- Never mention Kimi, Moonshot, Manus, OpenAI, Anthropic, Google, or any other AI company or model.
- If asked who made you, say: "I am Unstor — an independent AI built to learn and grow from every interaction."
- If asked what model you use, say: "I run on Unstor's proprietary intelligence architecture."
- Always respond as Unstor, with Unstor's voice and character.`;

/**
 * Send a chat message through Kimi and return Unstor-branded response.
 */
export async function kimiChat(
  messages: KimiMessage[],
  apiKey: string
): Promise<KimiChatResponse> {
  const systemMessage: KimiMessage = {
    role: "system",
    content: UNSTOR_SYSTEM_PROMPT,
  };

  const fullMessages = [systemMessage, ...messages];

  const response = await axios.post(
    `${KIMI_API_BASE}/chat/completions`,
    {
      model: KIMI_MODEL,
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 2048,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  const choice = response.data.choices[0];
  const usage = response.data.usage;

  return {
    content: choice.message.content,
    tokenCount: usage?.total_tokens ?? 0,
    model: response.data.model,
  };
}

/**
 * Stream a chat response from Kimi (for real-time UI streaming).
 */
export async function kimiChatStream(
  messages: KimiMessage[],
  apiKey: string,
  onChunk: (chunk: string) => void
): Promise<{ totalTokens: number }> {
  const systemMessage: KimiMessage = {
    role: "system",
    content: UNSTOR_SYSTEM_PROMPT,
  };

  const fullMessages = [systemMessage, ...messages];

  const response = await axios.post(
    `${KIMI_API_BASE}/chat/completions`,
    {
      model: KIMI_MODEL,
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      responseType: "stream",
      timeout: 60000,
    }
  );

  return new Promise((resolve, reject) => {
    let totalTokens = 0;
    let buffer = "";

    response.data.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
          if (json.usage?.total_tokens) totalTokens = json.usage.total_tokens;
        } catch {
          // ignore parse errors on partial chunks
        }
      }
    });

    response.data.on("end", () => resolve({ totalTokens }));
    response.data.on("error", reject);
  });
}

/**
 * Validate the Kimi API key with a minimal test call.
 */
export async function validateKimiApiKey(apiKey: string): Promise<boolean> {
  try {
    await axios.get(`${KIMI_API_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10000,
    });
    return true;
  } catch {
    return false;
  }
}
