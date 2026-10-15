import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import mongoose from "mongoose";
import { identify, csrf } from "./middleware/auth.js";
import { fail } from "./utils/errors.js";
import { signatureValid } from "./utils/crypto.js";
import { ingest } from "./services/whatsapp/whatsappService.js";
import { registerAuthRoutes } from "./routes/auth.routes.js";
import { registerProductsRoutes } from "./routes/products.routes.js";
import { registerCategoriesRoutes } from "./routes/categories.routes.js";
import { registerCartRoutes } from "./routes/cart.routes.js";
import { registerOrdersRoutes } from "./routes/orders.routes.js";
import { registerDeliveryRoutes } from "./routes/delivery.routes.js";
import { registerAssistantRoutes } from "./routes/assistant.routes.js";
import { registerCustomersRoutes } from "./routes/customers.routes.js";
import { registerConversationsRoutes } from "./routes/conversations.routes.js";
import { registerStaffRoutes } from "./routes/staff.routes.js";
import { registerCouponsRoutes } from "./routes/coupons.routes.js";
import { registerSettingsRoutes } from "./routes/settings.routes.js";
import { registerAnalyticsRoutes } from "./routes/analytics.routes.js";
import { log } from "./config/logger.js";
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  const origins = (process.env.APP_ORIGINS || "http://localhost:5173").split(
    ",",
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || origins.includes(origin)),
      credentials: true,
    }),
  );
  app.use((req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") &&
      !origins.includes(req.get("origin"))
    )
      return res.status(403).json({
        error: "Origin rejected",
      });
    next();
  });
  app.use(
    rateLimit({
      windowMs: 60000,
      limit: 200,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.get("/api/v1/webhooks/whatsapp", (req, res) => {
    if (
      process.env.META_VERIFY_TOKEN &&
      req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === process.env.META_VERIFY_TOKEN
    )
      return res.type("text").send(req.query["hub.challenge"]);
    res.sendStatus(403);
  });
  app.post(
    "/api/v1/webhooks/whatsapp",
    express.raw({
      type: "application/json",
      limit: "256kb",
    }),
    async (req, res) => {
      if (
        !signatureValid(
          req.body,
          req.get("x-hub-signature-256"),
          process.env.META_APP_SECRET,
        )
      )
        fail(401, "Invalid webhook signature");
      let body;
      try {
        body = JSON.parse(req.body.toString());
      } catch {
        fail(400, "Invalid JSON");
      }
      await ingest(body);
      res.json({
        received: true,
      });
    },
  );
  app.use(
    express.json({
      limit: "256kb",
    }),
    cookieParser(),
  );
  app.get("/health/live", (req, res) =>
    res.json({
      ok: true,
    }),
  );
  app.get("/health/ready", (req, res) =>
    res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
      database: mongoose.connection.readyState === 1,
    }),
  );
  const api = express.Router();
  app.use("/api/v1", api);
  api.use(identify, csrf);
  registerAuthRoutes(api);
  registerProductsRoutes(api);
  registerCategoriesRoutes(api);
  registerCartRoutes(api);
  registerOrdersRoutes(api);
  registerDeliveryRoutes(api);
  registerAssistantRoutes(api);
  registerCustomersRoutes(api);
  registerConversationsRoutes(api);
  registerStaffRoutes(api);
  registerCouponsRoutes(api);
  registerSettingsRoutes(api);
  registerAnalyticsRoutes(api);
  api.use((req, res) =>
    res.status(404).json({
      error: "Endpoint not found",
    }),
  );
  app.use((err, req, res, next) => {
    const status =
      err instanceof z.ZodError
        ? 400
        : err.code === 11000
          ? 409
          : err.status || 500;
    if (status >= 500)
      log.error(
        {
          name: err.name,
          code: err.code,
        },
        "Request failed",
      );
    res.status(status).json({
      error:
        status === 500
          ? "Internal error; please retry"
          : err instanceof z.ZodError
            ? "Invalid request fields"
            : err.code === 11000
              ? "A unique value already exists"
              : err.message,
      ...(err instanceof z.ZodError
        ? {
            fields: err.issues.map((i) => ({
              path: i.path.join("."),
              message: i.message,
            })),
          }
        : {}),
    });
  });
  return app;
}
