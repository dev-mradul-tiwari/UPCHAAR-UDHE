import { Router } from "express";
import { departmentInputSchema, departmentUpdateSchema } from "@upchaar/types";

import { getAuth, requireAuth } from "../middleware/auth.js";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "../services/department.service.js";
import { departmentListQuerySchema } from "../utils/query.js";
import { created, ok } from "../utils/respond.js";
import { parseBody, parseQuery, requiredParam } from "../utils/validate.js";

export const departmentsRouter: Router = Router();

departmentsRouter.get("/", async (req, res) => {
  const query = parseQuery(departmentListQuerySchema, req);
  ok(res, "Departments", await listDepartments(query.hospitalId));
});

departmentsRouter.post("/", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const input = parseBody(departmentInputSchema, req);
  created(res, "Department created", await createDepartment(auth.sub, input));
});

departmentsRouter.patch("/:id", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  const input = parseBody(departmentUpdateSchema, req);
  ok(res, "Department updated", await updateDepartment(auth.sub, id, input));
});

departmentsRouter.delete("/:id", requireAuth("HOSPITAL"), async (req, res) => {
  const auth = getAuth(req);
  const id = requiredParam(req, "id");
  ok(res, "Department deleted", await deleteDepartment(auth.sub, id));
});
