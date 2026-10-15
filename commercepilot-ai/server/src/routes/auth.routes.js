import rateLimit from "express-rate-limit";
import argon2 from "argon2";
import * as OTPAuth from "otpauth";
import { z } from "zod";
import * as M from "../models/index.js";
import { issueSession } from "../middleware/auth.js";
import { fail } from "../utils/errors.js";
import { decryptSecret } from "../config/secrets.js";
export function registerAuthRoutes(api) {
  const loginLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: 10,
  });
  api.post("/auth/login", loginLimit, async (req, res) => {
    const a = z
      .object({
        email: z.email(),
        password: z.string().min(1).max(200),
        otp: z.string().optional(),
      })
      .strict()
      .parse(req.body);
    const u = await M.User.findOne({
      email: a.email.toLowerCase(),
      active: true,
    });
    const valid = u && (await argon2.verify(u.passwordHash, a.password));
    if (!valid) fail(401, "Invalid sign-in details");
    if (u.totpSecret) {
      const totp = new OTPAuth.TOTP({
        secret: decryptSecret(u.totpSecret),
      });
      if (
        !a.otp ||
        totp.validate({
          token: a.otp,
          window: 1,
        }) === null
      )
        fail(401, "Authenticator code required");
    } else if (process.env.NODE_ENV === "production")
      fail(403, "Privileged MFA must be provisioned before production login");
    if (req.session) await req.session.deleteOne();
    const s = await issueSession(res, {
      user: u._id,
    });
    await M.Audit.create({
      actor: String(u._id),
      action: "auth.login",
      target: String(u._id),
    });
    res.json({
      user: {
        id: u._id,
        name: u.name,
        role: u.role,
      },
      csrf: s.csrf,
    });
  });
  api.get("/auth/me", (req, res) =>
    res.json({
      user: req.user
        ? {
            id: req.user._id,
            name: req.user.name,
            role: req.user.role,
          }
        : null,
      customer: req.customer || null,
      csrf: req.session?.csrf || null,
    }),
  );
  api.post("/auth/refresh", async (req, res) => {
    if (!req.session) fail(401, "Sign in required");
    const prior = req.session;
    const s = await issueSession(res, {
      user: prior.user,
      customer: prior.customer,
    });
    await prior.deleteOne();
    res.json({
      csrf: s.csrf,
    });
  });
  api.post("/auth/logout", async (req, res) => {
    await req.session?.deleteOne();
    res.clearCookie("cp_session", {
      path: "/",
    });
    res.json({
      ok: true,
    });
  });
  api.post("/customer/session", loginLimit, async (req, res) => {
    if (req.customer)
      return res.json({
        customer: req.customer,
        csrf: req.session.csrf,
      });
    if (req.user)
      fail(
        409,
        "Open the simulator in a separate browser session or log out first",
      );
    if (process.env.ENABLE_SIMULATOR !== "true")
      fail(404, "Simulator disabled");
    const c = await M.Customer.create({
      name: "Web simulator customer",
      channel: "simulator",
    });
    const s = await issueSession(res, {
      customer: c._id,
    });
    res.status(201).json({
      customer: c._id,
      csrf: s.csrf,
    });
  });
}
