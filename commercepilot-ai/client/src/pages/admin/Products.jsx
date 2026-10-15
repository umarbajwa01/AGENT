import { useState } from "react";
import { Package, Plus, Search, Download } from "lucide-react";
import { money } from "../../services/api.js";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { Table } from "../../components/common/Table.jsx";
import { Status } from "../../components/common/Status.jsx";
import { Pager } from "../../components/common/Pagination.jsx";
import { ProductForm } from "../../components/products/ProductForm.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Field } from "../../components/common/Field.jsx";
import { VariantEditor } from "../../components/products/VariantEditor.jsx";
export function Products() {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [add, setAdd] = useState(false),
    [edit, setEdit] = useState(null),
    [importing, setImport] = useState(false),
    [json, setJson] = useState("");
  const q = useData(`/products?page=${page}&q=${encodeURIComponent(search)}`),
    m = useAction();
  return (
    <>
      <PageHead
        title="Product catalog"
        description="Manage product details, pricing and stock from one catalog."
      >
        <button onClick={() => setImport(true)}>
          <Download size={17} /> Import JSON
        </button>
        <button className="primary" onClick={() => setAdd(true)}>
          <Plus size={17} /> Add product
        </button>
      </PageHead>
      <section className="card">
        <div className="toolbar">
          <label className="search">
            <Search size={18} />
            <input
              aria-label="Search products"
              placeholder="Search products…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <span>Prices in PKR</span>
        </div>
        <ErrorBox error={m.error} />
        <State query={q}>
          {(d) => (
            <>
              {d.items.length ? (
                <Table
                  headers={[
                    "Product",
                    "Category",
                    "Variants / SKU",
                    "Price from",
                    "Available stock",
                    "Status",
                    "",
                  ]}
                >
                  {d.items.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="product-title">
                          <div className="product-thumb">
                            {p.image ? (
                              <img src={p.image} alt="" />
                            ) : (
                              <Package size={22} />
                            )}
                          </div>
                          <b>{p.name}</b>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        {p.variants.length} variants
                        <small>{p.variants[0]?.sku}</small>
                      </td>
                      <td>
                        {money(Math.min(...p.variants.map((v) => v.price)))}
                      </td>
                      <td>
                        {p.variants.reduce((s, v) => s + v.stock, 0)} units
                      </td>
                      <td>
                        <Status>{p.active ? "active" : "Archived"}</Status>
                      </td>
                      <td>
                        <button onClick={() => setEdit(p)}>Manage</button>
                      </td>
                    </tr>
                  ))}
                </Table>
              ) : (
                <div className="empty">
                  No products found. Add your first product.
                </div>
              )}
              <Pager data={d} page={page} setPage={setPage} />
            </>
          )}
        </State>
      </section>
      {add && <ProductForm onClose={() => setAdd(false)} />}
      {edit && (
        <Modal title="Manage product" onClose={() => setEdit(null)}>
          <div className="modal-body">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await m.mutateAsync({
                    path: "/products/" + edit._id,
                    method: "PATCH",
                    body: {
                      name: edit.name,
                      description: edit.description || "",
                      category: edit.category,
                      image: edit.image || "",
                      active: edit.active,
                    },
                  });
                  setEdit(null);
                } catch {}
              }}
            >
              {["name", "category", "description", "image"].map((k) => (
                <Field key={k} label={k}>
                  <input
                    value={edit[k] || ""}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        [k]: e.target.value,
                      })
                    }
                  />
                </Field>
              ))}
              <button className="primary" disabled={m.isPending}>
                Save details
              </button>
            </form>
            <h3>Variants & inventory</h3>
            {edit.variants.map((v) => (
              <VariantEditor key={v._id} product={edit._id} variant={v} />
            ))}
            <ErrorBox error={m.error} />
            <button
              className="danger"
              onClick={async () => {
                if (
                  confirm(
                    "Archive this product? Existing orders are preserved.",
                  )
                )
                  try {
                    await m.mutateAsync({
                      path: "/products/" + edit._id,
                      method: "DELETE",
                    });
                    setEdit(null);
                  } catch {}
              }}
            >
              Archive product
            </button>
          </div>
        </Modal>
      )}
      {importing && (
        <Modal title="Import products" onClose={() => setImport(false)}>
          <form
            className="modal-body"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const body = JSON.parse(json);
                await m.mutateAsync({
                  path: "/products/import",
                  body,
                });
                setImport(false);
              } catch (e) {
                alert(e.message);
              }
            }}
          >
            <p>
              Upload a JSON array matching docs/catalog-example.json. Maximum
              100 products. Import is atomic.
            </p>
            <textarea
              required
              rows={12}
              value={json}
              onChange={(e) => setJson(e.target.value)}
              aria-label="Catalog JSON"
            />
            <button className="primary" disabled={m.isPending}>
              Validate and import
            </button>
            <ErrorBox error={m.error} />
          </form>
        </Modal>
      )}
    </>
  );
}
