import { useState } from "react";
import { useAction } from "../../hooks/useApi.js";
import { Field } from "../common/Field.jsx";
import { ErrorBox } from "../common/ErrorBox.jsx";
export function VariantEditor({ product, variant }) {
  const m = useAction(),
    [price, setPrice] = useState(variant.price / 100),
    [delta, setDelta] = useState(0),
    [reason, setReason] = useState("");
  return (
    <form
      className="variant-edit"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await m.mutateAsync({
            path: `/products/${product}/variants/${variant._id}`,
            method: "PATCH",
            body: {
              price: Math.round(Number(price) * 100),
              delta: Number(delta),
              reason,
            },
          });
          setDelta(0);
          setReason("");
        } catch {}
      }}
    >
      <b>
        {variant.label} · {variant.sku}
      </b>
      <div className="two-col">
        <Field label="Unit price (PKR)">
          <input
            type="number"
            min="0"
            step=".01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field label="Stock adjustment (+ / −)">
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Adjustment reason">
        <input
          required
          minLength={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <button disabled={m.isPending}>Apply adjustment</button>
      {m.isSuccess && <span role="status"> Saved</span>}
      <ErrorBox error={m.error} />
    </form>
  );
}
