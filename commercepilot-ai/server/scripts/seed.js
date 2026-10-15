import mongoose from "mongoose";
import argon2 from "argon2";
import { User } from "../src/models/identity.js";
import { Product, Category, Zone } from "../src/models/catalog.js";
import { Settings } from "../src/models/operations.js";
import { initialize } from "../src/models/initialize.js";
if (process.env.NODE_ENV === "production")
  throw new Error("Development seed is disabled in production");
if (
  !process.env.ADMIN_EMAIL ||
  !process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD.length < 14
)
  throw new Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (14+ characters) in .env",
  );
await mongoose.connect(process.env.MONGODB_URI);
await initialize();
await User.updateOne(
  {
    email: process.env.ADMIN_EMAIL.toLowerCase(),
  },
  {
    $setOnInsert: {
      name: "Store owner",
      role: "ADMIN",
      passwordHash: await argon2.hash(process.env.ADMIN_PASSWORD, {
        type: argon2.argon2id,
      }),
    },
  },
  {
    upsert: true,
  },
);
const rows = [
  ["Everyday cotton tee", "Apparel", "TEE", 149900, "Black / Medium", 24],
  ["Canvas carryall", "Accessories", "BAG", 229900, "Natural", 16],
  ["Stoneware cup", "Home", "CUP", 119900, "Ivory", 4],
  ["Essential hoodie", "Apparel", "HOOD", 389900, "Charcoal / Large", 12],
  ["Desk notebook", "Stationery", "NOTE", 79900, "Olive", 36],
  ["Steel water bottle", "Accessories", "BOTTLE", 189900, "Graphite", 8],
];
for (const [name, category, sku, price, label, stock] of rows) {
  await Category.updateOne(
    {
      name: category,
    },
    {
      $setOnInsert: {
        name: category,
      },
    },
    {
      upsert: true,
    },
  );
  await Product.updateOne(
    {
      name,
    },
    {
      $setOnInsert: {
        name,
        description:
          "Development sample product. Replace with your store catalog.",
        category,
        image: "",
        variants: [
          {
            sku: sku + "-01",
            label,
            price,
            stock,
          },
        ],
      },
    },
    {
      upsert: true,
    },
  );
}
await Zone.updateOne(
  {
    name: "Standard Pakistan",
  },
  {
    $setOnInsert: {
      name: "Standard Pakistan",
      cities: [
        "lahore",
        "karachi",
        "islamabad",
        "rawalpindi",
        "sialkot",
        "pasrur",
      ],
      fee: 20000,
    },
  },
  {
    upsert: true,
  },
);
for (const key of [
  "privacy",
  "terms",
  "shipping",
  "returns",
  "cancellation",
  "cod",
  "support",
])
  await Settings.updateOne(
    {
      key: "policy." + key,
    },
    {
      $setOnInsert: {
        value: {
          title: key[0].toUpperCase() + key.slice(1) + " policy — DRAFT",
          text: "Draft requiring business and legal review. Configure your store contact, delivery timelines, eligibility, customer rights and retention periods before publishing.",
          published: false,
        },
      },
    },
    {
      upsert: true,
    },
  );
console.log(
  "Development catalog and owner created. No fake sales or conversations were seeded.",
);
await mongoose.disconnect();
