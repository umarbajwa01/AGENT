import { z } from "zod";
export const oid = z.string().regex(/^[a-f\d]{24}$/i);
export const money = z.number().int().min(0).max(1000000000);
export const addressSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().regex(/^\+?[\d]{10,15}$/),
    city: z.string().trim().min(2).max(80),
    address: z.string().trim().min(8).max(300),
  })
  .strict();
export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    description: z.string().max(2000).default(""),
    category: z.string().max(80),
    image: z
      .union([z.literal(""), z.url().refine((s) => s.startsWith("https://"))])
      .default(""),
    active: z.boolean().default(true),
    variants: z
      .array(
        z
          .object({
            sku: z.string().regex(/^[A-Za-z0-9_-]{2,60}$/),
            label: z.string().max(100),
            price: money,
            stock: z.number().int().min(0).max(1000000),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .refine(
    (v) => new Set(v.variants.map((x) => x.sku)).size === v.variants.length,
    "Duplicate SKU",
  );
