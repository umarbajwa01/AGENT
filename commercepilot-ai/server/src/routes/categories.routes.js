import { z } from "zod";
import * as M from "../models/index.js";
import { oid } from "../validators/index.js";
import { admin } from "../middleware/roles.js";
export function registerCategoriesRoutes(api) {
  api.get("/categories", async (req, res) =>
    res.json(
      await M.Category.find().sort({
        name: 1,
      }),
    ),
  );
  api.post("/categories", admin, async (req, res) =>
    res.status(201).json(
      await M.Category.create(
        z
          .object({
            name: z.string().trim().min(2).max(80),
          })
          .strict()
          .parse(req.body),
      ),
    ),
  );
  api.delete("/categories/:id", admin, async (req, res) => {
    await M.Category.deleteOne({
      _id: oid.parse(req.params.id),
    });
    res.json({
      ok: true,
    });
  });
}
