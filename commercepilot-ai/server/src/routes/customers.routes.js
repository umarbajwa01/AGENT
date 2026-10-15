import * as M from "../models/index.js";
import { paginated } from "../utils/pagination.js";
import { admin } from "../middleware/roles.js";
export function registerCustomersRoutes(api) {
  api.get("/admin/customers", admin, async (req, res) =>
    res.json(await paginated(M.Customer, {}, req.query)),
  );
  api.get("/admin/audit-logs", admin, async (req, res) =>
    res.json(await paginated(M.Audit, {}, req.query)),
  );
}
