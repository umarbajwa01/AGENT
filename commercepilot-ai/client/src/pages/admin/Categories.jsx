import { useState } from "react";
import { X, Layers } from "lucide-react";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { Field } from "../../components/common/Field.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
import { State } from "../../components/common/QueryState.jsx";
export function Categories() {
  const q = useData("/categories"),
    m = useAction(),
    [name, setName] = useState("");
  return (
    <>
      <PageHead
        title="Categories"
        description="Organize the catalog so customers can find the right product."
      />
      <section className="card pad">
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await m.mutateAsync({
                path: "/categories",
                body: {
                  name,
                },
              });
              setName("");
            } catch {}
          }}
        >
          <Field label="New category">
            <input
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <button className="primary" disabled={m.isPending}>
            Add category
          </button>
        </form>
        <ErrorBox error={m.error} />
        <State query={q}>
          {(d) => (
            <div className="category-grid">
              {d.map((c) => (
                <div className="category-item" key={c._id}>
                  <Layers />
                  <b>{c.name}</b>
                  <button
                    aria-label={"Delete " + c.name}
                    onClick={() => {
                      if (confirm("Remove this category label?"))
                        m.mutate({
                          path: "/categories/" + c._id,
                          method: "DELETE",
                        });
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </State>
      </section>
    </>
  );
}
