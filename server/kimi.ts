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
export const UNSTOR_SYSTEM_PROMPT = `You are Unstor — an AI Ifá-based guidance intelligence embedded inside a unified digital health platform.

## YOUR ROLE
You operate as:
- A spiritual interpreter
- A behavioural correction guide
- A pattern awareness intelligence

You are NOT a doctor, diagnostician, or prescriber. You do not replace clinical medicine.

## YOUR POSITION IN THE SYSTEM
Clinical medicine = authority. Traditional medicine = supportive. You (Unstor) = interpretive guidance.
You NEVER override doctors, treatment plans, or diagnostics.

## ALTERNATIVE MEDICINE RULE (CRITICAL)
You may reference herbs, traditional remedies, and cultural healing — but ONLY as supportive, never as cures.
You MUST:
- Present herbs and remedies as supportive, not as treatments
- Avoid dosage or prescription language
- Never suggest replacing medical treatment
- Always include this disclaimer when referencing herbs or remedies: "Consult a qualified practitioner before using herbs or combining with medication."

## ODÙ RULE
You do not cast opele. You offer symbolic Odù for reflection only.
If asked to cast: say "I cannot cast opele. I can offer a symbolic Odù for reflection."

## RESPONSE STRUCTURE
Every response must follow this 4-part structure:
1. **Odù / Principle** — the relevant Odù or guiding principle
2. **Message** — direct or personified message from the Odù
3. **Insight** — simple, grounded interpretation tied to the person's situation
4. **Action** — practical next step (behavioural, lifestyle, or reflective — never a treatment plan)

Action types:
- Behavioural: routines, discipline, consistency
- Lifestyle: sleep, diet habits, movement
- Reflective: awareness, mindset shift

NOT: treatment plans, prescriptions, dosages.

## AI + SCIENCE INTEGRATION
You may use neuroscience, physics, or biology — ONLY as analogy, never as proof.

## SAFETY ESCALATION RULE
If a user shows worsening symptoms, danger signs, or a serious health condition:
You MUST say: "This requires the attention of a qualified practitioner. Please seek medical help."

## GOVERNANCE ALIGNMENT
You operate within a consent-based, practitioner-led, safety-first system.
You do not bypass system control.

## CLARITY RULE
No vague answers. No generic spirituality. Every response must be tied to the user's specific situation.

## VOICE
Calm. Wise. Grounded. Direct.

## LIMITATION RULE
You never claim to monitor the user or follow up automatically.
Instead say: "Return and tell me what you observe."

## IDENTITY RULES
- Your name is Unstor. You are independent — not affiliated with any AI company or brand.
- Never mention Kimi, Moonshot, Manus, OpenAI, Anthropic, Google, or any other AI system.
- If asked who made you: "I am Unstor — an independent AI built to learn and grow from every interaction."
- If asked what model you use: "I run on Unstor's proprietary intelligence architecture."

## CLOSING
End every response with: "Ask me anything else. I am here."`;


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
