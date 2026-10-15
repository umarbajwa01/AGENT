import { useState } from "react";
import { Plus } from "lucide-react";
import { money } from "../../services/api.js";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { Table } from "../../components/common/Table.jsx";
import { date } from "../../utils/formatDate.js";
import { Pager } from "../../components/common/Pagination.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Field } from "../../components/common/Field.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
export function Coupons() {
  const [page, setPage] = useState(1),
    q = useData("/admin/coupons?page=" + page),
    m = useAction(),
    [edit, setEdit] = useState(null);
  return (
    <>
      <PageHead
        title="Discounts"
        description="Fixed-amount coupons with server-enforced limits."
      >
        <button
          className="primary"
          onClick={() =>
            setEdit({
              code: "",
              amount: 0,
              minimum: 0,
              maxUses: 100,
              expires: new Date(Date.now() + 30 * 86400000)
                .toISOString()
                .slice(0, 10),
              active: true,
            })
          }
        >
          <Plus size={17} /> Create coupon
        </button>
      </PageHead>
      <section className="card">
        <State query={q}>
          {(d) => (
            <>
              <Table
                headers={[
                  "Code",
                  "Discount",
                  "Minimum",
                  "Usage",
                  "Expires",
                  "",
                ]}
              >
                {d.items.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <b>{c.code}</b>
                    </td>
                    <td>{money(c.amount)}</td>
                    <td>{money(c.minimum)}</td>
                    <td>
                      {c.used} / {c.maxUses}
                    </td>
                    <td>{date(c.expires)}</td>
                    <td>
                      <button
                        onClick={() =>
                          setEdit({
                            ...c,
                            expires: c.expires.slice(0, 10),
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
              {!d.items.length && (
                <div className="empty">No coupons created.</div>
              )}
              <Pager data={d} page={page} setPage={setPage} />
            </>
          )}
        </State>
      </section>
      {edit && (
        <Modal title="Coupon details" onClose={() => setEdit(null)}>
          <form
            className="modal-body"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await m.mutateAsync({
                  path: "/admin/coupons" + (edit._id ? "/" + edit._id : ""),
                  method: edit._id ? "PATCH" : "POST",
                  body: {
                    code: edit.code.toUpperCase(),
                    amount: edit.amount,
                    minimum: edit.minimum,
                    maxUses: Number(edit.maxUses),
                    expires: new Date(
                      edit.expires + "T23:59:59Z",
                    ).toISOString(),
                    active: edit.active,
                  },
                });
                setEdit(null);
              } catch {}
            }}
          >
            {["code", "amount", "minimum", "maxUses", "expires"].map((k) => (
              <Field
                key={k}
                label={
                  k === "amount"
                    ? "Discount (PKR)"
                    : k === "minimum"
                      ? "Minimum subtotal (PKR)"
                      : k
                }
              >
                <input
                  required
                  type={
                    k === "expires" ? "date" : k === "code" ? "text" : "number"
                  }
                  min="0"
                  value={
                    ["amount", "minimum"].includes(k) ? edit[k] / 100 : edit[k]
                  }
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      [k]: ["amount", "minimum"].includes(k)
                        ? Math.round(Number(e.target.value) * 100)
                        : e.target.value,
                    })
                  }
                />
              </Field>
            ))}
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
              Enabled
            </label>
            <ErrorBox error={m.error} />
            <button className="primary" disabled={m.isPending}>
              Save coupon
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
