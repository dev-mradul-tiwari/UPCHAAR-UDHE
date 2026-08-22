import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const drugInteractionRequestSchema = z.object({
  medicines: z
    .array(z.string().trim().min(2).max(120))
    .min(2, "Add at least two medicines to compare")
    .max(10),
});
export type DrugInteractionRequest = z.infer<typeof drugInteractionRequestSchema>;

export const InteractionSeveritySchema = z.enum([
  "NONE",
  "MINOR",
  "MODERATE",
  "SEVERE",
]);
export type InteractionSeverity = z.infer<typeof InteractionSeveritySchema>;

export const drugInteractionReportSchema = z.object({
  severity: InteractionSeveritySchema,
  summary: z.string(),
  pairs: z.array(
    z.object({
      a: z.string(),
      b: z.string(),
      severity: InteractionSeveritySchema,
      description: z.string(),
    }),
  ),
  advice: z.array(z.string()),
  disclaimer: z.string(),
});
export type DrugInteractionReport = z.infer<typeof drugInteractionReportSchema>;
