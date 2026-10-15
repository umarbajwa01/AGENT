import { useState } from "react";
import { Plus } from "lucide-react";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { Table } from "../../components/common/Table.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Field } from "../../components/common/Field.jsx";
export function Staff() {
  const q = useData("/admin/staff"),
    m = useAction(),
    [add, setAdd] = useState(false);
  return (
    <>
      <PageHead
        title="Team members"
        description="Give staff only the access they need."
      >
        <button className="primary" onClick={() => setAdd(true)}>
          <Plus size={17} /> Add member
        </button>
      </PageHead>
      <section className="card">
        <ErrorBox error={m.error} />
        <State query={q}>
          {(d) => (
            <Table headers={["Member", "Email", "Role", "Access", ""]}>
              {d.map((u) => (
                <tr key={u._id}>
                  <td>
                    <b>{u.name}</b>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.active ? "Active" : "Disabled"}</td>
                  <td>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `${u.active ? "Disable" : "Enable"} this account?`,
                          )
                        )
                          m.mutate({
                            path: "/admin/staff/" + u._id,
                            method: "PATCH",
                            body: {
                              active: !u.active,
                            },
                          });
                      }}
                    >
                      {u.active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </State>
      </section>
      {add && (
        <Modal title="Create staff account" onClose={() => setAdd(false)}>
          <form
            className="modal-body"
            onSubmit={async (e) => {
              e.preventDefault();
              const body = Object.fromEntries(new FormData(e.target));
              try {
                await m.mutateAsync({
                  path: "/admin/staff",
                  body,
                });
                setAdd(false);
              } catch {}
            }}
          >
            {["name", "email", "password"].map((k) => (
              <Field label={k} key={k}>
                <input
                  required
                  name={k}
                  type={k === "name" ? "text" : k}
                  minLength={k === "password" ? 14 : 2}
                />
              </Field>
            ))}
            <Field label="Role">
              <select name="role">
                <option>SALES_AGENT</option>
                <option>ADMIN</option>
              </select>
            </Field>
            <p className="fine">
              Production access additionally requires TOTP provisioning using
              the server script.
            </p>
            <ErrorBox error={m.error} />
            <button className="primary" disabled={m.isPending}>
              Create member
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
