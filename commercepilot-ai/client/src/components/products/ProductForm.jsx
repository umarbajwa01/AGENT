import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { useAction } from "../../hooks/useApi.js";
import { Modal } from "../common/Modal.jsx";
import { Field } from "../common/Field.jsx";
import { ErrorBox } from "../common/ErrorBox.jsx";
export function ProductForm({ onClose }) {
  const m = useAction(),
    [variants, setVariants] = useState([
      {
        sku: "",
        label: "",
        price: "",
        stock: 0,
      },
    ]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(2),
        category: z.string().min(1),
        description: z.string(),
        image: z.string(),
      }),
    ),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      image: "",
    },
  });
  return (
    <Modal title="Add a product" onClose={onClose}>
      <form
        className="modal-body"
        onSubmit={handleSubmit(async (data) => {
          try {
            await m.mutateAsync({
              path: "/products",
              body: {
                ...data,
                variants: variants.map((v) => ({
                  ...v,
                  price: Math.round(Number(v.price) * 100),
                  stock: Number(v.stock),
                })),
              },
            });
            onClose();
          } catch {}
        })}
      >
        {["name", "category", "description", "image"].map((k) => (
          <Field
            key={k}
            label={
              k === "image"
                ? "Product image URL (optional)"
                : k === "name"
                  ? "Product name"
                  : k === "description"
                    ? "Product description"
                    : "Category"
            }
          >
            <input {...register(k)} />
            {errors[k] && <span className="error">{errors[k].message}</span>}
          </Field>
        ))}
        <h3>Variants</h3>
        {variants.map((v, i) => (
          <div className="variant-row" key={i}>
            {["sku", "label", "price", "stock"].map((k) => (
              <Field
                label={
                  k === "price"
                    ? "Unit price (PKR)"
                    : k === "sku"
                      ? "SKU"
                      : k === "label"
                        ? "Variant (e.g. Black / M)"
                        : "Stock quantity"
                }
                key={k}
              >
                <input
                  required
                  type={["price", "stock"].includes(k) ? "number" : "text"}
                  min="0"
                  step={k === "price" ? "0.01" : "1"}
                  value={v[k]}
                  onChange={(e) =>
                    setVariants(
                      variants.map((x, n) =>
                        n === i
                          ? {
                              ...x,
                              [k]: e.target.value,
                            }
                          : x,
                      ),
                    )
                  }
                />
              </Field>
            ))}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setVariants([
              ...variants,
              {
                sku: "",
                label: "",
                price: "",
                stock: 0,
              },
            ])
          }
        >
          <Plus size={16} /> Add variant
        </button>
        <ErrorBox error={m.error} />
        <button className="primary full" disabled={m.isPending}>
          {m.isPending ? "Saving…" : "Create product"}
        </button>
      </form>
    </Modal>
  );
}
