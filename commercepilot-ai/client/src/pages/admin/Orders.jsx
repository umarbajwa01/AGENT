import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { money } from "../../services/api.js";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { nextStates } from "../../constants/orderStatuses.js";
import { State } from "../../components/common/QueryState.jsx";
import { OrderTable } from "../../components/orders/OrderTable.jsx";
import { Pager } from "../../components/common/Pagination.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Status } from "../../components/common/Status.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
import { Field } from "../../components/common/Field.jsx";
export function Orders() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [selected, select] = useState(null),
    [payment, setPayment] = useState("Collected"),
    [reason, setReason] = useState("");
  const q = useData(
      `/orders?page=${page}&status=${encodeURIComponent(status)}`,
    ),
    m = useAction();
  return (
    <>
      <PageHead
        title="Orders"
        description="Review COD requests, manage fulfillment and record payment separately."
      />
      <section className="card">
        <div className="toolbar">
          <label className="filter">
            <SlidersHorizontal size={17} />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {Object.keys(nextStates).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <span>Cash on delivery</span>
        </div>
        <State query={q}>
          {(d) => (
            <>
              {d.items.length ? (
                <OrderTable items={d.items} onSelect={select} />
              ) : (
                <div className="empty">No orders match this view.</div>
              )}
              <Pager data={d} page={page} setPage={setPage} />
            </>
          )}
        </State>
      </section>
      {selected && (
        <Modal title={selected.reference} onClose={() => select(null)}>
          <div className="modal-body">
            <Status>{selected.status}</Status>
            <h3>{selected.address.name}</h3>
            <p>
              {selected.address.address}, {selected.address.city}
              <br />
              {selected.address.phone}
            </p>
            {selected.items.map((i) => (
              <div className="split" key={i.variant}>
                <span>
                  {i.name} · {i.label} × {i.quantity}
                </span>
                <b>{money(i.price * i.quantity)}</b>
              </div>
            ))}
            <div className="split">
              <span>Delivery</span>
              {money(selected.shipping)}
            </div>
            <div className="split">
              <span>Discount</span>−{money(selected.discount)}
            </div>
            <div className="split total">
              <b>COD total</b>
              <b>{money(selected.total)}</b>
            </div>
            <h3>Order timeline</h3>
            <ol className="timeline">
              {selected.history.map((h, i) => (
                <li key={i}>
                  <b>{h.status}</b>
                  <small>{new Date(h.at).toLocaleString()}</small>
                </li>
              ))}
            </ol>
            <ErrorBox error={m.error} />
            <div className="actions">
              {nextStates[selected.status].map((s) => (
                <button
                  key={s}
                  className={s === "Cancelled" ? "danger" : "primary"}
                  disabled={m.isPending}
                  onClick={async () => {
                    if (!confirm(`Change order to ${s}?`)) return;
                    try {
                      const updated = await m.mutateAsync({
                        path: `/orders/${selected._id}/status`,
                        method: "PATCH",
                        body: {
                          status: s,
                          expected: selected.status,
                        },
                      });
                      select(updated);
                    } catch {}
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <hr />
            <h3>Record payment separately</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await m.mutateAsync({
                    path: `/orders/${selected._id}/payment`,
                    method: "PATCH",
                    body: {
                      paymentStatus: payment,
                      reason,
                    },
                  });
                  select({
                    ...selected,
                    paymentStatus: payment,
                  });
                  setReason("");
                } catch {}
              }}
            >
              <Field label="Payment status">
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                >
                  {[
                    "Not Collected",
                    "Collected",
                    "Refunded",
                    "Partially Refunded",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Evidence / reason">
                <input
                  required
                  minLength={5}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
              <button disabled={m.isPending}>Save payment record</button>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
