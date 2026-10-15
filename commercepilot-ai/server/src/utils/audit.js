import * as M from "../models/index.js";
export async function audit(req, action, target, detail) {
  await M.Audit.create({
    actor: String(req.user._id),
    action,
    target: String(target),
    detail,
  });
}
