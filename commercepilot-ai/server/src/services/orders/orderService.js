import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { Product, Zone, Coupon } from "../../models/catalog.js";
import {
  Cart,
  Quote,
  Order,
  Reservation,
  Movement,
} from "../../models/orders.js";
import { Audit, Outbox } from "../../models/operations.js";
import { fail } from "../../utils/errors.js";
import { token, hash } from "../../utils/crypto.js";
import { addressSchema } from "../../validators/index.js";
export const transitions = {
  "Pending Confirmation": ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Packed", "Cancelled"],
  Packed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Returned"],
  Delivered: ["Returned"],
  Cancelled: [],
  Returned: [],
};
export async function cartView(customer) {
  const cart = await Cart.findOne({
    customer,
  });
  const items = [];
  for (const i of cart?.items || []) {
    const p = await Product.findOne({
      "variants._id": i.variant,
      active: true,
    });
    if (!p) continue;
    const v = p.variants.id(i.variant);
    items.push({
      variant: String(v._id),
      name: p.name,
      label: v.label,
      price: v.price,
      stock: v.stock,
      quantity: i.quantity,
    });
  }
  return {
    items,
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  };
}
export async function setCart(customer, variant, quantity) {
  const p = await Product.findOne({
    active: true,
    variants: {
      $elemMatch: {
        _id: variant,
        active: true,
      },
    },
  });
  if (!p) fail(404, "Variant not found");
  if (quantity > p.variants.id(variant).stock)
    fail(409, "Requested quantity is unavailable");
  await mongoose.connection.transaction(async (session) => {
    const c = await Cart.findOneAndUpdate(
      {
        customer,
      },
      {
        $setOnInsert: {
          items: [],
        },
      },
      {
        upsert: true,
        new: true,
        session,
      },
    );
    const i = c.items.find((x) => String(x.variant) === variant);
    if (quantity === 0)
      c.items = c.items.filter((x) => String(x.variant) !== variant);
    else if (i) i.quantity = quantity;
    else {
      if (c.items.length >= 50) fail(400, "Cart limit reached");
      c.items.push({
        variant,
        quantity,
      });
    }
    await c.save({
      session,
    });
  });
  return cartView(customer);
}
export async function quoteOrder(customer, input) {
  const address = addressSchema.parse(input.address);
  const c = await cartView(customer);
  if (!c.items.length) fail(400, "Cart is empty");
  if (c.items.some((i) => i.quantity > i.stock))
    fail(409, "Stock changed; update your cart");
  const zone = await Zone.findOne({
    active: true,
    cities: address.city.toLowerCase(),
  });
  if (!zone) fail(422, "Delivery is not available in this city");
  let coupon = null,
    discount = 0;
  if (input.coupon) {
    coupon = await Coupon.findOne({
      code: input.coupon.toUpperCase(),
      active: true,
      expires: {
        $gt: new Date(),
      },
      $expr: {
        $lt: ["$used", "$maxUses"],
      },
    });
    if (!coupon || c.subtotal < coupon.minimum)
      fail(422, "Coupon is not available");
    discount = Math.min(c.subtotal, coupon.amount);
  }
  const nonce = token();
  const items = [];
  for (const i of c.items) {
    const p = await Product.findOne({
      "variants._id": i.variant,
    });
    items.push({
      variant: i.variant,
      name: i.name,
      label: i.label,
      price: i.price,
      quantity: i.quantity,
      sku: p.variants.id(i.variant).sku,
    });
  }
  const quote = await Quote.create({
    customer,
    items,
    address,
    subtotal: c.subtotal,
    shipping: zone.fee,
    discount,
    total: c.subtotal + zone.fee - discount,
    coupon: coupon?._id,
    nonceHash: hash(nonce),
    expires: new Date(Date.now() + 600000),
  });
  return {
    ...quote.toObject(),
    nonce,
    nonceHash: undefined,
  };
}
export async function createOrder(
  customer,
  { quoteId, nonce, idempotencyKey, confirmed },
) {
  if (confirmed !== true) fail(400, "Explicit confirmation required");
  let result;
  try {
    await mongoose.connection.transaction(async (session) => {
      const prior = await Order.findOne({
        customer,
        idempotencyKey,
      }).session(session);
      if (prior) {
        if (String(prior.quote) !== quoteId)
          fail(409, "Idempotency key belongs to another quote");
        result = prior;
        return;
      }
      const q = await Quote.findOneAndUpdate(
        {
          _id: quoteId,
          customer,
          used: false,
          expires: {
            $gt: new Date(),
          },
          nonceHash: hash(nonce),
        },
        {
          $set: {
            used: true,
          },
        },
        {
          new: true,
          session,
        },
      );
      if (!q) fail(409, "Quote expired, already used, or confirmation invalid");
      for (const i of q.items) {
        const r = await Product.updateOne(
          {
            active: true,
            variants: {
              $elemMatch: {
                _id: i.variant,
                active: true,
                price: i.price,
                stock: {
                  $gte: i.quantity,
                },
              },
            },
          },
          {
            $inc: {
              "variants.$.stock": -i.quantity,
            },
          },
          {
            session,
          },
        );
        if (r.modifiedCount !== 1)
          fail(409, "Price or stock changed; request a new quote");
      }
      if (q.coupon) {
        const r = await Coupon.updateOne(
          {
            _id: q.coupon,
            active: true,
            expires: {
              $gt: new Date(),
            },
            $expr: {
              $lt: ["$used", "$maxUses"],
            },
          },
          {
            $inc: {
              used: 1,
            },
          },
          {
            session,
          },
        );
        if (!r.modifiedCount) fail(409, "Coupon no longer available");
      }
      const expires = new Date(Date.now() + 24 * 3600000);
      const [o] = await Order.create(
        [
          {
            customer,
            idempotencyKey,
            quote: q._id,
            reference: "CP-" + randomUUID().slice(0, 12).toUpperCase(),
            items: q.items,
            address: q.address,
            subtotal: q.subtotal,
            shipping: q.shipping,
            discount: q.discount,
            total: q.total,
            currency: q.currency,
            reservationExpires: expires,
            history: [
              {
                status: "Pending Confirmation",
                at: new Date(),
                actor: "customer",
              },
            ],
          },
        ],
        {
          session,
        },
      );
      await Reservation.create(
        [
          {
            order: o._id,
            state: "active",
            expires,
            items: q.items.map((i) => ({
              variant: i.variant,
              quantity: i.quantity,
            })),
          },
        ],
        {
          session,
        },
      );
      await Movement.create(
        q.items.map((i) => ({
          variant: i.variant,
          order: o._id,
          delta: -i.quantity,
          reason: "reserve",
          actor: "customer",
        })),
        {
          session,
        },
      );
      await Cart.updateOne(
        {
          customer,
        },
        {
          $set: {
            items: [],
          },
        },
        {
          session,
        },
      );
      await Audit.create(
        [
          {
            actor: String(customer),
            action: "order.created",
            target: String(o._id),
          },
        ],
        {
          session,
        },
      );
      await Outbox.create(
        [
          {
            key: "order-" + o._id,
            customer,
            text: `Order ${o.reference} saved. Pending staff confirmation. COD PKR ${(o.total / 100).toFixed(2)}. Payment not collected.`,
          },
        ],
        {
          session,
        },
      );
      result = o;
    });
  } catch (e) {
    if (e.code === 11000) {
      const o = await Order.findOne({
        customer,
        idempotencyKey,
        quote: quoteId,
      });
      if (o) return o;
    }
    throw e;
  }
  return result;
}
export async function changeStatus(orderId, status, actor, expected) {
  let result;
  await mongoose.connection.transaction(async (session) => {
    const o = await Order.findById(orderId).session(session);
    if (!o) fail(404, "Order not found");
    if (expected && o.status !== expected) fail(409, "Order changed; reload");
    if (!transitions[o.status]?.includes(status))
      fail(409, "Invalid order status transition");
    if (status === "Cancelled") {
      const r = await Reservation.findOneAndUpdate(
        {
          order: o._id,
          state: "active",
        },
        {
          $set: {
            state: "released",
          },
        },
        {
          session,
          new: true,
        },
      );
      if (r) {
        for (const i of r.items) {
          await Product.updateOne(
            {
              "variants._id": i.variant,
            },
            {
              $inc: {
                "variants.$.stock": i.quantity,
              },
            },
            {
              session,
            },
          );
          await Movement.create(
            [
              {
                variant: i.variant,
                order: o._id,
                delta: i.quantity,
                reason: "cancel",
                actor,
              },
            ],
            {
              session,
            },
          );
        }
      }
    }
    if (status === "Shipped")
      await Reservation.updateOne(
        {
          order: o._id,
          state: "active",
        },
        {
          $set: {
            state: "consumed",
          },
        },
        {
          session,
        },
      );
    o.status = status;
    o.history.push({
      status,
      at: new Date(),
      actor,
    });
    await o.save({
      session,
    });
    await Audit.create(
      [
        {
          actor,
          action: "order.status",
          target: String(o._id),
          detail: status,
        },
      ],
      {
        session,
      },
    );
    result = o;
  });
  return result;
}
export async function expireReservations() {
  const list = await Order.find({
    status: "Pending Confirmation",
    reservationExpires: {
      $lt: new Date(),
    },
  }).limit(100);
  for (const o of list) {
    try {
      await changeStatus(
        o._id,
        "Cancelled",
        "expiry-worker",
        "Pending Confirmation",
      );
    } catch (e) {
      if (e.status !== 409) throw e;
    }
  }
}
