import { z } from "zod";
export declare const chatMessageSchema: z.ZodObject<{
    role: z.ZodEnum<["user", "assistant"]>;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: "user" | "assistant";
    content: string;
}, {
    role: "user" | "assistant";
    content: string;
}>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export declare const chatRequestSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    messages: {
        role: "user" | "assistant";
        content: string;
    }[];
}, {
    messages: {
        role: "user" | "assistant";
        content: string;
    }[];
}>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export declare const drugInteractionRequestSchema: z.ZodObject<{
    medicines: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    medicines: string[];
}, {
    medicines: string[];
}>;
export type DrugInteractionRequest = z.infer<typeof drugInteractionRequestSchema>;
export declare const InteractionSeveritySchema: z.ZodEnum<["NONE", "MINOR", "MODERATE", "SEVERE"]>;
export type InteractionSeverity = z.infer<typeof InteractionSeveritySchema>;
export declare const drugInteractionReportSchema: z.ZodObject<{
    severity: z.ZodEnum<["NONE", "MINOR", "MODERATE", "SEVERE"]>;
    summary: z.ZodString;
    pairs: z.ZodArray<z.ZodObject<{
        a: z.ZodString;
        b: z.ZodString;
        severity: z.ZodEnum<["NONE", "MINOR", "MODERATE", "SEVERE"]>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        severity: "NONE" | "MINOR" | "MODERATE" | "SEVERE";
        a: string;
        b: string;
        description: string;
    }, {
        severity: "NONE" | "MINOR" | "MODERATE" | "SEVERE";
        a: string;
        b: string;
        description: string;
    }>, "many">;
    advice: z.ZodArray<z.ZodString, "many">;
    disclaimer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    severity: "NONE" | "MINOR" | "MODERATE" | "SEVERE";
    summary: string;
    pairs: {
        severity: "NONE" | "MINOR" | "MODERATE" | "SEVERE";
        a: string;
        b: string;
        description: string;
    }[];
    advice: string[];
    disclaimer: string;
}, {
    severity: "NONE" | "MINOR" | "MODERATE" | "SEVERE";
    summary: string;
    pairs: {
        severity: "NONE" | "MINOR" | "MODERATE" | "SEVERE";
        a: string;
        b: string;
        description: string;
    }[];
    advice: string[];
    disclaimer: string;
}>;
export type DrugInteractionReport = z.infer<typeof drugInteractionReportSchema>;
//# sourceMappingURL=ai.d.ts.map