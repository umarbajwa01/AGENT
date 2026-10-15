import { z } from "zod";
import * as M from "../models/index.js";
import { customer } from "../middleware/auth.js";
import { fail } from "../utils/errors.js";
import { oid, money } from "../validators/index.js";
import { admin } from "../middleware/roles.js";
export function registerDeliveryRoutes(api) {
  api.get("/delivery/zones", async (req, res) =>
    res.json(
      await M.Zone.find(
        req.user
          ? {}
          : {
              active: true,
            },
      ),
    ),
  );
  const zoneSchema = z
    .object({
      name: z.string().min(2).max(100),
      cities: z
        .array(
          z
            .string()
            .trim()
            .min(2)
            .max(80)
            .transform((s) => s.toLowerCase()),
        )
        .min(1)
        .max(100),
      fee: money,
      active: z.boolean().default(true),
    })
    .strict();
  api.post("/delivery/zones", admin, async (req, res) =>
    res.status(201).json(await M.Zone.create(zoneSchema.parse(req.body))),
  );
  api.patch("/delivery/zones/:id", admin, async (req, res) =>
    res.json(
      await M.Zone.findByIdAndUpdate(
        oid.parse(req.params.id),
        {
          $set: zoneSchema.parse(req.body),
        },
        {
          new: true,
          runValidators: true,
        },
      ),
    ),
  );
  api.post("/delivery/quote", customer, async (req, res) => {
    const a = z
      .object({
        city: z.string().max(80),
      })
      .strict()
      .parse(req.body);
    const zone = await M.Zone.findOne({
      active: true,
      cities: a.city.toLowerCase(),
    });
    if (!zone) fail(422, "Unsupported delivery area");
    res.json({
      fee: zone.fee,
      currency: "PKR",
    });
  });
}
