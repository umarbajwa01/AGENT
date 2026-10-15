import { ErrorBox } from "./ErrorBox.jsx";
export function State({ query, children }) {
  if (query.isPending)
    return (
      <div className="empty" role="status">
        Loading store data…
      </div>
    );
  if (query.error) return <ErrorBox error={query.error} />;
  return children(query.data);
}
