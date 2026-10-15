import { z } from "zod";
import mongoose from "mongoose";
import * as M from "../models/index.js";
import { fail } from "../utils/errors.js";
import { oid, money, productSchema } from "../validators/index.js";
import { paginated } from "../utils/pagination.js";
import { admin } from "../middleware/roles.js";
import { audit } from "../utils/audit.js";
export function registerProductsRoutes(api) {
  api.get("/products", async (req, res) => {
    const q = z
      .string()
      .max(100)
      .parse(req.query.q || "");
    const filter = {
      ...(req.user
        ? {}
        : {
            active: true,
          }),
      ...(q
        ? {
            $text: {
              $search: q,
            },
          }
        : {}),
      ...(req.query.category
        ? {
            category: String(req.query.category).slice(0, 80),
          }
        : {}),
    };
    res.json(await paginated(M.Product, filter, req.query));
  });
  api.get("/products/:id", async (req, res) => {
    const p = await M.Product.findOne({
      _id: oid.parse(req.params.id),
      ...(req.user
        ? {}
        : {
            active: true,
          }),
    });
    if (!p) fail(404, "Product not found");
    res.json(p);
  });
  api.post("/products", admin, async (req, res) => {
    const p = await M.Product.create(productSchema.parse(req.body));
    await audit(req, "product.created", p._id);
    res.status(201).json(p);
  });
  api.patch("/products/:id", admin, async (req, res) => {
    const a = req.body;
    const update = z
      .object({
        name: z.string().min(2).max(150).optional(),
        description: z.string().max(2000).optional(),
        category: z.string().max(80).optional(),
        image: z
          .union([
            z.literal(""),
            z.url().refine((s) => s.startsWith("https://")),
          ])
          .optional(),
        active: z.boolean().optional(),
      })
      .strict()
      .parse(a);
    const p = await M.Product.findByIdAndUpdate(
      oid.parse(req.params.id),
      {
        $set: update,
      },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!p) fail(404, "Product not found");
    await audit(req, "product.updated", p._id);
    res.json(p);
  });
  api.delete("/products/:id", admin, async (req, res) => {
    await M.Product.updateOne(
      {
        _id: oid.parse(req.params.id),
      },
      {
        $set: {
          active: false,
        },
      },
    );
    await audit(req, "product.archived", req.params.id);
    res.json({
      ok: true,
    });
  });
  api.patch("/products/:id/variants/:variant", admin, async (req, res) => {
    const a = z
      .object({
        price: money.optional(),
        delta: z.number().int().min(-1000000).max(1000000).default(0),
        reason: z.string().min(3).max(200),
      })
      .strict()
      .parse(req.body);
    const pid = oid.parse(req.params.id),
      vid = oid.parse(req.params.variant);
    await mongoose.connection.transaction(async (session) => {
      const set =
        a.price === undefined
          ? {}
          : {
              $set: {
                "variants.$.price": a.price,
              },
            };
      const r = await M.Product.updateOne(
        {
          _id: pid,
          variants: {
            $elemMatch: {
              _id: vid,
              stock: {
                $gte: Math.max(0, -a.delta),
              },
            },
          },
        },
        {
          $inc: {
            "variants.$.stock": a.delta,
          },
          ...set,
        },
        {
          session,
        },
      );
      if (!r.matchedCount) fail(409, "Variant unavailable or negative stock");
      await M.Movement.create(
        [
          {
            variant: vid,
            delta: a.delta,
            reason: a.reason,
            actor: String(req.user._id),
          },
        ],
        {
          session,
        },
      );
      await M.Audit.create(
        [
          {
            actor: String(req.user._id),
            action: "inventory.adjust",
            target: vid,
            detail: a.reason,
          },
        ],
        {
          session,
        },
      );
    });
    res.json({
      ok: true,
    });
  });
  api.post("/products/import", admin, async (req, res) => {
    const list = z.array(productSchema).min(1).max(100).parse(req.body);
    await mongoose.connection.transaction(async (session) => {
      await M.Product.create(list, {
        session,
      });
    });
    await audit(req, "products.import", String(list.length));
    res.status(201).json({
      imported: list.length,
    });
  });
}
