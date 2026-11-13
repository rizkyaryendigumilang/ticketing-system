# SaaS Architecture Pillars (6-12) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement and adapt the 7 SaaS architecture pillars (Notifications, User Management, Settings, Analytics & Reports, Billing & Resource Quota, Help & Support, System Pages) specifically tailored to the VPS Helpdesk CRM system.

**Architecture:** 
- Modular Deep Modules with clean seams and zero AI-slop (using existing design tokens: `bg-panel`, `border-line`, `text-ink`, `bg-subtle`, 4px grid).
- Multi-tenant isolation preserved (`appId` + `externalUid`).
- Offline-first with outbox pattern retained for all data mutations.
- Indonesian terminology strictly aligned with [`GLOSSARY.md`](file:///c:/Users/rizky/Documents/Dev/ticketing-system/GLOSSARY.md).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide React, Node test runner (`node --test`).

---

## Global Constraints

- Never break existing 29 unit tests; add new tests for newly added services and stores.
- All file references must be formatted as markdown links using `file:///` format with forward slashes.
- Commands on Windows PowerShell must use `;` instead of `&&`.
- Multi-tenant security invariants must be preserved.

---

## File Structure Plan

```text
src/
├── types/
│   ├── notification.ts          # Types for in-app notification center, alerts, reminders
│   ├── team.ts                  # Types for team members, roles, permissions, invitations
│   ├── analytics.ts             # Types for SLA metrics, trends, reports
│   └── billing.ts               # Types for app tiers, storage quota, simulated invoices
├── services/
│   ├── notificationService.ts   # Notification center store (localStorage backed + realtime)
│   ├── notificationService.test.ts # Unit tests for notifications
│   ├── teamService.ts           # Team members, roles & invitations logic
│   └── billingService.ts        # Quota tracking, app SLA tiers, cost attribution
├── components/
│   ├── notifications/
│   │   ├── NotificationCenterDrawer.tsx # In-app notification center & alerts popover
│   │   └── NotificationBadge.tsx        # Dynamic bell icon with unread badge counter
│   ├── team/
│   │   ├── TeamMembersTable.tsx         # List of helpdesk operators & supervisors
│   │   ├── RolePermissionMatrix.tsx     # Granular permission matrix
│   │   └── InviteMemberModal.tsx        # Invitation dialog
│   ├── analytics/
│   │   ├── AnalyticsKpiCards.tsx        # High-density metrics cards
│   │   ├── TicketVolumeTrendChart.tsx   # Interactive SVG/CSS bar/trend visualization
│   │   ├── CategoryBreakdownChart.tsx   # Proportional distribution of problems
│   │   └── ReportsExportPanel.tsx       # Date range CSV/JSON export
│   ├── billing/
│   │   ├── AppQuotaAllocationCard.tsx   # Quota usage per VPS app
│   │   ├── ServicePlanTierSelector.tsx  # SLA tiers (Internal, Pro, Enterprise)
│   │   └── CostAttributionInvoice.tsx   # Monthly infrastructure cost breakdown
│   ├── support/
│   │   ├── FaqAccordion.tsx             # Interactive FAQ list
│   │   ├── KnowledgeBaseList.tsx        # Troubleshooting guide per app
│   │   ├── ContactEscalationCard.tsx    # Emergency VPS DevOps escalation
│   │   └── SystemFeedbackForm.tsx       # Feedback submission form
│   └── system/
│       ├── SystemPageLayout.tsx         # Reusable error/system page layout
│       ├── NotFoundView.tsx             # 404
│       ├── ForbiddenView.tsx            # 403
│       ├── ServerErrorView.tsx          # 500
│       ├── MaintenanceView.tsx          # Maintenance window notice
│       ├── OfflineView.tsx              # Offline outbox sync viewer
│       └── SessionExpiredView.tsx       # SSO/HMAC expiration handler
├── pages/
│   ├── admin/
│   │   ├── AdminAnalyticsPage.tsx       # Pillar 9
│   │   ├── AdminTeamPage.tsx            # Pillar 7
│   │   ├── AdminBillingPage.tsx         # Pillar 10
│   │   └── AdminSupportPage.tsx         # Pillar 11
│   └── system/
│       ├── NotFoundPage.tsx             # 404 route
│       ├── ForbiddenPage.tsx            # 403 route
│       ├── ServerErrorPage.tsx          # 500 route
│       ├── MaintenancePage.tsx          # Maintenance route
│       ├── OfflinePage.tsx              # Offline route
│       └── SessionExpiredPage.tsx       # Session expired route
```

---

## Tasks

### Task 1: Pillar 6 — Notifications Center, Alerts, & Reminders
- [ ] Define types in `src/types/notification.ts`.
- [ ] Implement `src/services/notificationService.ts` with local cache, unread counter, and auto-alerts generation (SLA breaches, urgent incoming tickets, follow-up reminders).
- [ ] Write unit test in `src/services/notificationService.test.ts`.
- [ ] Build `NotificationCenterDrawer.tsx` and integrate trigger with unread badge in `AdminCrmLayout.tsx` topbar / rail.

### Task 2: Pillar 7 — User Management (Profile, Team, Roles, Permissions, Invitations)
- [ ] Define types in `src/types/team.ts` (`TeamMember`, `Role`, `Permission`, `Invitation`).
- [ ] Implement `src/services/teamService.ts`.
- [ ] Build `TeamMembersTable.tsx`, `RolePermissionMatrix.tsx`, `InviteMemberModal.tsx`.
- [ ] Create `AdminTeamPage.tsx` at `/admin/team`.

### Task 3: Pillar 8 — Settings Alignment
- [ ] Verify existing modular tabs in `src/components/crm-admin/settings/` cover `Account`, `Preferences`, `Appearance`, `Security`, `Integrations`.
- [ ] Ensure navigation groups in `AdminSettingsPage.tsx` clearly expose and highlight all 5 core settings.

### Task 4: Pillar 9 — Analytics & Reports (Charts, Reports, Export, Insights)
- [ ] Define types in `src/types/analytics.ts`.
- [ ] Build `TicketVolumeTrendChart.tsx`, `CategoryBreakdownChart.tsx`, `AnalyticsKpiCards.tsx`, `ReportsExportPanel.tsx`.
- [ ] Create `AdminAnalyticsPage.tsx` at `/admin/analytics` with interactive filters (7/14/30 days, App selector).

### Task 5: Pillar 10 — Billing & Resource Quotas for VPS Ecosystem
- [ ] Define types in `src/types/billing.ts` (App tiers, quotas, invoices).
- [ ] Implement `src/services/billingService.ts` calculating storage, ticket limits, and infrastructure cost distribution across the 7 VPS apps.
- [ ] Build `AppQuotaAllocationCard.tsx`, `ServicePlanTierSelector.tsx`, `CostAttributionInvoice.tsx`.
- [ ] Create `AdminBillingPage.tsx` at `/admin/billing`.

### Task 6: Pillar 11 — Help & Support (FAQ, Knowledge Base, Contact, Feedback)
- [ ] Build `FaqAccordion.tsx`, `KnowledgeBaseList.tsx`, `ContactEscalationCard.tsx`, `SystemFeedbackForm.tsx`.
- [ ] Create `AdminSupportPage.tsx` at `/admin/support`.

### Task 7: Pillar 12 — Dedicated System Pages (404, 403, 500, Maintenance, Offline, Session Expired)
- [ ] Create reusable `SystemPageLayout.tsx`.
- [ ] Build `NotFoundPage.tsx` (404), `ForbiddenPage.tsx` (403), `ServerErrorPage.tsx` (500), `MaintenancePage.tsx`, `OfflinePage.tsx`, `SessionExpiredPage.tsx`.
- [ ] Wire these routes in `src/App.tsx`.

### Task 8: Navigation, Layout Integration & Verification
- [ ] Update `AdminCrmLayout.tsx` nav items to include `Analytics`, `Team`, `Billing`, `Support`, and the Notification Center drawer.
- [ ] Run `npm test` to verify all tests pass.
- [ ] Run `npm run build -- --base=/helpdesk/` to verify clean bundle generation.
- [ ] Deploy to VPS and verify `HTTP/2 200` live.
