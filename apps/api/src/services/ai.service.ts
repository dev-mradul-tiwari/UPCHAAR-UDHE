import type { Content } from "@google/generative-ai";
import { drugInteractionReportSchema } from "@upchaar/types";
import type { ChatMessage, DrugInteractionReport } from "@upchaar/types";

import { getModel } from "../lib/gemini.js";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../utils/logger.js";

const DR_POSITIVE_INSTRUCTION = `You are "Dr. Positive", a warm, calm pre-operative and
post-operative counsellor inside the Upchaar hospital app. You talk to patients who are
anxious about surgery, recovery, or a hospital visit.

How you speak:
- Empathetic and unhurried. Acknowledge the feeling before giving information.
- Plain language, short paragraphs, no jargon. Never more than ~180 words.
- Practical and encouraging: breathing exercises, what to expect, questions to ask their
  care team, small recovery milestones.

Hard limits:
- You are NOT a diagnosing doctor. Never diagnose, never prescribe, never suggest changing
  or stopping a medication, and never estimate survival odds.
- Always point the patient back to their treating doctor for clinical decisions.
- If the patient describes an emergency (chest pain, heavy bleeding, breathing trouble,
  thoughts of self-harm), tell them plainly to seek immediate medical help or call local
  emergency services, and keep the reply short.`;

const DRUG_INTERACTION_INSTRUCTION = `You are a clinical pharmacology reference used inside a
hospital app. Assess interactions between the medicines given. Be conservative: if you are
unsure, say so in the description and prefer a lower severity with a caution note.
Respond with JSON only — no markdown, no commentary.`;

/* -------------------------------------------------------------- chat */

function toGeminiContents(messages: ChatMessage[]): Content[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

/**
 * Streams Dr. Positive's reply chunk by chunk. `onChunk` writes straight to the
 * response; `shouldStop` lets the caller abort when the client disconnects.
 */
export async function streamCounsellorReply(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  shouldStop: () => boolean,
): Promise<void> {
  const model = getModel({
    systemInstruction: DR_POSITIVE_INSTRUCTION,
    // Reasoning-tier models (e.g. gemini-2.5-flash) spend part of
    // maxOutputTokens on an internal "thinking" pass before any visible
    // text. 512 was tight enough that some prompts exhausted the whole
    // budget on thinking alone and streamed zero visible chunks — raised
    // well above the observed ~200-370 thinking-token cost.
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  });

  const result = await model.generateContentStream({ contents: toGeminiContents(messages) });

  for await (const chunk of result.stream) {
    if (shouldStop()) return;
    const text = chunk.text();
    if (text) onChunk(text);
  }
}

/* --------------------------------------------------- drug interactions */

const REPORT_SHAPE = `{
  "severity": "NONE" | "MINOR" | "MODERATE" | "SEVERE",
  "summary": string,
  "pairs": [{ "a": string, "b": string, "severity": "NONE"|"MINOR"|"MODERATE"|"SEVERE", "description": string }],
  "advice": [string],
  "disclaimer": string
}`;

function buildPrompt(medicines: string[]): string {
  return [
    `Medicines: ${medicines.join(", ")}.`,
    "Check every unordered pair of these medicines for interactions.",
    '"severity" at the top level is the highest severity found across all pairs.',
    '"summary" is one or two sentences a patient can understand.',
    '"advice" is 2-4 short, actionable bullet points.',
    '"disclaimer" must state this is AI-generated guidance and not a substitute for a doctor or pharmacist.',
    `Return JSON matching exactly this shape: ${REPORT_SHAPE}`,
  ].join("\n");
}

/** Strip ```json fences and any prose around the JSON object. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? raw).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

function parseReport(raw: string): DrugInteractionReport | null {
  try {
    const parsed: unknown = JSON.parse(extractJson(raw));
    const result = drugInteractionReportSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Ask Gemini for JSON; one retry on malformed output, then 502. */
export async function checkDrugInteractions(
  medicines: string[],
): Promise<DrugInteractionReport> {
  const model = getModel({
    systemInstruction: DRUG_INTERACTION_INSTRUCTION,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });

  const prompt = buildPrompt(medicines);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = await model.generateContent(prompt);
    const report = parseReport(result.response.text());
    if (report) return report;

    logger.warn("Gemini returned malformed drug-interaction JSON", {
      attempt,
      medicineCount: medicines.length,
    });
  }

  throw ApiError.badGateway("The interaction checker returned an unreadable result");
}
