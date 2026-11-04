import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useCrm } from './context/CrmContext';
import { AdminCrmLayout } from './components/layout/AdminCrmLayout';
import { UserPortalLayout } from './components/layout/UserPortalLayout';
import { HandoffRedirectPage } from './pages/HandoffRedirectPage';
import { LoginPage } from './pages/LoginPage';
import { AdminContactsPage } from './pages/admin/AdminContactsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminIntegrationPage } from './pages/admin/AdminIntegrationPage';
import { AdminTicketDetailPage } from './pages/admin/AdminTicketDetailPage';
import { AdminTicketsPage } from './pages/admin/AdminTicketsPage';
import { PortalHomePage } from './pages/portal/PortalHomePage';
import { PortalNewTicketPage } from './pages/portal/PortalNewTicketPage';
import { PortalTicketViewPage } from './pages/portal/PortalTicketViewPage';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isAdmin, isLoading, switchToAdmin } = useCrm();

  useEffect(() => {
    if (!isLoading && (!currentUser || !isAdmin)) {
      switchToAdmin();
    }
  }, [isLoading, currentUser, isAdmin, switchToAdmin]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-xs text-ink-muted">
        Memuat meja kerja CRM...
      </div>
    );
  }

  return <>{children}</>;
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useCrm();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-xs text-ink-muted">
        Memuat portal bantuan...
      </div>
    );
  }

  if (!currentUser || currentUser.systemRole === 'admin') {
    return (
      <Navigate
        to="/handoff?app=snackloop&uid=staff1&name=Rina%20(Staff%20Rekap)&role=Staff%20Rekap%20%26%20Transaksi%20Harian&from_url=https%3A%2F%2F43.156.236.102%2Fsnackloop%2Frekap-harian"
        replace
      />
    );
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { currentUser } = useCrm();
  if (currentUser?.systemRole === 'requester') {
    return <Navigate to="/portal" replace />;
  }
  return <Navigate to="/admin" replace />;
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
        <Route path="integrations" element={<AdminIntegrationPage />} />
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
