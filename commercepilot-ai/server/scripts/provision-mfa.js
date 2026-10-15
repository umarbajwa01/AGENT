import mongoose from "mongoose";
import * as OTPAuth from "otpauth";
import { createInterface } from "node:readline/promises";
import { User } from "../src/models/identity.js";
import { encryptSecret } from "../src/config/secrets.js";
const email = process.argv[2];
if (!email)
  throw new Error(
    "Usage: node --env-file=.env server/scripts/provision-mfa.js owner@example.com",
  );
await mongoose.connect(process.env.MONGODB_URI);
const user = await User.findOne({
  email: email.toLowerCase(),
});
if (!user) throw new Error("Account not found");
const totp = new OTPAuth.TOTP({
  issuer: "CommercePilot AI",
  label: email,
  secret: new OTPAuth.Secret({
    size: 20,
  }),
});
console.log(
  "Enter this enrollment secret directly into your authenticator. Do not save it in logs or share it.",
);
console.log(totp.secret.base32);
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});
const code = await rl.question("Current authenticator code: ");
rl.close();
if (
  totp.validate({
    token: code.trim(),
    window: 1,
  }) === null
)
  throw new Error("Enrollment code invalid; no change saved");
user.totpSecret = encryptSecret(totp.secret.base32);
await user.save();
console.log("MFA enrolled. Secret is encrypted in MongoDB.");
await mongoose.disconnect();
