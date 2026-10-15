import { Webhook, Outbox } from "../../models/operations.js";
import { Customer } from "../../models/identity.js";
import { Conversation, Message } from "../../models/conversations.js";
import { fail } from "../../utils/errors.js";
import { chat } from "../ai/assistantService.js";
export async function ingest(payload) {
  if (
    payload.object !== "whatsapp_business_account" ||
    !Array.isArray(payload.entry)
  )
    fail(400, "Invalid webhook");
  let accepted = 0;
  for (const entry of payload.entry) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      for (const message of v.messages || []) {
        if (typeof message.id !== "string" || typeof message.from !== "string")
          fail(400, "Invalid message event");
        await Webhook.updateOne(
          {
            key: message.id,
          },
          {
            $setOnInsert: {
              payload: message,
              state: "pending",
            },
          },
          {
            upsert: true,
          },
        );
        accepted++;
      }
      for (const s of v.statuses || []) {
        if (
          typeof s.id === "string" &&
          ["sent", "delivered", "read", "failed"].includes(s.status)
        )
          await Outbox.updateOne(
            {
              externalId: s.id,
            },
            {
              $set: {
                state: s.status,
              },
            },
          );
      }
    }
  }
  return accepted;
}
export async function processInbound(eventId) {
  const event = await Webhook.findById(eventId);
  if (!event || event.state === "done") return;
  const m = event.payload;
  const c = await Customer.findOneAndUpdate(
    {
      phone: m.from,
      channel: "whatsapp",
    },
    {
      $setOnInsert: {
        name: "WhatsApp customer",
      },
    },
    {
      upsert: true,
      new: true,
    },
  );
  const reply = await chat(
    c._id,
    m.text?.body || "Unsupported message type; please send text.",
    "whatsapp",
  );
  if (reply.mode !== "human")
    await Outbox.updateOne(
      {
        key: "reply-" + m.id,
      },
      {
        $setOnInsert: {
          customer: c._id,
          text: reply.text,
        },
      },
      {
        upsert: true,
      },
    );
  await Webhook.updateOne(
    {
      _id: event._id,
    },
    {
      $set: {
        state: "done",
      },
    },
  );
}
export function withinWindow(lastInbound, now = Date.now()) {
  return !!lastInbound && now - new Date(lastInbound).getTime() < 86400000;
}
export async function sendOutbound(id) {
  const item = await Outbox.findById(id);
  if (!item || item.state !== "pending") return;
  const customer = await Customer.findById(item.customer);
  if (!customer || customer.channel !== "whatsapp") {
    await Outbox.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          state: "simulated",
        },
      },
    );
    return;
  }
  const conversation = await Conversation.findOne({
    customer: customer._id,
  });
  if (!withinWindow(conversation?.lastInbound)) {
    await Outbox.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          state: "window-blocked",
          error: "Approved template required outside customer-service window",
        },
      },
    );
    return;
  }
  if (
    !process.env.META_TOKEN ||
    !process.env.META_PHONE_ID ||
    !/^v\d+\.\d+$/.test(process.env.META_API_VERSION || "")
  )
    throw new Error("Meta configuration missing");
  const response = await fetch(
    `https://graph.facebook.com/${process.env.META_API_VERSION}/${process.env.META_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.META_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: customer.phone,
        type: "text",
        text: {
          body: item.text,
        },
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new Error("Meta send rejected");
  const result = await response.json();
  await Outbox.updateOne(
    {
      _id: id,
    },
    {
      $set: {
        state: "sent",
        externalId: result.messages?.[0]?.id,
      },
    },
  );
}
