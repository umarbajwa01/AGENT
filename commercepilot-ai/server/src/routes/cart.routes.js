import { z } from "zod";
import { customer } from "../middleware/auth.js";
import { oid } from "../validators/index.js";
import { cartView, setCart } from "../services/orders/orderService.js";
export function registerCartRoutes(api) {
  api.get("/cart", customer, async (req, res) =>
    res.json(await cartView(req.customer)),
  );
  for (const method of ["post", "patch"])
    api[method](
      "/cart/items" + (method === "patch" ? "/:id" : ""),
      customer,
      async (req, res) => {
        const a = z
          .object({
            variant: oid.optional(),
            quantity: z.number().int().min(0).max(50),
          })
          .strict()
          .parse(req.body);
        res.json(
          await setCart(
            req.customer,
            oid.parse(req.params.id || a.variant),
            a.quantity,
          ),
        );
      },
    );
  api.delete("/cart/items/:id", customer, async (req, res) =>
    res.json(await setCart(req.customer, oid.parse(req.params.id), 0)),
  );
}
