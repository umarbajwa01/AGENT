import { useState } from "react";
import { useData } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { Table } from "../../components/common/Table.jsx";
import { Pager } from "../../components/common/Pagination.jsx";
export function Audit() {
  const [page, setPage] = useState(1),
    q = useData("/admin/audit-logs?page=" + page);
  return (
    <>
      <PageHead
        title="Audit trail"
        description="Trace sensitive changes to the account that made them."
      />
      <section className="card">
        <State query={q}>
          {(d) => (
            <>
              <Table headers={["When", "Action", "Actor", "Target", "Detail"]}>
                {d.items.map((a) => (
                  <tr key={a._id}>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td>
                      <code>{a.action}</code>
                    </td>
                    <td className="mono">{a.actor}</td>
                    <td className="mono">{a.target}</td>
                    <td>{a.detail || "—"}</td>
                  </tr>
                ))}
              </Table>
              <Pager data={d} page={page} setPage={setPage} />
            </>
          )}
        </State>
      </section>
    </>
  );
}
