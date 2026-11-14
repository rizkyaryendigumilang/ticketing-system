import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useCrm } from './context/CrmContext';
import { AdminCrmLayout } from './components/layout/AdminCrmLayout';
import { UserPortalLayout } from './components/layout/UserPortalLayout';
import { PageLoadingFallback } from './components/common/PageLoadingFallback';

// Lazy-loaded pages for route-level code splitting
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const HandoffRedirectPage = lazy(() =>
  import('./pages/HandoffRedirectPage').then((m) => ({ default: m.HandoffRedirectPage })),
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminTicketsPage = lazy(() =>
  import('./pages/admin/AdminTicketsPage').then((m) => ({ default: m.AdminTicketsPage })),
);
const AdminTicketDetailPage = lazy(() =>
  import('./pages/admin/AdminTicketDetailPage').then((m) => ({ default: m.AdminTicketDetailPage })),
);
const AdminAnalyticsPage = lazy(() =>
  import('./pages/admin/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage })),
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })),
);
const AdminSupportPage = lazy(() =>
  import('./pages/admin/AdminSupportPage').then((m) => ({ default: m.AdminSupportPage })),
);
const PortalHomePage = lazy(() =>
  import('./pages/portal/PortalHomePage').then((m) => ({ default: m.PortalHomePage })),
);
const PortalNewTicketPage = lazy(() =>
  import('./pages/portal/PortalNewTicketPage').then((m) => ({ default: m.PortalNewTicketPage })),
);
const PortalTicketViewPage = lazy(() =>
  import('./pages/portal/PortalTicketViewPage').then((m) => ({ default: m.PortalTicketViewPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/system/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const ForbiddenPage = lazy(() =>
  import('./pages/system/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
);
const ServerErrorPage = lazy(() =>
  import('./pages/system/ServerErrorPage').then((m) => ({ default: m.ServerErrorPage })),
);
const MaintenancePage = lazy(() =>
  import('./pages/system/MaintenancePage').then((m) => ({ default: m.MaintenancePage })),
);
const OfflinePage = lazy(() =>
  import('./pages/system/OfflinePage').then((m) => ({ default: m.OfflinePage })),
);
const SessionExpiredPage = lazy(() =>
  import('./pages/system/SessionExpiredPage').then((m) => ({ default: m.SessionExpiredPage })),
);

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
    <Suspense fallback={<PageLoadingFallback />}>
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
          <Route path="team" element={<Navigate to="/admin/settings?tab=team" replace />} />
          <Route path="support" element={<Navigate to="/admin/settings?tab=support" replace />} />
          <Route path="contacts" element={<Navigate to="/admin/settings?tab=contacts" replace />} />
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
    </Suspense>
  );
}
