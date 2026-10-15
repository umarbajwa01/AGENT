import { test, expect } from "@playwright/test";
test("customer saves a COD request and admin confirms it", async ({
  browser,
}) => {
  test.skip(
    !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
    "Run against a seeded isolated development database with owner credentials.",
  );
  const customer = await browser.newContext();
  const page = await customer.newPage();
  await page.goto("/simulator");
  await expect(
    page.getByRole("heading", {
      name: "Everyday essentials, thoughtfully chosen.",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Add Everyday cotton tee/ })
    .first()
    .click();
  await expect(page.getByText("Subtotal").locator("..")).not.toContainText(
    "PKR 0.00",
  );
  await page.getByRole("button", { name: "Review COD checkout" }).click();
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Phone number").fill("03001234567");
  await page.getByLabel("Delivery city").fill("Lahore");
  await page.getByLabel("Complete address").fill("123 Example Road");
  await page.getByRole("button", { name: "Get final quote" }).click();
  await expect(page.getByText("Total cash on delivery")).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm COD order", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Pending Confirmation", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Not Collected", { exact: true }),
  ).toBeVisible();
  const reference = await dialog.locator("h2").last().textContent();
  const admin = await browser.newContext();
  const staff = await admin.newPage();
  await staff.goto("/login");
  await staff.getByLabel("Work email").fill(process.env.ADMIN_EMAIL);
  await staff
    .getByLabel("Password", { exact: true })
    .fill(process.env.ADMIN_PASSWORD);
  await staff.getByRole("button", { name: "Sign in", exact: true }).click();
  await staff.getByRole("link", { name: "Orders", exact: true }).click();
  const row = staff.getByRole("row").filter({ hasText: reference });
  await row.getByRole("button", { name: "Review" }).click();
  staff.once("dialog", (d) => d.accept());
  await staff.getByRole("button", { name: "Confirmed", exact: true }).click();
  await expect(
    staff.getByRole("dialog").getByText("Confirmed", { exact: true }).first(),
  ).toBeVisible();
  await customer.close();
  await admin.close();
});
