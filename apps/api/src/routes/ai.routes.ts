import { Router } from "express";
import { chatRequestSchema, drugInteractionRequestSchema } from "@upchaar/types";

import { assertAiEnabled } from "../lib/gemini.js";
import { requireAuth } from "../middleware/auth.js";
import { checkDrugInteractions, streamCounsellorReply } from "../services/ai.service.js";
import { logger } from "../utils/logger.js";
import { ok } from "../utils/respond.js";
import { parseBody } from "../utils/validate.js";

export const aiRouter: Router = Router();

/**
 * Dr. Positive — streamed as plain text so the client can render it as it
 * arrives. Failures *before* the first byte still use the standard envelope.
 */
aiRouter.post("/chat", requireAuth("PATIENT"), async (req, res) => {
  assertAiEnabled();
  const input = parseBody(chatRequestSchema, req);

  // `req.on("close")` is unreliable here: once Express has fully read the
  // (tiny, already-buffered) JSON body, Node can fire "close" on the request
  // stream as part of normal processing — well before the response is done —
  // which silently marked every request as disconnected before a single
  // chunk arrived. `res.on("close")` combined with `writableEnded` only
  // trips on a genuine client abort.
  let disconnected = false;
  res.on("close", () => {
    if (!res.writableEnded) disconnected = true;
  });

  res.status(200);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    await streamCounsellorReply(
      input.messages,
      (chunk) => {
        if (!disconnected) res.write(chunk);
      },
      () => disconnected,
    );
    res.end();
  } catch (error) {
    logger.error("Dr. Positive stream failed", { error });
    if (res.headersSent) {
      res.write("\n\nSorry — I lost my train of thought. Please try again.");
      res.end();
      return;
    }
    throw error;
  }
});

aiRouter.post("/drug-interaction", requireAuth("PATIENT", "DOCTOR"), async (req, res) => {
  assertAiEnabled();
  const input = parseBody(drugInteractionRequestSchema, req);
  const report = await checkDrugInteractions(input.medicines);
  ok(res, "Interaction report", report);
});
