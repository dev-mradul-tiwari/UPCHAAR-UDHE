import { Router } from "express";

import { aiRouter } from "./ai.routes.js";
import { appointmentsRouter } from "./appointments.routes.js";
import { authRouter } from "./auth.routes.js";
import { bedsRouter } from "./beds.routes.js";
import { departmentsRouter } from "./departments.routes.js";
import { doctorsRouter } from "./doctors.routes.js";
import { hospitalsRouter } from "./hospitals.routes.js";
import { inventoryRouter } from "./inventory.routes.js";
import { queueRouter } from "./queue.routes.js";
import { recordsRouter } from "./records.routes.js";
import { feedbackRouter } from "./feedback.js";
import { referralRouter } from "./referrals.js";
import { streamRouter } from "./stream.routes.js";

/** Everything under `/api/v1` — see docs/API_CONTRACT.md. */
export const apiRouter: Router = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/hospitals", hospitalsRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/doctors", doctorsRouter);
apiRouter.use("/appointments", appointmentsRouter);
apiRouter.use("/queue", queueRouter);
apiRouter.use("/stream", streamRouter);
apiRouter.use("/beds", bedsRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/records", recordsRouter);
apiRouter.use("/referrals", referralRouter);
apiRouter.use("/feedback", feedbackRouter);
apiRouter.use("/ai", aiRouter);
