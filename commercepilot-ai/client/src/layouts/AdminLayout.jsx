import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  Compass,
  LogOut,
  ArrowUpRight,
  ChevronRight,
  Sun,
  Moon,
  Headphones,
} from "lucide-react";
import { useData, useAction } from "../hooks/useApi.js";
import { State } from "../components/common/QueryState.jsx";
import { navItems } from "../constants/navigation.js";
import { Dashboard } from "../pages/admin/Dashboard.jsx";
import { Orders } from "../pages/admin/Orders.jsx";
import { Products } from "../pages/admin/Products.jsx";
import { Inbox } from "../pages/admin/Inbox.jsx";
import { Customers } from "../pages/admin/Customers.jsx";
import { Categories } from "../pages/admin/Categories.jsx";
import { Delivery } from "../pages/admin/Delivery.jsx";
import { Coupons } from "../pages/admin/Coupons.jsx";
import { Staff } from "../pages/admin/Staff.jsx";
import { SettingsPage } from "../pages/admin/Settings.jsx";
import { Audit } from "../pages/admin/Audit.jsx";
export function Shell() {
  const session = useData("/auth/me"),
    m = useAction(),
    nav = useNavigate(),
    [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  return (
    <State query={session}>
      {(s) =>
        !s.user ? (
          <Navigate to="/login" />
        ) : (
          <div className="shell">
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <aside>
              <Link className="brand" to="/">
                <Compass size={29} /> CommercePilot <small>AI</small>
              </Link>
              <div className="store-label">
                <div className="store-icon">CP</div>
                <div>
                  <b>My store</b>
                  <small>Commerce workspace</small>
                </div>
                <ChevronRight size={15} />
              </div>
              <div className="nav-label">WORKSPACE</div>
              <nav aria-label="Main navigation">
                {navItems
                  .filter(
                    ([path]) => s.user.role === "ADMIN" || path === "inbox",
                  )
                  .map(([path, label, Icon]) => (
                    <React.Fragment key={path}>
                      {path === "inbox" && (
                        <div className="nav-section">CUSTOMER CARE</div>
                      )}
                      {path === "staff" && (
                        <div className="nav-section">MANAGEMENT</div>
                      )}
                      <NavLink to={"/" + path} end>
                        <Icon size={19} aria-hidden="true" />
                        {label}
                      </NavLink>
                    </React.Fragment>
                  ))}
              </nav>
              <div className="aside-bottom">
                <div className="help">
                  <Headphones size={20} />
                  <b>Try the customer journey</b>
                  <span>
                    Browse products, review a quote and test COD checkout.
                  </span>
                  <Link to="/simulator">
                    Open simulator <ArrowUpRight size={15} />
                  </Link>
                </div>
                <button
                  onClick={async () => {
                    await m.mutateAsync({
                      path: "/auth/logout",
                      body: {},
                    });
                    nav("/login");
                  }}
                >
                  <LogOut size={17} /> Sign out
                </button>
              </div>
            </aside>
            <div className="workspace">
              <header className="topbar">
                <span>
                  Workspace <ChevronRight size={14} /> <b>Store operations</b>
                </span>
                <div>
                  <span className="badge">COD enabled</span>
                  <button
                    className="icon"
                    aria-label="Toggle color theme"
                    onClick={() => setDark(!dark)}
                  >
                    {dark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  <span className="avatar" aria-hidden="true">
                    {s.user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="profile-label">
                    <b>{s.user.name}</b>
                    <small>
                      {s.user.role === "ADMIN"
                        ? "Store administrator"
                        : "Sales agent"}
                    </small>
                  </div>
                </div>
              </header>
              <main id="main">
                <Routes>
                  <Route
                    index
                    element={
                      s.user.role === "ADMIN" ? (
                        <Dashboard />
                      ) : (
                        <Navigate to="/inbox" />
                      )
                    }
                  />
                  <Route path="orders" element={<Orders />} />
                  <Route path="products" element={<Products />} />
                  <Route path="inbox" element={<Inbox user={s.user} />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="delivery" element={<Delivery />} />
                  <Route path="coupons" element={<Coupons />} />
                  <Route path="staff" element={<Staff />} />
                  <Route path="analytics" element={<Dashboard analytics />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="audit" element={<Audit />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
              <footer>
                CommercePilot AI{" "}
                <span>Amounts in PKR · Business timezone: Asia/Karachi</span>
              </footer>
            </div>
          </div>
        )
      }
    </State>
  );
}
