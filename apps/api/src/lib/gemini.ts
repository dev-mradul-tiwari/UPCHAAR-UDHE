import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerationConfig, GenerativeModel } from "@google/generative-ai";

import { env } from "../env.js";
import { ApiError } from "../utils/api-error.js";

let client: GoogleGenerativeAI | null = null;

/** The server boots without a key; only the two AI routes care. */
export function isAiEnabled(): boolean {
  return env.aiEnabled;
}

export function assertAiEnabled(): void {
  if (!isAiEnabled()) {
    throw ApiError.serviceUnavailable(
      "AI features are unavailable — GEMINI_API_KEY is not configured",
    );
  }
}

export function getModel(options: {
  systemInstruction?: string;
  generationConfig?: GenerationConfig;
}): GenerativeModel {
  assertAiEnabled();
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw ApiError.serviceUnavailable("AI features are unavailable");

  client ??= new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
    ...(options.generationConfig ? { generationConfig: options.generationConfig } : {}),
  });
}
