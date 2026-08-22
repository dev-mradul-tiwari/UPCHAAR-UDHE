import { z } from "zod";
import { idSchema } from "@upchaar/types";

/**
 * Filter schemas for the two list endpoints whose query string is not part of
 * a named contract type. Composed from the primitives exported by
 * `@upchaar/types` — no contract schema is redeclared here.
 */
export const departmentListQuerySchema = z.object({
  hospitalId: idSchema.optional(),
});
export type DepartmentListQuery = z.infer<typeof departmentListQuerySchema>;

export const doctorListQuerySchema = z.object({
  hospitalId: idSchema.optional(),
  departmentId: idSchema.optional(),
});
export type DoctorListQuery = z.infer<typeof doctorListQuerySchema>;

export const bedListQuerySchema = z.object({
  hospitalId: idSchema.optional(),
});
export type BedListQuery = z.infer<typeof bedListQuerySchema>;
