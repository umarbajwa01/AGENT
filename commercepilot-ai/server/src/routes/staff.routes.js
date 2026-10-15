import argon2 from "argon2";
import { z } from "zod";
import * as M from "../models/index.js";
import { fail } from "../utils/errors.js";
import { oid } from "../validators/index.js";
import { admin } from "../middleware/roles.js";
import { audit } from "../utils/audit.js";
export function registerStaffRoutes(api) {
  api.get("/admin/staff", admin, async (req, res) =>
    res.json(await M.User.find({}, "name email role active createdAt")),
  );
  api.post("/admin/staff", admin, async (req, res) => {
    const a = z
      .object({
        email: z.email(),
        name: z.string().min(2).max(80),
        password: z.string().min(14).max(200),
        role: z.enum(["ADMIN", "SALES_AGENT"]),
      })
      .strict()
      .parse(req.body);
    await M.User.create({
      email: a.email.toLowerCase(),
      name: a.name,
      role: a.role,
      passwordHash: await argon2.hash(a.password, {
        type: argon2.argon2id,
      }),
    });
    await audit(req, "staff.created", a.email);
    res.status(201).json({
      ok: true,
    });
  });
  api.patch("/admin/staff/:id", admin, async (req, res) => {
    const id = oid.parse(req.params.id);
    if (id === String(req.user._id)) fail(400, "Cannot deactivate yourself");
    const a = z
      .object({
        active: z.boolean(),
      })
      .strict()
      .parse(req.body);
    await M.User.updateOne(
      {
        _id: id,
      },
      {
        $set: a,
      },
    );
    if (!a.active)
      await M.Session.deleteMany({
        user: id,
      });
    await audit(req, "staff.access", id);
    res.json({
      ok: true,
    });
  });
}
