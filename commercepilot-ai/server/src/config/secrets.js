import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
function key() {
  const value = process.env.MFA_ENCRYPTION_KEY;
  if (!/^[a-f\d]{64}$/i.test(value || ""))
    throw new Error(
      "MFA_ENCRYPTION_KEY must be 32 random bytes encoded as hex",
    );
  return Buffer.from(value, "hex");
}
export function encryptSecret(text) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((b) => b.toString("hex"))
    .join(".");
}
export function decryptSecret(text) {
  const [iv, tag, data] = text.split(".").map((s) => Buffer.from(s, "hex"));
  const cipher = createDecipheriv("aes-256-gcm", key(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8");
}
