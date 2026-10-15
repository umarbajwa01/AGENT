import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ShoppingBag,
  Package,
  MessageSquare,
  ArrowUpRight,
  Plus,
  ChevronRight,
  Check,
  Activity,
} from "lucide-react";
import { money } from "../../services/api.js";
import { useData } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { OrderTable } from "../../components/orders/OrderTable.jsx";
export function Dashboard({ analytics = false }) {
  const q = useData("/admin/analytics"),
    orders = useData("/orders?limit=5");
  return (
    <>
      <PageHead
        title={analytics ? "Store analytics" : "Store overview"}
        description="Orders, inventory and conversations. Everything you need to run today."
      >
        <Link className="button primary" to="/products">
          <Plus size={17} /> Add product
        </Link>
      </PageHead>
      <State query={q}>
        {(d) => (
          <>
            <section className="metrics">
              {[
                [
                  "Order value",
                  money(d.booked),
                  "All saved orders",
                  ShoppingBag,
                ],
                [
                  "Cash collected",
                  money(d.collected),
                  "Recorded payment collections",
                  Check,
                ],
                [
                  "Pending orders",
                  d.pending,
                  "Awaiting your confirmation",
                  Package,
                ],
                [
                  "Human support",
                  d.conversations,
                  "Waiting for a team member",
                  MessageSquare,
                ],
              ].map(([title, value, note, Icon]) => (
                <article className="metric" key={title}>
                  <div>
                    {title}
                    <span className="metric-icon">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                  </div>
                  <strong>{value}</strong>
                  <small>{note}</small>
                </article>
              ))}
            </section>
            <div className="dashboard-grid">
              <section className="card">
                <div className="card-head">
                  <div>
                    <h2>Order activity</h2>
                    <p>Saved order value · last 30 days</p>
                  </div>
                  <span className="badge">Live database</span>
                </div>
                {d.daily.length ? (
                  <div className="chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={d.daily}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="_id"
                          tickFormatter={(s) => s.slice(5)}
                        />
                        <YAxis
                          tickFormatter={(n) => (n / 100000).toFixed(0) + "k"}
                        />
                        <Tooltip formatter={(v) => money(v)} />
                        <Bar
                          dataKey="total"
                          name="Order value"
                          fill="var(--primary)"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="empty">
                    <Activity />
                    <h3>No order activity yet</h3>
                    <p>
                      Your order history will appear here once a checkout is
                      completed.
                    </p>
                  </div>
                )}
              </section>
              <section className="card attention">
                <div className="card-head">
                  <div>
                    <h2>Needs attention</h2>
                    <p>Prioritize the work that needs a response.</p>
                  </div>
                </div>
                <Link to="/orders">
                  <div className="attention-icon">
                    <ShoppingBag />
                  </div>
                  <div>
                    <b>{d.pending} pending orders</b>
                    <span>Review and confirm COD requests</span>
                  </div>
                  <ChevronRight size={18} />
                </Link>
                <Link to="/inbox">
                  <div className="attention-icon">
                    <MessageSquare />
                  </div>
                  <div>
                    <b>{d.conversations} human conversations</b>
                    <span>Continue where the assistant stopped</span>
                  </div>
                  <ChevronRight size={18} />
                </Link>
                <Link to="/products">
                  <div className="attention-icon">
                    <Package />
                  </div>
                  <div>
                    <b>{d.lowStock.length} low-stock products</b>
                    <span>Fewer than 5 units in a variant</span>
                  </div>
                  <ChevronRight size={18} />
                </Link>
                <div className="note">
                  Payment collection is tracked separately from delivery status.
                </div>
              </section>
            </div>
          </>
        )}
      </State>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Latest orders</h2>
            <p>Recent requests and their current fulfillment status.</p>
          </div>
          <Link to="/orders">
            View all orders <ArrowUpRight size={16} />
          </Link>
        </div>
        <State query={orders}>
          {(d) =>
            d.items.length ? (
              <OrderTable items={d.items} />
            ) : (
              <div className="empty">
                No orders yet. Create one through the customer simulator.
              </div>
            )
          }
        </State>
      </section>
    </>
  );
}
