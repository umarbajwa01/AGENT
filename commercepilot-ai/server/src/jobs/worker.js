import mongoose from "mongoose";
import IORedis from "ioredis";
import { Queue, Worker } from "bullmq";
import { Webhook, Outbox } from "../models/operations.js";
import {
  processInbound,
  sendOutbound,
} from "../services/whatsapp/whatsappService.js";
import { expireReservations } from "../services/orders/orderService.js";
await mongoose.connect(process.env.MONGODB_URI);
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
const queue = new Queue("commercepilot", {
  connection,
});
new Worker(
  "commercepilot",
  async (job) => {
    if (job.name === "inbound") await processInbound(job.data.id);
    else await sendOutbound(job.data.id);
  },
  {
    connection,
    concurrency: 1,
  },
);
async function dispatch() {
  await expireReservations();
  for (const [M, type] of [
    [Webhook, "inbound"],
    [Outbox, "outbound"],
  ]) {
    const rows = await M.find({
      state: "pending",
    }).limit(100);
    for (const row of rows)
      await queue.add(
        type,
        {
          id: String(row._id),
        },
        {
          jobId: `${type}-${row._id}`,
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: 1000,
        },
      );
  }
}
await dispatch();
setInterval(
  () =>
    dispatch().catch(() =>
      console.error("Dispatcher failed; durable records will retry"),
    ),
  10000,
);
