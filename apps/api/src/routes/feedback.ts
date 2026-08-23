import { Router } from "express";
import { createFeedbackSchema } from "@upchaar/types";
import { getAuth, requireAuth } from "../middleware/auth.js";
import { getPendingFeedback, submitFeedback } from "../services/feedback.service.js";
import { created, ok } from "../utils/respond.js";
import { parseBody } from "../utils/validate.js";

export const feedbackRouter: Router = Router();

feedbackRouter.post("/", requireAuth("PATIENT"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(createFeedbackSchema, req);
  const feedback = await submitFeedback(auth.sub, input);
  created(res, "Feedback submitted successfully", feedback);
});

feedbackRouter.get("/pending", requireAuth("PATIENT"), async (req, res) => {
  const auth = getAuth(req);
  const pending = await getPendingFeedback(auth.sub);
  ok(res, "Pending feedback appointments", pending);
});
