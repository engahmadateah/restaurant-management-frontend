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

  // موظف لسا عنده كلمة سر مؤقتة: ما بيشوف أي صفحة غير صفحة تغيير كلمة السر
  if (mustChangePassword && location.pathname !== FORCE_PASSWORD_PATH) {
    return <Navigate to={FORCE_PASSWORD_PATH} replace />;
  }

  // وبعد ما يغيّرها ما في سبب يضل بهالصفحة
  if (!mustChangePassword && location.pathname === FORCE_PASSWORD_PATH) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
