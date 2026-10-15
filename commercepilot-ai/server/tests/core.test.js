import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import argon2 from "argon2";
import { createHmac, randomUUID } from "node:crypto";
import * as M from "../src/models/index.js";
import { createApp } from "../src/app.js";
import {
  quoteOrder,
  createOrder,
  setCart,
  changeStatus,
} from "../src/services/orders/orderService.js";
import { executeTool } from "../src/services/ai/assistantService.js";
import { signatureValid } from "../src/utils/crypto.js";
import {
  ingest,
  withinWindow,
} from "../src/services/whatsapp/whatsappService.js";
let db, app, p, c;
const address = {
  name: "Test Customer",
  phone: "03001234567",
  city: "Lahore",
  address: "123 Example Road",
};
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.ENABLE_SIMULATOR = "true";
  if (process.env.TEST_MONGODB_URI) {
    if (!process.env.TEST_MONGODB_URI.includes("commercepilot_test"))
      throw new Error(
        "TEST_MONGODB_URI must use a dedicated commercepilot_test database",
      );
    await mongoose.connect(process.env.TEST_MONGODB_URI);
  } else {
    db = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
      },
      binary: {
        version: "7.0.24",
      },
    });
    await mongoose.connect(db.getUri());
  }
  await M.initialize();
  app = createApp();
});
afterAll(async () => {
  await mongoose.disconnect();
  await db?.stop();
});
beforeEach(async () => {
  for (const model of Object.values(mongoose.models))
    await model.deleteMany({});
  p = await M.Product.create({
    name: "Cotton tee",
    description: "Cotton shirt",
    category: "Apparel",
    variants: [
      {
        sku: "TEE-01",
        label: "Black / M",
        price: 150000,
        stock: 3,
      },
    ],
  });
  c = await M.Customer.create({
    name: "Test",
    channel: "simulator",
  });
  await M.Zone.create({
    name: "Lahore",
    cities: ["lahore"],
    fee: 20000,
  });
});
async function draft(customer = c._id, qty = 1) {
  await setCart(customer, String(p.variants[0]._id), qty);
  return quoteOrder(customer, {
    address,
  });
}
const args = (q) => ({
  quoteId: String(q._id),
  nonce: q.nonce,
  confirmed: true,
  idempotencyKey: randomUUID(),
});
it("quotes server prices and shipping in integer minor units", async () => {
  const q = await draft();
  expect(q.total).toBe(170000);
  expect(q.items[0].price).toBe(150000);
});
it("creates one order on identical confirmation retry", async () => {
  const q = await draft(),
    a = args(q);
  const first = await createOrder(c._id, a);
  const second = await createOrder(c._id, a);
  expect(String(second._id)).toBe(String(first._id));
  expect(await M.Order.countDocuments()).toBe(1);
  expect((await M.Product.findById(p._id)).variants[0].stock).toBe(2);
  expect(await M.Outbox.countDocuments()).toBe(1);
});
it("rejects expired quote and rolls back", async () => {
  const q = await draft();
  await M.Quote.updateOne(
    {
      _id: q._id,
    },
    {
      $set: {
        expires: new Date(0),
      },
    },
  );
  await expect(createOrder(c._id, args(q))).rejects.toMatchObject({
    status: 409,
  });
  expect(await M.Order.countDocuments()).toBe(0);
});
it("rejects price changes without decrementing inventory", async () => {
  const q = await draft();
  await M.Product.updateOne(
    {
      _id: p._id,
    },
    {
      $set: {
        "variants.0.price": 200000,
      },
    },
  );
  await expect(createOrder(c._id, args(q))).rejects.toMatchObject({
    status: 409,
  });
  expect((await M.Product.findById(p._id)).variants[0].stock).toBe(3);
});
it("prevents concurrent overselling", async () => {
  const other = await M.Customer.create({
    channel: "simulator",
  });
  const q1 = await draft(c._id, 2),
    q2 = await draft(other._id, 2);
  const results = await Promise.allSettled([
    createOrder(c._id, args(q1)),
    createOrder(other._id, args(q2)),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect((await M.Product.findById(p._id)).variants[0].stock).toBe(1);
});
it("restores a cancellation once, never implies payment collected", async () => {
  const o = await createOrder(c._id, args(await draft()));
  await changeStatus(o._id, "Cancelled", "admin");
  await expect(changeStatus(o._id, "Cancelled", "admin")).rejects.toMatchObject(
    {
      status: 409,
    },
  );
  expect((await M.Product.findById(p._id)).variants[0].stock).toBe(3);
  expect((await M.Order.findById(o._id)).paymentStatus).toBe("Not Collected");
});
it("rejects confirmation without affirmative user action", async () => {
  const q = await draft();
  await expect(
    createOrder(c._id, {
      ...args(q),
      confirmed: false,
    }),
  ).rejects.toMatchObject({
    status: 400,
  });
});
it("enforces coupon cap transactionally", async () => {
  await M.Coupon.create({
    code: "SAVE",
    amount: 10000,
    minimum: 0,
    maxUses: 1,
    expires: new Date(Date.now() + 100000),
  });
  await setCart(c._id, String(p.variants[0]._id), 1);
  const q = await quoteOrder(c._id, {
    address,
    coupon: "SAVE",
  });
  expect(q.total).toBe(160000);
  await createOrder(c._id, args(q));
  await setCart(c._id, String(p.variants[0]._id), 1);
  await expect(
    quoteOrder(c._id, {
      address,
      coupon: "SAVE",
    }),
  ).rejects.toMatchObject({
    status: 422,
  });
});
it("blocks unknown model tools and cross-customer order lookup", async () => {
  await expect(
    executeTool(
      "runCode",
      {
        code: "deleteAll()",
      },
      c._id,
    ),
  ).rejects.toMatchObject({
    status: 400,
  });
  const o = await createOrder(c._id, args(await draft()));
  expect(
    await executeTool(
      "getVerifiedOrderStatus",
      {
        reference: o.reference,
      },
      new mongoose.Types.ObjectId(),
    ),
  ).toBeNull();
});
it("verifies raw signature and deduplicates webhooks", async () => {
  const body = Buffer.from('{"message":"test"}');
  const sig =
    "sha256=" + createHmac("sha256", "secret").update(body).digest("hex");
  expect(signatureValid(body, sig, "secret")).toBe(true);
  expect(signatureValid(Buffer.from("tampered"), sig, "secret")).toBe(false);
  expect(signatureValid(body, "sha256=x", "secret")).toBe(false);
  const event = {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  id: "wa-1",
                  from: "923001234567",
                  text: {
                    body: "hello",
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  await ingest(event);
  await ingest(event);
  expect(await M.Webhook.countDocuments()).toBe(1);
});
it("blocks messages outside the service window", () => {
  expect(withinWindow(new Date(Date.now() - 86400001))).toBe(false);
  expect(withinWindow(new Date())).toBe(true);
});
it("login, CSRF, logout and RBAC work", async () => {
  await M.User.create({
    email: "admin@example.test",
    name: "Admin",
    role: "ADMIN",
    passwordHash: await argon2.hash("a-long-test-password"),
  });
  const agent = request.agent(app);
  expect((await agent.get("/api/v1/admin/analytics")).status).toBe(401);
  const login = await agent.post("/api/v1/auth/login").send({
    email: "admin@example.test",
    password: "a-long-test-password",
  });
  expect(login.status).toBe(200);
  expect((await agent.get("/api/v1/admin/analytics")).status).toBe(200);
  expect((await agent.post("/api/v1/auth/logout")).status).toBe(403);
  expect(
    (
      await agent
        .post("/api/v1/auth/logout")
        .set("x-csrf-token", login.body.csrf)
    ).status,
  ).toBe(200);
  expect((await agent.get("/api/v1/admin/analytics")).status).toBe(401);
});
it("customer API cannot read another order or supply price", async () => {
  const o = await createOrder(c._id, args(await draft()));
  const agent = request.agent(app);
  const session = await agent.post("/api/v1/customer/session").send({});
  expect(session.status).toBe(201);
  expect((await agent.get("/api/v1/orders/" + o._id)).status).toBe(404);
  expect(
    (
      await agent
        .post("/api/v1/orders/quote")
        .set("x-csrf-token", session.body.csrf)
        .send({
          address,
          total: 1,
        })
    ).status,
  ).toBe(400);
});
it("deterministic fallback and human takeover persist", async () => {
  delete process.env.OPENAI_API_KEY;
  const { chat } = await import("../src/services/ai/assistantService.js");
  const first = await chat(c._id, "products");
  expect(first.engine).toBe("deterministic");
  expect(first.text).toContain("Cotton tee");
  await chat(c._id, "human");
  expect(
    (
      await M.Conversation.findOne({
        customer: c._id,
      })
    ).mode,
  ).toBe("human");
  expect((await chat(c._id, "hello")).mode).toBe("human");
  await chat(c._id, "STOP");
  expect((await M.Customer.findById(c._id)).marketingOptIn).toBe(false);
});
