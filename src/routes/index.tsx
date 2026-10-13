import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute, FORCE_PASSWORD_PATH } from "./ProtectedRoute";
import { RouteErrorFallback } from "@/components/shared/RouteErrorFallback";
import LoginPage from "@/features/auth/LoginPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/ResetPasswordPage";
import ForbiddenPage from "@/features/auth/ForbiddenPage";
import ForcePasswordChangePage from "@/features/auth/ForcePasswordChangePage";
import { RequirePermission } from "./PermissionGate";
import { PublicLayout } from "@/features/public/PublicLayout";

const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const MenuPage = lazy(() => import("@/features/menu/MenuPage"));
const InventoryPage = lazy(() => import("@/features/inventory/InventoryPage"));
const OrdersPage = lazy(() => import("@/features/orders/OrdersPage"));
const CustomersPage = lazy(() => import("@/features/customers/CustomersPage"));
const ReservationsPage = lazy(() => import("@/features/reservations/ReservationsPage"));
const DeliveriesPage = lazy(() => import("@/features/deliveries/DeliveriesPage"));
const ExpensesPage = lazy(() => import("@/features/expenses/ExpensesPage"));
const TablesPage = lazy(() => import("@/features/tables/TablesPage"));
const StaffPage = lazy(() => import("@/features/staff/StaffPage"));
const PosPage = lazy(() => import("@/features/pos/PosPage"));
const KitchenPage = lazy(() => import("@/features/kitchen/KitchenPage"));
const ReportsPage = lazy(() => import("@/features/reports/ReportsPage"));
const ZReportPage = lazy(() => import("@/features/reports/ZReportPage"));
const CashDrawerPage = lazy(() => import("@/features/cash-drawer/CashDrawerPage"));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage"));
const RefundsPage = lazy(() => import("@/features/refunds/RefundsPage"));
const ReviewsPage = lazy(() => import("@/features/reviews/ReviewsPage"));
const AuditLogPage = lazy(() => import("@/features/audit-log/AuditLogPage"));
const NotificationsPage = lazy(() => import("@/features/notifications/NotificationsPage"));
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage"));
const WorkforcePage = lazy(() => import("@/features/workforce/WorkforcePage"));
const PaymentsPage = lazy(() => import("@/features/payments/PaymentsPage"));
const CouponsPage = lazy(() => import("@/features/coupons/CouponsPage"));
const CurrenciesPage = lazy(() => import("@/features/currencies/CurrenciesPage"));
const PublicMenuPage = lazy(() => import("@/features/public/PublicMenuPage"));
const PublicTrackPage = lazy(() => import("@/features/public/PublicTrackPage"));

const router = createBrowserRouter([
  {
    errorElement: <RouteErrorFallback />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
        ],
      },
      {
        element: <PublicLayout />,
        children: [
          { path: "/t/:token", element: <PublicMenuPage mode="table" /> },
          { path: "/order", element: <PublicMenuPage mode="online" /> },
          { path: "/track/:token", element: <PublicTrackPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [{ path: FORCE_PASSWORD_PATH, element: <ForcePasswordChangePage /> }],
          },
          {
            element: <AdminLayout />,
            children: [
              { path: "/", element: <DashboardPage /> },
              { path: "/403", element: <ForbiddenPage /> },
              { path: "/notifications", element: <NotificationsPage /> },
              { path: "/pos", element: <RequirePermission permission="orders.manage"><PosPage /></RequirePermission> },
              { path: "/orders", element: <RequirePermission permission="orders.view"><OrdersPage /></RequirePermission> },
              { path: "/kitchen", element: <RequirePermission permission="kitchen.manage"><KitchenPage /></RequirePermission> },
              { path: "/tables", element: <RequirePermission permission="tables.manage"><TablesPage /></RequirePermission> },
              { path: "/reservations", element: <RequirePermission permission="reservations.manage"><ReservationsPage /></RequirePermission> },
              { path: "/deliveries", element: <RequirePermission permission="deliveries.manage"><DeliveriesPage /></RequirePermission> },
              { path: "/staff", element: <RequirePermission permission="users.manage"><StaffPage /></RequirePermission> },
              {
                path: "/menu",
                element: (
                  <RequirePermission permission="menu.manage">
                    <MenuPage />
                  </RequirePermission>
                ),
              },
              {
                path: "/inventory",
                element: (
                  <RequirePermission permission="menu.manage">
                    <InventoryPage />
                  </RequirePermission>
                ),
              },
              { path: "/customers", element: <RequirePermission permission="orders.manage"><CustomersPage /></RequirePermission> },
              {
                path: "/reports",
                element: (
                  <RequirePermission permission="reports.view">
                    <ReportsPage />
                  </RequirePermission>
                ),
              },
              { path: "/z-report", element: <RequirePermission permission="reports.view"><ZReportPage /></RequirePermission> },
              {
                path: "/cash-drawer",
                element: (
                  <RequirePermission permission={["drawer.manage_own", "drawer.manage_all"]}>
                    <CashDrawerPage />
                  </RequirePermission>
                ),
              },
              {
                path: "/expenses",
                element: (
                  <RequirePermission permission="expenses.view">
                    <ExpensesPage />
                  </RequirePermission>
                ),
              },
              {
                path: "/audit-log",
                element: (
                  <RequirePermission permission="audit.view">
                    <AuditLogPage />
                  </RequirePermission>
                ),
              },
            
              { path: "/payments", element: <RequirePermission permission="orders.manage"><PaymentsPage /></RequirePermission> },
              { path: "/coupons", element: <RequirePermission permission="orders.manage"><CouponsPage /></RequirePermission> },
              {
                path: "/settings",
                element: (
                  <RequirePermission permission="settings.manage">
                    <SettingsPage />
                  </RequirePermission>
                ),
              },
   
              {
                path: "/currencies",
                element: (
                  <RequirePermission permission="settings.manage">
                    <CurrenciesPage />
                  </RequirePermission>
                ),
              },
     
              { path: "/refunds", element: <RequirePermission permission={["orders.manage", "refunds.approve"]}><RefundsPage /></RequirePermission> },
              { path: "/reviews", element: <RequirePermission permission={["orders.manage", "reviews.approve"]}><ReviewsPage /></RequirePermission> },
              { path: "/workforce", element: <WorkforcePage /> },
              { path: "/profile", element: <ProfilePage /> },
              { path: "/change-password", element: <ProfilePage /> },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
