import { createReferralSchema } from "@upchaar/types";
import { Router } from "express";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  connectWithReferral,
  createReferral,
  getPatientReferrals,
  listReferrals,
} from "../services/referral.service.js";
import { ApiError } from "../utils/api-error.js";

export const referralRouter: Router = Router();

referralRouter.use(requireAuth());

/**
 * GET /api/referrals
 * List referrals for hospital/doctor dashboard
 */
referralRouter.get("/", async (_req, res, next) => {
  try {
    const referrals = await listReferrals();
    res.json({ success: true, data: referrals });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/referrals/my
 * Get referrals for the logged-in patient
 */
referralRouter.get("/my", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (auth.role !== "PATIENT") {
      throw ApiError.forbidden("Only patients can view their referrals");
    }
    const referrals = await getPatientReferrals(auth.sub);
    res.json({ success: true, data: referrals });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/referrals
 * Create a new patient referral (doctor only)
 */
referralRouter.post("/", requireAuth("DOCTOR"), async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const parsed = createReferralSchema.parse(req.body);
    const referral = await createReferral(auth.sub, parsed);
    res.status(201).json({ success: true, data: referral });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/referrals/:id/connect
 * Connect with a referred patient (hospital or doctor)
 */
referralRouter.post("/:id/connect", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (auth.role !== "DOCTOR" && auth.role !== "HOSPITAL") {
      throw ApiError.forbidden("Only doctors or hospitals can connect with referrals");
    }

    const hospitalId = auth.role === "HOSPITAL" ? auth.sub : auth.hospitalId!;
    const doctorId =
      auth.role === "DOCTOR"
        ? auth.sub
        : typeof req.body.doctorId === "string" && req.body.doctorId.length > 0
          ? req.body.doctorId
          : undefined;

    const referral = await connectWithReferral(req.params.id, { hospitalId, doctorId });
    res.json({ success: true, data: referral });
  } catch (error) {
    next(error);
  }
});
