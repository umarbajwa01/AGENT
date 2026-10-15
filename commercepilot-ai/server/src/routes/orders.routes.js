import { z } from "zod";
import * as M from "../models/index.js";
import { customer } from "../middleware/auth.js";
import { fail } from "../utils/errors.js";
import { oid } from "../validators/index.js";
import { paginated } from "../utils/pagination.js";
import {
  quoteOrder,
  createOrder,
  changeStatus,
} from "../services/orders/orderService.js";
import { admin } from "../middleware/roles.js";
import { audit } from "../utils/audit.js";
export function registerOrdersRoutes(api) {
  api.post("/orders/quote", customer, async (req, res) => {
    const a = z
      .object({
        address: z.unknown(),
        coupon: z.string().max(40).optional(),
      })
      .strict()
      .parse(req.body);
    res.json(await quoteOrder(req.customer, a));
  });
  api.post("/orders", customer, async (req, res) => {
    const a = z
      .object({
        quoteId: oid,
        nonce: z.string().length(64),
        idempotencyKey: z.string().uuid(),
        confirmed: z.literal(true),
      })
      .strict()
      .parse(req.body);
    res.status(201).json(await createOrder(req.customer, a));
  });
  api.get("/orders", async (req, res) => {
    if (!req.user && !req.customer) fail(401, "Sign in required");
    if (req.user?.role === "SALES_AGENT")
      fail(403, "Order access reserved for administrators in this release");
    res.json(
      await paginated(
        M.Order,
        {
          ...(req.customer
            ? {
                customer: req.customer,
              }
            : {}),
          ...(req.query.status
            ? {
                status: String(req.query.status),
              }
            : {}),
        },
        req.query,
      ),
    );
  });
  api.get("/orders/:id", async (req, res) => {
    if (!req.user && !req.customer) fail(401, "Sign in required");
    if (req.user?.role === "SALES_AGENT") fail(403, "Not permitted");
    const o = await M.Order.findOne({
      _id: oid.parse(req.params.id),
      ...(req.customer
        ? {
            customer: req.customer,
          }
        : {}),
    });
    if (!o) fail(404, "Order not found");
    res.json(o);
  });
  api.patch("/orders/:id/status", admin, async (req, res) => {
    const a = z
      .object({
        status: z.string(),
        expected: z.string(),
      })
      .strict()
      .parse(req.body);
    res.json(
      await changeStatus(
        oid.parse(req.params.id),
        a.status,
        String(req.user._id),
        a.expected,
      ),
    );
  });
  api.patch("/orders/:id/payment", admin, async (req, res) => {
    const a = z
      .object({
        paymentStatus: z.enum([
          "Not Collected",
          "Collected",
          "Refunded",
          "Partially Refunded",
        ]),
        reason: z.string().min(5).max(300),
      })
      .strict()
      .parse(req.body);
    await M.Order.updateOne(
      {
        _id: oid.parse(req.params.id),
      },
      {
        $set: {
          paymentStatus: a.paymentStatus,
        },
      },
    );
    await audit(req, "payment.manual", req.params.id, a.reason);
    res.json({
      ok: true,
    });
  });
}
