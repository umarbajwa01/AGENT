import { model, id } from "./schema.js";
export const User = model("User", {
  email: {
    type: String,
    unique: true,
  },
  name: String,
  passwordHash: String,
  role: {
    type: String,
    enum: ["ADMIN", "SALES_AGENT"],
  },
  active: {
    type: Boolean,
    default: true,
  },
  totpSecret: String,
});
export const Session = model(
  "Session",
  {
    hash: {
      type: String,
      unique: true,
    },
    user: id,
    customer: id,
    csrf: String,
    expires: Date,
  },
  [
    [
      {
        expires: 1,
      },
      {
        expireAfterSeconds: 0,
      },
    ],
  ],
);
export const Customer = model(
  "Customer",
  {
    name: String,
    phone: String,
    channel: String,
    marketingOptIn: {
      type: Boolean,
      default: false,
    },
    optOutAt: Date,
  },
  [
    [
      {
        phone: 1,
        channel: 1,
      },
      {
        unique: true,
        partialFilterExpression: {
          phone: {
            $type: "string",
          },
        },
      },
    ],
  ],
);
