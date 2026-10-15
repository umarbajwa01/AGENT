import pino from "pino";
export const log = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["password", "token", "phone", "address", "cookie", "authorization"],
});
