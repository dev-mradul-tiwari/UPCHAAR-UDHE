import { z } from "zod";
export const chatMessageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(4000),
});
export const chatRequestSchema = z.object({
    messages: z.array(chatMessageSchema).min(1).max(50),
});
export const drugInteractionRequestSchema = z.object({
    medicines: z
        .array(z.string().trim().min(2).max(120))
        .min(2, "Add at least two medicines to compare")
        .max(10),
});
export const InteractionSeveritySchema = z.enum([
    "NONE",
    "MINOR",
    "MODERATE",
    "SEVERE",
]);
export const drugInteractionReportSchema = z.object({
    severity: InteractionSeveritySchema,
    summary: z.string(),
    pairs: z.array(z.object({
        a: z.string(),
        b: z.string(),
        severity: InteractionSeveritySchema,
        description: z.string(),
    })),
    advice: z.array(z.string()),
    disclaimer: z.string(),
});
//# sourceMappingURL=ai.js.map