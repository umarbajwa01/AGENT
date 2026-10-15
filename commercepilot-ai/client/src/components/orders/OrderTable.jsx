import { money } from "../../services/api.js";
import { Table } from "../common/Table.jsx";
import { date } from "../../utils/formatDate.js";
import { Status } from "../common/Status.jsx";
export function OrderTable({ items, onSelect }) {
  return (
    <Table
      headers={[
        "Order",
        "Customer",
        "Date",
        "Amount",
        "Fulfillment",
        "Payment",
        "",
      ]}
    >
      {items.map((o) => (
        <tr key={o._id}>
          <td>
            <b>{o.reference}</b>
            <small>{o.items.length} items</small>
          </td>
          <td>
            {o.address.name}
            <small>{o.address.city}</small>
          </td>
          <td>{date(o.createdAt)}</td>
          <td className="number">{money(o.total)}</td>
          <td>
            <Status>{o.status}</Status>
          </td>
          <td>
            <Status>{o.paymentStatus}</Status>
          </td>
          <td>
            {onSelect && <button onClick={() => onSelect(o)}>Review</button>}
          </td>
        </tr>
      ))}
    </Table>
  );
}
