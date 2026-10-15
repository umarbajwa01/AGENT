import { model, id } from "./schema.js";
export const Conversation = model("Conversation", {
  customer: {
    type: id,
    unique: true,
  },
  channel: String,
  mode: {
    type: String,
    default: "ai",
  },
  assignedTo: id,
  lastInbound: Date,
});
export const Message = model(
  "Message",
  {
    conversation: id,
    role: String,
    text: String,
    channel: String,
    externalId: String,
    status: String,
  },
  [
    [
      {
        conversation: 1,
        createdAt: 1,
      },
      {},
    ],
  ],
);
export const Ticket = model("SupportTicket", {
  customer: id,
  conversation: id,
  reason: String,
  status: {
    type: String,
    default: "open",
  },
});
