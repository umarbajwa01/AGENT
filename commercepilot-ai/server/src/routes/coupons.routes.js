import { z } from "zod";
import * as M from "../models/index.js";
import { oid, money } from "../validators/index.js";
import { paginated } from "../utils/pagination.js";
import { admin } from "../middleware/roles.js";
export function registerCouponsRoutes(api) {
  api.get("/admin/coupons", admin, async (req, res) =>
    res.json(await paginated(M.Coupon, {}, req.query)),
  );
  const couponSchema = z
    .object({
      code: z.string().regex(/^[A-Z0-9_-]{2,40}$/),
      amount: money,
      minimum: money,
      maxUses: z.number().int().min(1),
      expires: z.iso.datetime(),
      active: z.boolean().default(true),
    })
    .strict();
  api.post("/admin/coupons", admin, async (req, res) =>
    res.status(201).json(await M.Coupon.create(couponSchema.parse(req.body))),
  );
  api.patch("/admin/coupons/:id", admin, async (req, res) =>
    res.json(
      await M.Coupon.findByIdAndUpdate(
        oid.parse(req.params.id),
        {
          $set: couponSchema.parse(req.body),
        },
        {
          new: true,
          runValidators: true,
        },
      ),
    ),
  );
}
