import { useState } from "react";
import { Plus } from "lucide-react";
import { money } from "../../services/api.js";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { Table } from "../../components/common/Table.jsx";
import { Status } from "../../components/common/Status.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Field } from "../../components/common/Field.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
export function Delivery() {
  const q = useData("/delivery/zones"),
    m = useAction(),
    [edit, setEdit] = useState(null);
  return (
    <>
      <PageHead
        title="Delivery zones"
        description="Accurate fees start with clear delivery coverage."
      >
        <button
          className="primary"
          onClick={() =>
            setEdit({
              name: "",
              cities: [],
              fee: 20000,
              active: true,
            })
          }
        >
          <Plus size={17} /> Add zone
        </button>
      </PageHead>
      <section className="card">
        <State query={q}>
          {(d) =>
            d.length ? (
              <Table headers={["Zone", "Cities", "Delivery fee", "Status", ""]}>
                {d.map((x) => (
                  <tr key={x._id}>
                    <td>
                      <b>{x.name}</b>
                    </td>
                    <td>{x.cities.join(", ")}</td>
                    <td>{money(x.fee)}</td>
                    <td>
                      <Status>{x.active ? "active" : "Disabled"}</Status>
                    </td>
                    <td>
                      <button onClick={() => setEdit(x)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <div className="empty">
                Create a zone before accepting orders.
              </div>
            )
          }
        </State>
      </section>
      {edit && (
        <Modal title="Delivery zone" onClose={() => setEdit(null)}>
          <form
            className="modal-body"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const body = {
                  name: edit.name,
                  cities: edit.cities.map((s) => s.trim()).filter(Boolean),
                  fee: edit.fee,
                  active: edit.active,
                };
                await m.mutateAsync({
                  path: "/delivery/zones" + (edit._id ? "/" + edit._id : ""),
                  method: edit._id ? "PATCH" : "POST",
                  body,
                });
                setEdit(null);
              } catch {}
            }}
          >
            <Field label="Zone name">
              <input
                required
                value={edit.name}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    name: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Cities (comma-separated)">
              <input
                required
                value={edit.cities.join(",")}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    cities: e.target.value.split(","),
                  })
                }
              />
            </Field>
            <Field label="Delivery fee (PKR)">
              <input
                type="number"
                min="0"
                step=".01"
                value={edit.fee / 100}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    fee: Math.round(Number(e.target.value) * 100),
                  })
                }
              />
            </Field>
            <label className="check">
              <input
                type="checkbox"
                checked={edit.active}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    active: e.target.checked,
                  })
                }
              />{" "}
              Accept orders in this zone
            </label>
            <ErrorBox error={m.error} />
            <button className="primary" disabled={m.isPending}>
              Save zone
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
