import { z } from "zod";
import * as M from "../models/index.js";
import { fail } from "../utils/errors.js";
import { oid } from "../validators/index.js";
import { paginated } from "../utils/pagination.js";
import { team, admin } from "../middleware/roles.js";
import { audit } from "../utils/audit.js";
export function registerConversationsRoutes(api) {
  api.get("/admin/conversations", team, async (req, res) =>
    res.json(
      await paginated(
        M.Conversation,
        req.user.role === "ADMIN"
          ? {}
          : {
              assignedTo: req.user._id,
            },
        req.query,
      ),
    ),
  );
  async function assigned(req) {
    const c = await M.Conversation.findOne({
      _id: oid.parse(req.params.id),
      ...(req.user.role === "ADMIN"
        ? {}
        : {
            assignedTo: req.user._id,
          }),
    });
    if (!c) fail(404, "Conversation not found");
    return c;
  }
  api.get("/admin/conversations/:id/messages", team, async (req, res) => {
    const c = await assigned(req);
    res.json(
      await M.Message.find({
        conversation: c._id,
      })
        .sort({
          createdAt: 1,
        })
        .limit(100),
    );
  });
  api.patch("/admin/conversations/:id/assign", admin, async (req, res) => {
    const a = z
      .object({
        mode: z.enum(["ai", "human"]),
        assignedTo: oid.nullable(),
      })
      .strict()
      .parse(req.body);
    if (
      a.assignedTo &&
      !(await M.User.exists({
        _id: a.assignedTo,
        active: true,
      }))
    )
      fail(400, "Staff not found");
    res.json(
      await M.Conversation.findByIdAndUpdate(
        oid.parse(req.params.id),
        {
          $set: a,
        },
        {
          new: true,
        },
      ),
    );
    await audit(req, "conversation.assign", req.params.id);
  });
  api.post("/admin/conversations/:id/messages", team, async (req, res) => {
    const c = await assigned(req);
    if (c.mode !== "human") fail(409, "Take over conversation first");
    const a = z
      .object({
        text: z.string().min(1).max(2000),
      })
      .strict()
      .parse(req.body);
    const m = await M.Message.create({
      conversation: c._id,
      role: "assistant",
      text: a.text,
      channel: c.channel,
    });
    await M.Outbox.create({
      key: "staff-" + m._id,
      customer: c.customer,
      conversation: c._id,
      text: a.text,
    });
    res.status(201).json(m);
  });
}
