import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../../services/api.js";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { date } from "../../utils/formatDate.js";
import { Status } from "../../components/common/Status.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
export function Inbox({ user }) {
  const [selected, select] = useState(null),
    q = useData("/admin/conversations"),
    m = useAction(),
    [text, setText] = useState("");
  const msgs = useQuery({
    queryKey: ["inbox", selected?._id],
    queryFn: () => api("/admin/conversations/" + selected._id + "/messages"),
    enabled: !!selected,
    refetchInterval: 10000,
  });
  return (
    <>
      <PageHead
        title="Conversations"
        description="Manage customer conversations and take over when personal support is needed."
      />
      <div className="inbox card">
        <div className="thread-list">
          <State query={q}>
            {(d) =>
              d.items.length ? (
                d.items.map((c) => (
                  <button
                    className={selected?._id === c._id ? "selected" : ""}
                    key={c._id}
                    onClick={() => select(c)}
                  >
                    <span className="avatar">
                      <MessageSquare size={18} />
                    </span>
                    <div>
                      <b>
                        {c.channel === "simulator"
                          ? "Simulator customer"
                          : "WhatsApp customer"}
                      </b>
                      <small>
                        {c.mode === "human" ? "Human support" : "AI assistant"}{" "}
                        · {date(c.updatedAt)}
                      </small>
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty">No conversations yet.</div>
              )
            }
          </State>
        </div>
        <div className="thread">
          {selected ? (
            <>
              <div className="card-head">
                <div>
                  <h2>Customer conversation</h2>
                  <Status>
                    {selected.mode === "human"
                      ? "Human support"
                      : "AI assistant"}
                  </Status>
                </div>
                {user.role === "ADMIN" && (
                  <button
                    onClick={async () => {
                      try {
                        const c = await m.mutateAsync({
                          path: `/admin/conversations/${selected._id}/assign`,
                          method: "PATCH",
                          body: {
                            mode: selected.mode === "human" ? "ai" : "human",
                            assignedTo:
                              selected.mode === "human" ? null : user.id,
                          },
                        });
                        select(c);
                      } catch {}
                    }}
                  >
                    {selected.mode === "human" ? "Return to AI" : "Take over"}
                  </button>
                )}
              </div>
              <div className="messages">
                <State query={msgs}>
                  {(d) =>
                    d.map((msg) => (
                      <div
                        key={msg._id}
                        className={
                          "bubble " +
                          (msg.role === "user" ? "incoming" : "outgoing")
                        }
                      >
                        <small>
                          {msg.role === "user" ? "Customer" : "Store"}
                        </small>
                        {msg.text}
                      </div>
                    ))
                  }
                </State>
              </div>
              <form
                className="composer"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await m.mutateAsync({
                      path: `/admin/conversations/${selected._id}/messages`,
                      body: {
                        text,
                      },
                    });
                    setText("");
                  } catch {}
                }}
              >
                <input
                  aria-label="Reply"
                  placeholder={
                    selected.mode === "human"
                      ? "Write a reply…"
                      : "Take over to send a reply"
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={selected.mode !== "human"}
                  required
                />
                <button
                  className="primary"
                  disabled={selected.mode !== "human" || m.isPending}
                >
                  <Send size={18} /> Send
                </button>
              </form>
              <ErrorBox error={m.error} />
            </>
          ) : (
            <div className="empty">
              <MessageSquare />
              <h3>Select a conversation</h3>
              <p>Messages and handoff controls will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
