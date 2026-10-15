import { useState, useEffect } from "react";
import { useData, useAction } from "../../hooks/useApi.js";
import { PageHead } from "../../components/common/PageHeader.jsx";
import { State } from "../../components/common/QueryState.jsx";
import { Status } from "../../components/common/Status.jsx";
import { Field } from "../../components/common/Field.jsx";
import { ErrorBox } from "../../components/common/ErrorBox.jsx";
export function SettingsPage() {
  const q = useData("/admin/settings"),
    m = useAction(),
    [policy, setPolicy] = useState("shipping"),
    [draft, setDraft] = useState(null);
  useEffect(() => {
    const p = q.data?.settings.find((s) => s.key === "policy." + policy);
    setDraft(
      p?.value || {
        title: policy + " policy — DRAFT",
        text: "",
        published: false,
      },
    );
  }, [policy, q.data]);
  return (
    <>
      <PageHead
        title="Store settings"
        description="Manage connections, published policies and security expectations."
      />
      <State query={q}>
        {(d) => (
          <div className="settings-grid">
            <section className="card pad">
              <h2>Connections</h2>
              {[
                ["OpenAI Responses API", d.integrations.openai],
                ["Meta WhatsApp Cloud API", d.integrations.whatsapp],
                ["Development simulator", d.integrations.simulator],
              ].map(([label, enabled]) => (
                <div className="split" key={label}>
                  <span>{label}</span>
                  <Status>{enabled ? "Configured" : "Not configured"}</Status>
                </div>
              ))}
              <p className="fine">
                Configured means environment variables exist. It does not
                certify a successful live connection. Secrets are managed on the
                server.
              </p>
              <hr />
              <h2>Security</h2>
              <p>HttpOnly sessions · CSRF checks · server authorization</p>
              <p>Session lifetime: {d.security.sessionHours} hours</p>
              <p>
                Privileged MFA:{" "}
                {d.security.mfaRequired
                  ? "Required"
                  : "Development mode; required in production"}
              </p>
            </section>
            <section className="card pad">
              <h2>Store policies</h2>
              <p>Draft content must be reviewed before publishing.</p>
              <Field label="Policy">
                <select
                  value={policy}
                  onChange={(e) => setPolicy(e.target.value)}
                >
                  {[
                    "shipping",
                    "returns",
                    "cancellation",
                    "cod",
                    "privacy",
                    "terms",
                    "support",
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              {draft && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await m.mutateAsync({
                        path: "/admin/settings/policy." + policy,
                        method: "PUT",
                        body: draft,
                      });
                    } catch {}
                  }}
                >
                  <Field label="Title">
                    <input
                      required
                      value={draft.title}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          title: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Policy text">
                    <textarea
                      rows={9}
                      required
                      value={draft.text}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          text: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={draft.published}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          published: e.target.checked,
                        })
                      }
                    />{" "}
                    Reviewed and ready to publish
                  </label>
                  <ErrorBox error={m.error} />
                  <button className="primary" disabled={m.isPending}>
                    Save policy
                  </button>
                  {m.isSuccess && <span role="status"> Saved</span>}
                </form>
              )}
            </section>
          </div>
        )}
      </State>
    </>
  );
}
