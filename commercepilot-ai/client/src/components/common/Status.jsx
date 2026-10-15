export function Status({ children }) {
  const text = String(children).toLowerCase();
  const kind = ["confirmed", "delivered", "collected", "active"].includes(text)
    ? "good"
    : ["cancelled", "returned", "disabled", "archived"].includes(text)
      ? "neutral"
      : [
            "pending confirmation",
            "not collected",
            "human support",
            "not configured",
          ].includes(text)
        ? "pending"
        : "";
  return <span className={"badge " + kind}>{children}</span>;
}
