import { model, Schema, money } from "./schema.js";
export const Category = model("Category", {
  name: {
    type: String,
    unique: true,
  },
});
export const variant = new Schema({
  sku: {
    type: String,
    required: true,
  },
  label: String,
  price: money,
  stock: {
    type: Number,
    min: 0,
    validate: Number.isSafeInteger,
  },
  active: {
    type: Boolean,
    default: true,
  },
});
export const Product = model(
  "Product",
  {
    name: String,
    description: String,
    category: String,
    image: String,
    active: {
      type: Boolean,
      default: true,
    },
    variants: [variant],
  },
  [
    [
      {
        "variants.sku": 1,
      },
      {
        unique: true,
      },
    ],
    [
      {
        name: "text",
        description: "text",
      },
      {},
    ],
  ],
);
export const Zone = model("DeliveryZone", {
  name: {
    type: String,
    unique: true,
  },
  cities: [String],
  fee: money,
  active: {
    type: Boolean,
    default: true,
  },
});
export const Coupon = model("Coupon", {
  code: {
    type: String,
    unique: true,
  },
  amount: money,
  minimum: money,
  maxUses: Number,
  used: {
    type: Number,
    default: 0,
  },
  expires: Date,
  active: {
    type: Boolean,
    default: true,
  },
});
