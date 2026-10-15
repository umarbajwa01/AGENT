import { Session, User } from "../models/identity.js";
import { hash, token } from "../utils/crypto.js";
export async function identify(req, res, next) {
  try {
    const raw = req.cookies.cp_session;
    if (raw) {
      const s = await Session.findOne({
        hash: hash(raw),
        expires: {
          $gt: new Date(),
        },
      });
      if (s) {
        req.session = s;
        if (s.user)
          req.user = await User.findOne({
            _id: s.user,
            active: true,
          });
        req.customer = s.customer;
      }
    }
    next();
  } catch (e) {
    next(e);
  }
}
export const staff =
  (...roles) =>
  (req, res, next) => {
    if (!req.user)
      return next(
        Object.assign(new Error("Sign in required"), {
          status: 401,
        }),
      );
    if (!roles.includes(req.user.role))
      return next(
        Object.assign(new Error("Not permitted"), {
          status: 403,
        }),
      );
    next();
  };
export function customer(req, res, next) {
  if (!req.customer)
    return next(
      Object.assign(new Error("Customer session required"), {
        status: 401,
      }),
    );
  next();
}
export function csrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.path === "/auth/login" || req.path === "/customer/session")
    return next();
  if (!req.session || req.get("x-csrf-token") !== req.session.csrf)
    return next(
      Object.assign(new Error("Invalid CSRF token"), {
        status: 403,
      }),
    );
  next();
}
export async function issueSession(res, { user, customer }) {
  const raw = token();
  const s = await Session.create({
    hash: hash(raw),
    user,
    customer,
    csrf: token(),
    expires: new Date(Date.now() + 8 * 3600000),
  });
  res.cookie("cp_session", raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 8 * 3600000,
    path: "/",
  });
  return s;
}
