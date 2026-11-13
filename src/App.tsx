import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useCrm } from './context/CrmContext';
import { AdminCrmLayout } from './components/layout/AdminCrmLayout';
import { UserPortalLayout } from './components/layout/UserPortalLayout';
import { HandoffRedirectPage } from './pages/HandoffRedirectPage';
import { LoginPage } from './pages/LoginPage';
import { AdminContactsPage } from './pages/admin/AdminContactsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminTicketDetailPage } from './pages/admin/AdminTicketDetailPage';
import { AdminTicketsPage } from './pages/admin/AdminTicketsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminTeamPage } from './pages/admin/AdminTeamPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import { PortalHomePage } from './pages/portal/PortalHomePage';
import { PortalNewTicketPage } from './pages/portal/PortalNewTicketPage';
import { PortalTicketViewPage } from './pages/portal/PortalTicketViewPage';
import { NotFoundPage } from './pages/system/NotFoundPage';
import { ForbiddenPage } from './pages/system/ForbiddenPage';
import { ServerErrorPage } from './pages/system/ServerErrorPage';
import { MaintenancePage } from './pages/system/MaintenancePage';
import { OfflinePage } from './pages/system/OfflinePage';
import { SessionExpiredPage } from './pages/system/SessionExpiredPage';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin } = useCrm();
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PortalGuard({ children }: { children: React.ReactNode }) {
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
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="team" element={<AdminTeamPage />} />
        <Route path="support" element={<AdminSupportPage />} />
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
        <Route path="help" element={<AdminSupportPage />} />
      </Route>

      {/* Dedicated System Pages */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/offline" element={<OfflinePage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />

      {/* Wildcard 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
