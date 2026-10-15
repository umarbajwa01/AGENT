import { describe, it, expect } from "vitest";
import { createHmac, randomBytes } from "node:crypto";
import { signatureValid } from "../src/utils/crypto.js";
import { productSchema, addressSchema } from "../src/validators/index.js";
import { pageQuery } from "../src/utils/pagination.js";
import { encryptSecret, decryptSecret } from "../src/config/secrets.js";
import { withinWindow } from "../src/services/whatsapp/whatsappService.js";
import { executeTool } from "../src/services/ai/assistantService.js";
import { transitions } from "../src/services/orders/orderService.js";
it("accepts only authentic raw webhook bytes", () => {
  const b = Buffer.from('{"a":1}'),
    secret = "test-secret";
  const sig = "sha256=" + createHmac("sha256", secret).update(b).digest("hex");
  expect(signatureValid(b, sig, secret)).toBe(true);
  expect(signatureValid(Buffer.from('{"a":2}'), sig, secret)).toBe(false);
  expect(signatureValid(b, "sha256=00", secret)).toBe(false);
  expect(signatureValid(b, sig, "")).toBe(false);
});
it("rejects duplicate SKUs, decimal minor units and unknown fields", () => {
  const p = {
    name: "Tee",
    category: "Apparel",
    variants: [
      {
        sku: "AA",
        label: "M",
        price: 120000,
        stock: 3,
      },
    ],
  };
  expect(productSchema.safeParse(p).success).toBe(true);
  expect(
    productSchema.safeParse({
      ...p,
      total: 1,
    }).success,
  ).toBe(false);
  expect(
    productSchema.safeParse({
      ...p,
      variants: [...p.variants, ...p.variants],
    }).success,
  ).toBe(false);
  expect(
    productSchema.safeParse({
      ...p,
      variants: [
        {
          ...p.variants[0],
          price: 1.1,
        },
      ],
    }).success,
  ).toBe(false);
});
it("rejects unsafe image protocols and invalid phone", () => {
  expect(
    productSchema.safeParse({
      name: "Test",
      category: "c",
      image: "javascript:alert(1)",
      variants: [
        {
          sku: "AA",
          label: "M",
          price: 1,
          stock: 1,
        },
      ],
    }).success,
  ).toBe(false);
  expect(
    addressSchema.safeParse({
      name: "Test",
      phone: "bad",
      city: "Lahore",
      address: "123 main road",
    }).success,
  ).toBe(false);
});
it("bounds pagination", () => {
  expect(
    pageQuery({
      page: -5,
      limit: 9999,
    }),
  ).toEqual({
    page: 1,
    limit: 100,
  });
});
it("enforces the 24-hour outbound boundary", () => {
  expect(withinWindow(new Date(1), 86400000)).toBe(true);
  expect(withinWindow(new Date(0), 86400000)).toBe(false);
  expect(withinWindow(null)).toBe(false);
});
it("rejects model tools before any database access", async () => {
  await expect(
    executeTool(
      "runCode",
      {
        code: "deleteAll()",
      },
      "x",
    ),
  ).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    executeTool(
      "createOrderAfterConfirmation",
      {
        confirmed: true,
      },
      "x",
    ),
  ).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    executeTool(
      "checkStock",
      {
        variant: "not-an-id",
      },
      "x",
    ),
  ).rejects.toThrow();
});
it("terminal and delivery states cannot silently restore stock or collect payment", () => {
  expect(transitions.Cancelled).toEqual([]);
  expect(transitions.Returned).toEqual([]);
  expect(transitions.Shipped).not.toContain("Cancelled");
  expect(transitions.Delivered).toEqual(["Returned"]);
});
it("encrypts MFA secrets and rejects tampering", () => {
  process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString("hex");
  const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
  expect(encrypted).not.toContain("JBSWY3DPEHPK3PXP");
  expect(decryptSecret(encrypted)).toBe("JBSWY3DPEHPK3PXP");
  const parts = encrypted.split(".");
  parts[2] = "ff" + parts[2].slice(2);
  expect(() => decryptSecret(parts.join("."))).toThrow();
});
