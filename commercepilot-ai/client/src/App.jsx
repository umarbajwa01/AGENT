import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/common/ErrorBoundary.jsx";
import { qc } from "./lib/queryClient.js";
import { Login } from "./pages/auth/Login.jsx";
import { Simulator } from "./pages/store/Simulator.jsx";
import { Shell } from "./layouts/AdminLayout.jsx";
export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/*" element={<Shell />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
