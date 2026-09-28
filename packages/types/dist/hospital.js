import { z } from "zod";
import { emailSchema, phoneSchema } from "./common.js";
export const hospitalSearchQuerySchema = z.object({
    q: z.string().trim().max(120).optional(),
    city: z.string().trim().max(80).optional(),
    departmentId: z.string().optional(),
    hasBeds: z
        .union([z.boolean(), z.enum(["true", "false"])])
        .transform((v) => v === true || v === "true")
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const hospitalUpdateSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    type: z.string().trim().min(2).max(60).optional(),
    addressLine: z.string().trim().min(3).max(200).optional(),
    city: z.string().trim().min(2).max(80).optional(),
    state: z.string().trim().min(2).max(80).optional(),
    zipcode: z.string().trim().min(4).max(12).optional(),
});
//# sourceMappingURL=hospital.js.map