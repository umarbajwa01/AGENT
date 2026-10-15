import rateLimit from "express-rate-limit";
import { z } from "zod";
import * as M from "../models/index.js";
import { customer } from "../middleware/auth.js";
import { chat } from "../services/ai/assistantService.js";
export function registerAssistantRoutes(api) {
  api.post(
    "/ai/chat",
    customer,
    rateLimit({
      windowMs: 60000,
      limit: 12,
    }),
    async (req, res) => {
      const a = z
        .object({
          text: z.string().trim().min(1).max(2000),
        })
        .strict()
        .parse(req.body);
      res.json(await chat(req.customer, a.text));
    },
  );
  api.get("/messages", customer, async (req, res) => {
    const c = await M.Conversation.findOne({
      customer: req.customer,
    });
    res.json(
      c
        ? await M.Message.find({
            conversation: c._id,
          })
            .sort({
              createdAt: -1,
            })
            .limit(100)
        : [],
    );
  });
}
