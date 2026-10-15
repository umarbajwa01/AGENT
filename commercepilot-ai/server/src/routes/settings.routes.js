import { z } from "zod";
import * as M from "../models/index.js";
import { fail } from "../utils/errors.js";
import { admin } from "../middleware/roles.js";
import { audit } from "../utils/audit.js";
export function registerSettingsRoutes(api) {
  api.get("/admin/settings", admin, async (req, res) =>
    res.json({
      settings: await M.Settings.find(),
      integrations: {
        openai: !!process.env.OPENAI_API_KEY,
        whatsapp: !!process.env.META_TOKEN,
        simulator: process.env.ENABLE_SIMULATOR === "true",
      },
      security: {
        mfaRequired: process.env.NODE_ENV === "production",
        sessionHours: 8,
      },
    }),
  );
  api.put("/admin/settings/:key", admin, async (req, res) => {
    const key = z
      .enum([
        "business",
        "policy.shipping",
        "policy.returns",
        "policy.cancellation",
        "policy.cod",
        "policy.privacy",
        "policy.terms",
        "policy.support",
      ])
      .parse(req.params.key);
    const value = z
      .object({
        title: z.string().max(120),
        text: z.string().max(10000),
        published: z.boolean(),
      })
      .strict()
      .parse(req.body);
    res.json(
      await M.Settings.findOneAndUpdate(
        {
          key,
        },
        {
          $set: {
            value,
          },
        },
        {
          upsert: true,
          new: true,
        },
      ),
    );
    await audit(req, "settings.updated", key);
  });
  api.get("/policies/:key", async (req, res) => {
    const key = z
      .enum([
        "shipping",
        "returns",
        "cancellation",
        "cod",
        "privacy",
        "terms",
        "support",
      ])
      .parse(req.params.key);
    const p = await M.Settings.findOne({
      key: "policy." + key,
      "value.published": true,
    });
    if (!p) fail(404, "Policy not published");
    res.json(p.value);
  });
}
