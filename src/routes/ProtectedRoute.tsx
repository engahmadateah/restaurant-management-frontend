import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export const FORCE_PASSWORD_PATH = "/force-password-change";

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const mustChangePassword = useAuthStore((s) => !!s.user?.must_change_password);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (mustChangePassword && location.pathname !== FORCE_PASSWORD_PATH) {
    return <Navigate to={FORCE_PASSWORD_PATH} replace />;
  }

  if (!mustChangePassword && location.pathname === FORCE_PASSWORD_PATH) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
