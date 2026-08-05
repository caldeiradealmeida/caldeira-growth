import { Route, Routes } from "react-router-dom";
import { RequireAdmin } from "./auth/RequireAdmin";
import { CrmLogin } from "./pages/CrmLogin";
import { CrmList } from "./pages/CrmList";
import { CrmDetail } from "./pages/CrmDetail";

export default function CrmApp() {
  return (
    <Routes>
      <Route path="login" element={<CrmLogin />} />
      <Route
        index
        element={
          <RequireAdmin>
            <CrmList />
          </RequireAdmin>
        }
      />
      <Route
        path="leads/:leadId"
        element={
          <RequireAdmin>
            <CrmDetail />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}
