import { Router } from "express";
import { bedInputSchema } from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import { listBeds, upsertBeds } from "../services/inventory.service.js";
import { ApiError } from "../utils/api-error.js";
import { bedListQuerySchema } from "../utils/query.js";
import { ok } from "../utils/respond.js";
import { parseBody, parseQuery } from "../utils/validate.js";

export const bedsRouter: Router = Router();

bedsRouter.get("/", async (req, res) => {
  const query = parseQuery(bedListQuerySchema, req);
  if (!query.hospitalId) throw ApiError.badRequest("hospitalId is required");
  ok(res, "Beds", await listBeds(query.hospitalId));
});

bedsRouter.put("/", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(bedInputSchema, req);
  ok(res, "Beds updated", await upsertBeds(auth.sub, input));
});
