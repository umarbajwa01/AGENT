import mongoose from "mongoose";
import { createApp } from "./app.js";
import { log } from "./config/logger.js";
import { initialize } from "./models/initialize.js";
if (!process.env.MONGODB_URI)
  throw new Error("Set MONGODB_URI in .env (replica set required)");
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.APP_ORIGINS?.startsWith("https://") ||
    process.env.ENABLE_SIMULATOR === "true")
)
  throw new Error("Production requires HTTPS origins and disabled simulator");
await mongoose.connect(process.env.MONGODB_URI);
await initialize();
const app = createApp();
const server = app.listen(Number(process.env.PORT || 4000), () =>
  log.info("CommercePilot API listening"),
);
process.on("SIGTERM", () =>
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  }),
);
