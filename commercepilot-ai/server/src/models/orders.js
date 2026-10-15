import { model, id, Schema } from "./schema.js";
export const Cart = model("Cart", {
  customer: {
    type: id,
    unique: true,
  },
  items: [
    {
      variant: id,
      quantity: Number,
    },
  ],
});
export const item = new Schema(
  {
    variant: id,
    sku: String,
    name: String,
    label: String,
    price: Number,
    quantity: Number,
  },
  {
    _id: false,
  },
);
export const Quote = model("Quote", {
  customer: id,
  items: [item],
  address: {
    name: String,
    phone: String,
    city: String,
    address: String,
  },
  subtotal: Number,
  shipping: Number,
  discount: Number,
  total: Number,
  currency: {
    type: String,
    default: "PKR",
  },
  coupon: id,
  nonceHash: String,
  expires: Date,
  used: {
    type: Boolean,
    default: false,
  },
});
export const Order = model(
  "Order",
  {
    customer: id,
    reference: {
      type: String,
      unique: true,
    },
    idempotencyKey: String,
    quote: {
      type: id,
      unique: true,
    },
    items: [item],
    address: {
      name: String,
      phone: String,
      city: String,
      address: String,
    },
    subtotal: Number,
    shipping: Number,
    discount: Number,
    total: Number,
    currency: String,
    status: {
      type: String,
      default: "Pending Confirmation",
    },
    paymentStatus: {
      type: String,
      default: "Not Collected",
    },
    history: [
      {
        status: String,
        at: Date,
        actor: String,
      },
    ],
    reservationExpires: Date,
  },
  [
    [
      {
        customer: 1,
        idempotencyKey: 1,
      },
      {
        unique: true,
      },
    ],
    [
      {
        createdAt: -1,
      },
      {},
    ],
  ],
);
export const Reservation = model("InventoryReservation", {
  order: {
    type: id,
    unique: true,
  },
  state: String,
  expires: Date,
  items: [
    {
      variant: id,
      quantity: Number,
    },
  ],
});
export const Movement = model("InventoryMovement", {
  variant: id,
  order: id,
  delta: Number,
  reason: String,
  actor: String,
});
