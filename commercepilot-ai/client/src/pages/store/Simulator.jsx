import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Compass, ArrowUpRight } from "lucide-react";
import { api } from "../../services/api.js";
import { State } from "../../components/common/QueryState.jsx";
import { Shop } from "./Shop.jsx";
import { qc } from "../../lib/queryClient.js";
export function Simulator() {
  const nav = useNavigate(),
    q = useQuery({
      queryKey: ["sim-session"],
      queryFn: async () => {
        await api("/auth/me");
        return api("/customer/session", {
          method: "POST",
          body: {},
        });
      },
      retry: false,
    });
  return (
    <div className="simulator">
      <header className="sim-header">
        <Link className="brand" to="/">
          <Compass />
          CommercePilot <small>AI</small>
        </Link>
        <span className="badge">Development simulator</span>
        <button onClick={() => nav("/login")}>
          Admin workspace <ArrowUpRight size={16} />
        </button>
      </header>
      <div className="sim-notice">
        Test environment · Orders are saved to the connected development
        database. No live WhatsApp connection is implied.
      </div>
      <State query={q}>{() => <Shop />}</State>
      {q.error && (
        <div className="pad">
          <button
            onClick={async () => {
              try {
                await api("/auth/logout", {
                  method: "POST",
                  body: {},
                });
                qc.clear();
                location.reload();
              } catch {}
            }}
          >
            Sign out of admin and start simulator
          </button>
          <p>
            To operate both roles at once, open the simulator in a private
            browser window.
          </p>
        </div>
      )}
    </div>
  );
}
