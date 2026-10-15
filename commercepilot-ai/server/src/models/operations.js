import { model, Schema, id } from "./schema.js";
export const Audit = model(
  "AuditLog",
  {
    actor: String,
    action: String,
    target: String,
    detail: String,
  },
  [
    [
      {
        createdAt: -1,
      },
      {},
    ],
  ],
);
export const Settings = model("BusinessSettings", {
  key: {
    type: String,
    unique: true,
  },
  value: Schema.Types.Mixed,
});
export const Webhook = model("WebhookEvent", {
  key: {
    type: String,
    unique: true,
  },
  payload: Schema.Types.Mixed,
  state: {
    type: String,
    default: "pending",
  },
  error: String,
});
export const Outbox = model("Outbox", {
  key: {
    type: String,
    unique: true,
  },
  customer: id,
  conversation: id,
  text: String,
  state: {
    type: String,
    default: "pending",
  },
  externalId: String,
  error: String,
});
export const Usage = model("AIUsageLog", {
  customer: id,
  tokens: Number,
  model: String,
  outcome: String,
});
