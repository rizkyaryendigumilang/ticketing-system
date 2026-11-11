import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useCrm } from './context/CrmContext';
import { AdminCrmLayout } from './components/layout/AdminCrmLayout';
import { UserPortalLayout } from './components/layout/UserPortalLayout';
import { HandoffRedirectPage } from './pages/HandoffRedirectPage';
import { LoginPage } from './pages/LoginPage';
import { AdminContactsPage } from './pages/admin/AdminContactsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminIntegrationPage } from './pages/admin/AdminIntegrationPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminTicketDetailPage } from './pages/admin/AdminTicketDetailPage';
import { AdminTicketsPage } from './pages/admin/AdminTicketsPage';
import { PortalHomePage } from './pages/portal/PortalHomePage';
import { PortalNewTicketPage } from './pages/portal/PortalNewTicketPage';
import { PortalTicketViewPage } from './pages/portal/PortalTicketViewPage';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin } = useCrm();
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  const { data, requester } = useCrm();
  if (!requester) {
    // If there is an existing registered contact (e.g. snackloop:admin), bounce to that contact
    const defaultUser = data.users.find((u) => u.systemRole === 'requester');
    if (defaultUser) {
      const qs = new URLSearchParams({
        app: defaultUser.appId,
        uid: defaultUser.externalUid,
        name: defaultUser.name,
        role: defaultUser.appRole,
        ...(defaultUser.lastSeenUrl ? { from_url: defaultUser.lastSeenUrl } : {}),
      });
      return <Navigate to={`/handoff?${qs.toString()}`} replace />;
    }
    // Fallback default
    return (
      <Navigate
        to="/handoff?app=snackloop&uid=admin&name=admin&role=Owner+%28Super+Admin%29&from_url=https%3A%2F%2F43.156.236.102%2Fsnackloop%2F%23"
        replace
      />
    );
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { admin, requester } = useCrm();
  if (admin) return <Navigate to="/admin" replace />;
  if (requester) return <Navigate to="/portal" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/handoff" element={<HandoffRedirectPage />} />

      {/* Superadmin CRM Workspace */}
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminCrmLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="tickets" element={<AdminTicketsPage />} />
        <Route path="tickets/:id" element={<AdminTicketDetailPage />} />
        <Route path="contacts" element={<AdminContactsPage />} />
        <Route path="integrations" element={<Navigate to="/admin/settings?tab=integrations" replace />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Customer Self-Service Portal */}
      <Route
        path="/portal"
        element={
          <PortalGuard>
            <UserPortalLayout />
          </PortalGuard>
        }
      >
        <Route index element={<PortalHomePage />} />
        <Route path="new" element={<PortalNewTicketPage />} />
        <Route path="ticket/:id" element={<PortalTicketViewPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
