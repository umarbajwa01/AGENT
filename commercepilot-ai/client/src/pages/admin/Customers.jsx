import { useState } from "react";
import { useData } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { Table } from "../../components/common/Table.jsx";
import { date } from "../../utils/formatDate.js";
import { Pager } from "../../components/common/Pagination.jsx";
export function Customers() {
  const [page, setPage] = useState(1),
    q = useData("/admin/customers?page=" + page);
  return (
    <>
      <PageHead
        title="Customers"
        description="Customer records created by your store conversations."
      />
      <section className="card">
        <State query={q}>
          {(d) => (
            <>
              <Table
                headers={[
                  "Customer",
                  "Phone",
                  "Channel",
                  "Marketing consent",
                  "Since",
                ]}
              >
                {d.items.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <b>{c.name || "Customer"}</b>
                    </td>
                    <td>{c.phone || "Not collected"}</td>
                    <td>{c.channel}</td>
                    <td>
                      {c.marketingOptIn ? "Opted in" : "No promotional consent"}
                    </td>
                    <td>{date(c.createdAt)}</td>
                  </tr>
                ))}
              </Table>
              {!d.items.length && (
                <div className="empty">
                  Customers will appear when they start a session.
                </div>
              )}
              <Pager data={d} page={page} setPage={setPage} />
            </>
          )}
        </State>
      </section>
    </>
  );
}
