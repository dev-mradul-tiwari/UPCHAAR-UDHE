import { Router } from "express";
import { inventoryQuerySchema, medicineInputSchema, medicineUpdateSchema } from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  createMedicine,
  deleteMedicine,
  listMedicines,
  updateMedicine,
} from "../services/inventory.service.js";
import { created, ok } from "../utils/respond.js";
import { parseBody, parseQuery, requiredParam } from "../utils/validate.js";

export const inventoryRouter: Router = Router();

inventoryRouter.use(requireAuth("HOSPITAL"));

inventoryRouter.get("/", async (req, res) => {
  const auth = getAuth(req);
  const query = parseQuery(inventoryQuerySchema, req);
  ok(res, "Inventory", await listMedicines(auth.sub, query));
});

inventoryRouter.post("/", async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(medicineInputSchema, req);
  created(res, "Medicine added", await createMedicine(auth.sub, input));
});

inventoryRouter.patch("/:id", async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  const input = parseBody(medicineUpdateSchema, req);
  ok(res, "Medicine updated", await updateMedicine(auth.sub, id, input));
});

inventoryRouter.delete("/:id", async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  ok(res, "Medicine removed", await deleteMedicine(auth.sub, id));
});
