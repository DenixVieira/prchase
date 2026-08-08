import { lazy } from "react";
import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const PurchaseRequestsListPage = lazy(() => import("@/pages/PurchaseRequest/PurchaseRequestsListPage"));
const PurchaseRequestFormPage = lazy(() => import("@/pages/PurchaseRequest/PurchaseRequestFormPage"));
const PurchaseRequestDetailPage = lazy(() => import("@/pages/PurchaseRequest/PurchaseRequestDetailPage"));
const RequestTypePickerPage = lazy(() => import("@/pages/RequestType/RequestTypePickerPage"));
const DynamicRequestFormPage = lazy(() => import("@/pages/RequestType/DynamicRequestFormPage"));
const RequestTypesPage = lazy(() => import("@/pages/RequestTypesPage"));
const KanbanPage = lazy(() => import("@/pages/Ticket/KanbanPage"));
const ArchivedTicketsPage = lazy(() => import("@/pages/Ticket/ArchivedTicketsPage"));
const TicketDetailPage = lazy(() => import("@/pages/Ticket/TicketDetailPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const DepartmentsPage = lazy(() => import("@/pages/DepartmentsPage"));
const OrganizationsPage = lazy(() => import("@/pages/OrganizationsPage"));
const InvoiceExportPage = lazy(() => import("@/pages/InvoiceExportPage"));
const DevicesPage = lazy(() => import("@/pages/Device/DevicesPage"));
const DeviceFormPage = lazy(() => import("@/pages/Device/DeviceFormPage"));
const DeviceDetailPage = lazy(() => import("@/pages/Device/DeviceDetailPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AuditPage = lazy(() => import("@/pages/AuditPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/purchase-requests", element: <PurchaseRequestsListPage /> },
          { path: "/purchase-requests/new", element: <PurchaseRequestFormPage /> },
          { path: "/purchase-requests/:id/edit", element: <PurchaseRequestFormPage /> },
          { path: "/purchase-requests/:id", element: <PurchaseRequestDetailPage /> },
          { path: "/requests/new", element: <RequestTypePickerPage /> },
          { path: "/requests/new/:requestTypeId", element: <DynamicRequestFormPage /> },
          { path: "/admin/request-types", element: <RequestTypesPage /> },
          { path: "/tickets", element: <KanbanPage /> },
          { path: "/tickets/archived", element: <ArchivedTicketsPage /> },
          { path: "/tickets/:id", element: <TicketDetailPage /> },
          { path: "/users", element: <UsersPage /> },
          { path: "/departments", element: <DepartmentsPage /> },
          { path: "/organizations", element: <OrganizationsPage /> },
          { path: "/invoices/export", element: <InvoiceExportPage /> },
          { path: "/devices", element: <DevicesPage /> },
          { path: "/devices/new", element: <DeviceFormPage /> },
          { path: "/devices/:id/edit", element: <DeviceFormPage /> },
          { path: "/devices/:id", element: <DeviceDetailPage /> },
          { path: "/audit", element: <AuditPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
];

const router = createBrowserRouter(routes);

export default router;
