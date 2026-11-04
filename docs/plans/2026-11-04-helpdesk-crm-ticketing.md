# Helpdesk CRM & Ticketing System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development to implement this plan task-by-task.

**Goal:** Build a complete web-based multi-app Helpdesk CRM & Ticketing System (Zendesk/Freshdesk-style) with PocketBase backend, React+Vite+TypeScript frontend, and JIT user provisioning via handoff links for 7 internal VPS applications.

**Architecture:** PocketBase handles auth, collections, realtime subscriptions, and file storage at http://127.0.0.1:8090. React SPA served by Vite at http://localhost:5173 communicates via the official `pocketbase` SDK. A fallback/mock adapter in `pbClient.ts` keeps the UI functional if PocketBase is offline (uses localStorage). React Router v6 provides client-side routing with two layout trees: `/admin/*` for Superadmin CRM and `/portal/*` for user self-service.

**Tech Stack:** Vite ^5.4, React ^18.3.1, TypeScript ^5.6, Tailwind CSS v3 (tailwindcss@^3.4.17), react-router-dom ^6.28, lucide-react ^0.460, pocketbase ^0.25

**Spec:** `docs/plans/2026-11-04-helpdesk-crm-ticketing.md` (this file)

## Global Constraints

- Tailwind CSS v3 ONLY — `tailwindcss@^3.4.17` with `tailwind.config.js` (NOT v4)
- PocketBase SDK `pocketbase@^0.25.0` for ALL backend ops (CRUD, Auth, Files, Realtime)
- React Router `react-router-dom@^6.28` with `<BrowserRouter>` — no hash routing
- Lucide icons only from `lucide-react@^0.460`
- PocketBase URL from `import.meta.env.VITE_PB_URL` defaulting to `http://127.0.0.1:8090`
- All 7 app slugs must match exactly: `recruiter`, `snackloop`, `wedding`, `life-planner`, `ai-endurance`, `kept`, `diskon-bot`
- Ticket number format: `{PREFIX}-{zero-padded-3-digit}` e.g. `SNK-001`, `REC-002`
- Composite user key format: `{app_slug}:{external_uid}` e.g. `snackloop:staff1`
- Superadmin login: email `admin@crm.local` / password `Admin@CRM123!`
- Handoff route: `/handoff?app={slug}&uid={uid}&name={name}&role={role}&from_url={url}`
- Seed: 6–8 realistic tickets spread across Snackloop, Recruiter, Wedding, Life Planner, AI Endurance with statuses: open, in_progress, solved
- `npm run pb:init` runs `node scripts/init-pocketbase.mjs`
- `npm run dev` runs Vite dev server
- Build output to `dist/`

## Review Focus

1. Composite key collision — two apps with same uid must resolve to different CrmUser records; `{app_slug}:{uid}` uniqueness must be enforced at DB and service layer
2. Handoff with unknown app slug — `/handoff?app=unknown` must redirect to login with an error message, not crash
3. Ticket attachment as DataURL — paste (Ctrl+V) and file input must both produce base64 DataURLs stored in `attachments[]`; PocketBase file upload must be attempted if online
4. Admin Internal Note — `is_internal_note: true` messages must NOT be visible in the user portal `/portal/ticket/:id`
5. Realtime subscription teardown — PocketBase `.subscribe()` calls must be unsubscribed in `useEffect` cleanup to prevent memory leaks and duplicate events

---

## Task 1: Project Scaffold & Config

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/main.tsx`
- Create: `src/App.tsx` (placeholder routing shell)
- Create: `src/index.css` (Tailwind directives)
- Create: `src/types/crm.ts`
- Create: `src/config/vpsAppsConfig.ts`

**Interfaces:**
- Produces: `AppSource`, `CrmUser`, `Ticket`, `TicketMessage`, `CannedResponse` types from `src/types/crm.ts`
- Produces: `VPS_APPS: AppSource[]`, `CANNED_RESPONSES: CannedResponse[]`, `DEMO_ACCOUNTS` from `src/config/vpsAppsConfig.ts`

- [ ] **Step 1: Create `package.json`** with all dependencies

```json
{
  "name": "vps-ticket-crm",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "pb:init": "node scripts/init-pocketbase.mjs"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "lucide-react": "^0.460.0",
    "pocketbase": "^0.25.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
```

- [ ] **Step 3: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Create `postcss.config.js`**

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create `index.html`** with `<div id="root">` and `<script type="module" src="/src/main.tsx">`

- [ ] **Step 7: Create `.env.example`** with `VITE_PB_URL=http://127.0.0.1:8090` and `VITE_PB_ADMIN_EMAIL=admin@crm.local` and `VITE_PB_ADMIN_PASS=Admin@CRM123!`

- [ ] **Step 8: Create `src/index.css`** with Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`

- [ ] **Step 9: Create `src/types/crm.ts`** with all types verbatim from spec section 5 plus add `export interface AppUser { appId: string; email: string; password: string; role: string; label: string; }` and `export interface DemoAccount { compositeKey: string; appId: string; uid: string; name: string; role: string; label: string; }`

- [ ] **Step 10: Create `src/config/vpsAppsConfig.ts`** with:
  - `VPS_APPS: AppSource[]` — all 7 apps with exact slugs, names, prefixes, URLs, and distinct colors:
    - recruiter: `#3B82F6` (blue)
    - snackloop: `#F59E0B` (amber)
    - wedding: `#EC4899` (pink)
    - life-planner: `#8B5CF6` (violet)
    - ai-endurance: `#10B981` (emerald)
    - kept: `#6366F1` (indigo)
    - diskon-bot: `#EF4444` (red)
  - `CANNED_RESPONSES: CannedResponse[]` — 8 realistic responses (Investigating, Fixed, Need Screenshot, etc.)
  - `DEMO_ACCOUNTS: DemoAccount[]` — one demo per app (staff1/snackloop, employer@demo.com/recruiter, kandidat@demo.com/recruiter, admin@wedding.local/wedding, kiky@lifeplanner.local/life-planner, kipchoge@berlin.org/ai-endurance, user@kept.local/kept, 8503838227/diskon-bot)

- [ ] **Step 11: Create minimal `src/main.tsx`** mounting `<App />` with `<BrowserRouter>`

- [ ] **Step 12: Create placeholder `src/App.tsx`** that renders `<div>VPS Ticket CRM — Loading...</div>`

- [ ] **Step 13: Run `npm install`** in project directory. Verify `node_modules/pocketbase`, `node_modules/react`, `node_modules/tailwindcss` all exist.

- [ ] **Step 14: Run `npm run build`** — verify it succeeds (TypeScript compiles, Vite bundles)

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: project scaffold, types, app config"
```

---

## Task 2: PocketBase Client & Storage Service (Fallback Mode)

**Files:**
- Create: `src/services/pbClient.ts`
- Create: `src/services/storageService.ts`
- Create: `scripts/init-pocketbase.mjs`

**Interfaces:**
- Consumes: `AppSource`, `CrmUser`, `Ticket`, `TicketMessage`, `CannedResponse` from `src/types/crm.ts`
- Consumes: `VPS_APPS`, `CANNED_RESPONSES`, `DEMO_ACCOUNTS` from `src/config/vpsAppsConfig.ts`
- Produces: `pb` (PocketBase instance), `isPbOnline: () => boolean`, `waitForPb: () => Promise<void>` from `src/services/pbClient.ts`
- Produces: `StorageService` with methods: `seedIfEmpty()`, `getTickets()`, `getTicket(id)`, `createTicket(data)`, `updateTicket(id, data)`, `getMessages(ticketId)`, `addMessage(data)`, `getUsers()`, `getUser(id)`, `upsertUser(data)`, `getApps()` — all returning Promises, all falling back to localStorage when PocketBase is offline

**Interfaces detail:**
- `pbClient.ts` exports a singleton `pb = new PocketBase(import.meta.env.VITE_PB_URL ?? 'http://127.0.0.1:8090')`
- `isPbOnline()` checks `pb.authStore.isValid` OR does a lightweight health ping; returns boolean from cached state updated every 10s
- Fallback storage uses `localStorage` keys: `crm_tickets`, `crm_users`, `crm_messages`, `crm_apps`
- `storageService.ts` tries PocketBase first; if offline (or error), falls back to localStorage silently
- `seedIfEmpty()` creates 7 app records + 6–8 realistic tickets + associated CrmUsers if collections are empty

- [ ] **Step 1: Create `src/services/pbClient.ts`** exporting `pb` singleton, `isPbOnline()`, connection status event emitter

- [ ] **Step 2: Create `src/services/storageService.ts`** with try/catch PocketBase → localStorage fallback pattern for each CRUD method

- [ ] **Step 3: Create `scripts/init-pocketbase.mjs`** Node.js script that:
  1. Reads `VITE_PB_URL` from `.env` or defaults to `http://127.0.0.1:8090`
  2. Authenticates as PocketBase superadmin via `/api/collections` admin API
  3. Creates collections: `apps`, `crm_users`, `tickets`, `ticket_messages` with correct field schemas
  4. Seeds 7 `apps` records
  5. Seeds 4 `crm_users` records (one per seeded app context)
  6. Seeds 7 `tickets` with realistic data, mixed statuses (3 open, 2 in_progress, 2 solved)
  7. Seeds sample `ticket_messages` for each ticket

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: pocketbase client, storage service with fallback, init script"
```

---

## Task 3: Auth & Handoff Service + CRM Context

**Files:**
- Create: `src/services/authHandoffService.ts`
- Create: `src/services/ticketCrmService.ts`
- Create: `src/context/CrmContext.tsx`

**Interfaces:**
- Consumes: `pb`, `StorageService` from previous tasks
- Consumes: `CrmUser`, `Ticket`, `TicketMessage`, `AppSource` types
- Produces from `authHandoffService.ts`:
  - `loginAsAdmin(email, password): Promise<CrmUser>`
  - `processHandoff(params: HandoffParams): Promise<CrmUser>` — JIT user provisioning
  - `logout(): void`
  - `getCurrentUser(): CrmUser | null`
  - `HandoffParams: { app: string; uid: string; name: string; role: string; from_url?: string }`
- Produces from `ticketCrmService.ts`:
  - `createTicket(data): Promise<Ticket>`
  - `updateTicket(id, data): Promise<Ticket>`
  - `solveTicket(id, resolutionSummary, adminId): Promise<Ticket>`
  - `getTicketsByApp(appId): Promise<Ticket[]>`
  - `getTicketsByRequester(requesterId): Promise<Ticket[]>`
  - `getAllTickets(filters?): Promise<Ticket[]>`
  - `addMessage(data): Promise<TicketMessage>`
  - `getMessages(ticketId): Promise<TicketMessage[]>`
  - `getOpenCountByApp(): Promise<Record<string, number>>`
- Produces from `CrmContext.tsx`:
  - `useCrm()` hook returning `{ currentUser, tickets, openCounts, contacts, login, logout, processHandoff, refreshTickets, ...}`

- [ ] **Step 1: Create `src/services/authHandoffService.ts`** with:
  - `processHandoff()` implementing composite key lookup → create if missing → return CrmUser
  - On unknown `app` slug: throw `Error('Unknown app slug: ' + params.app)` — callers catch and redirect
  - Store session in `localStorage` key `crm_session` as JSON
  - `loginAsAdmin()` sets `systemRole: 'admin'` on the returned CrmUser

- [ ] **Step 2: Create `src/services/ticketCrmService.ts`** with:
  - `createTicket()` auto-generating `ticketNumber` as `{PREFIX}-{count+1}` (zero-padded to 3 digits)
  - `solveTicket()` setting `status: 'solved'`, `solvedAt: new Date().toISOString()`, `resolutionSummary`, and auto-adding a system message
  - All methods try PocketBase first, fallback to StorageService

- [ ] **Step 3: Create `src/context/CrmContext.tsx`** using `React.createContext`, exposing all state and service methods via `useCrm()` hook

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: auth handoff service, ticket CRM service, CRM context"
```

---

## Task 4: Common UI Components & Layouts

**Files:**
- Create: `src/components/common/StatusBadge.tsx`
- Create: `src/components/common/PriorityBadge.tsx`
- Create: `src/components/common/AppBadge.tsx`
- Create: `src/components/common/ScreenshotUploader.tsx`
- Create: `src/components/layout/AdminCrmLayout.tsx`
- Create: `src/components/layout/UserPortalLayout.tsx`

**Interfaces:**
- Consumes: `TicketStatus`, `TicketPriority`, `AppSource` types
- Consumes: `VPS_APPS` from config
- Produces: Reusable components consumed by all page components

**StatusBadge color map:**
- open → red bg + ring
- in_progress → yellow/amber bg + ring
- waiting_on_user → purple bg + ring
- solved → green bg + ring
- closed → gray bg + ring

**AdminCrmLayout** must include:
- Left sidebar: logo, nav links (Dashboard, Tickets, Contacts, Integrations), app health indicators
- Top simulation bar (fixed, 32px tall, dark): "👑 Admin" button + 7 app simulation buttons, each labeled with app name
- Main content area

**UserPortalLayout** must include:
- App-branded header with app name, color, and "← Back to [App]" link
- "Pusat Bantuan [App Name]" title

- [ ] **Step 1: Create all 4 `common/` components** with correct color maps and prop types
- [ ] **Step 2: Create `AdminCrmLayout.tsx`** with sidebar navigation and simulation bar
- [ ] **Step 3: Create `UserPortalLayout.tsx`** with app-branded header
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: common UI components and layout shells"
```

---

## Task 5: Admin CRM Components

**Files:**
- Create: `src/components/crm-admin/AppHealthMatrix.tsx`
- Create: `src/components/crm-admin/TicketInboxTable.tsx`
- Create: `src/components/crm-admin/TicketKanbanBoard.tsx`
- Create: `src/components/crm-admin/TicketWorkspace3Col.tsx`
- Create: `src/components/crm-admin/CustomerProfileCard.tsx`
- Create: `src/components/crm-admin/CannedResponsePicker.tsx`

**Interfaces:**
- Consumes: `useCrm()`, all badge components, `VPS_APPS`, `CANNED_RESPONSES`
- `AppHealthMatrix` props: `openCounts: Record<string, number>`, `apps: AppSource[]`, `onAppClick: (appId: string) => void`
- `TicketInboxTable` props: `tickets: Ticket[]`, `onTicketClick: (id: string) => void` — includes filter bar (app, status, priority, search)
- `TicketKanbanBoard` props: `tickets: Ticket[]`, `onStatusChange: (ticketId, newStatus) => void`, `onTicketClick`
- `TicketWorkspace3Col` props: `ticket: Ticket`, `messages: TicketMessage[]`, `requester: CrmUser` — 3-column layout
- `CustomerProfileCard` props: `user: CrmUser`, `app: AppSource`, `ticketHistory: Ticket[]`
- `CannedResponsePicker` props: `onSelect: (content: string) => void`

- [ ] **Step 1: Create `AppHealthMatrix.tsx`** — 7-card grid, red border/glow if openCount > 0, animated pulse on open
- [ ] **Step 2: Create `TicketInboxTable.tsx`** — sortable table with filter dropdowns and search input; row click navigates to ticket detail
- [ ] **Step 3: Create `TicketKanbanBoard.tsx`** — 4 columns (Open, In Progress, Waiting, Solved), drag via HTML5 draggable or simple click-to-move
- [ ] **Step 4: Create `TicketWorkspace3Col.tsx`** — left: ticket properties editable; center: message thread + reply box + "✅ Kirim Solusi & Tandai Solved" button; right: CustomerProfileCard
- [ ] **Step 5: Create `CustomerProfileCard.tsx`** and `CannedResponsePicker.tsx`
- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: admin CRM workspace components"
```

---

## Task 6: User Portal Components

**Files:**
- Create: `src/components/user-portal/UserTicketForm.tsx`
- Create: `src/components/user-portal/UserTicketList.tsx`

**Interfaces:**
- `UserTicketForm` — form with locked fields (app, username, role) pre-filled from CrmUser; user fills category, priority, subject, description, source_page_url, attachments
- `UserTicketList` — table of user's own tickets with status badge, subject, date, link to detail

- [ ] **Step 1: Create `UserTicketForm.tsx`** with `ScreenshotUploader` integrated, controlled form state, validation
- [ ] **Step 2: Create `UserTicketList.tsx`** with empty state ("Belum ada tiket") and status filtering
- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: user portal components"
```

---

## Task 7: Pages — Login, Handoff, Admin

**Files:**
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/HandoffRedirectPage.tsx`
- Create: `src/pages/admin/AdminDashboardPage.tsx`
- Create: `src/pages/admin/AdminTicketsPage.tsx`
- Create: `src/pages/admin/AdminTicketDetailPage.tsx`
- Create: `src/pages/admin/AdminContactsPage.tsx`
- Create: `src/pages/admin/AdminIntegrationPage.tsx`

**Interfaces:**
- `LoginPage` — admin credential form + "Quick Demo Login" buttons for each demo account
- `HandoffRedirectPage` — reads URL params, calls `processHandoff()`, redirects to `/portal` or `/portal/new`; on error shows toast and redirects to `/login`
- `AdminDashboardPage` — `AppHealthMatrix` + KPI cards (total open, in_progress, solved today, avg resolution) + recent activity list
- `AdminTicketsPage` — toggle between `TicketInboxTable` and `TicketKanbanBoard`
- `AdminTicketDetailPage` — `TicketWorkspace3Col` with real data loaded by `ticketId` param
- `AdminContactsPage` — contacts grouped by app, with ticket count per user
- `AdminIntegrationPage` — code snippets + simulation buttons

**AdminIntegrationPage** must render for each of the 7 apps:
- HTML snippet: `<a href="/handoff?app={slug}&uid={uid}&name={name}&role={role}">🆘 Butuh Bantuan?</a>`
- JavaScript button snippet
- "▶ Simulasi" button that navigates to `/handoff?app=...&uid=...&name=...&role=...` for each DEMO_ACCOUNT

- [ ] **Step 1: Create `LoginPage.tsx`** with admin login form and simulation quick-links
- [ ] **Step 2: Create `HandoffRedirectPage.tsx`** with full handoff logic and error handling
- [ ] **Step 3: Create `AdminDashboardPage.tsx`** with health matrix and KPIs
- [ ] **Step 4: Create `AdminTicketsPage.tsx`** with view toggle
- [ ] **Step 5: Create `AdminTicketDetailPage.tsx`** with 3-column workspace
- [ ] **Step 6: Create `AdminContactsPage.tsx`** grouped by app
- [ ] **Step 7: Create `AdminIntegrationPage.tsx`** with code generator and simulators
- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: admin pages — dashboard, tickets, contacts, integrations"
```

---

## Task 8: Pages — User Portal

**Files:**
- Create: `src/pages/portal/PortalHomePage.tsx`
- Create: `src/pages/portal/PortalNewTicketPage.tsx`
- Create: `src/pages/portal/PortalTicketViewPage.tsx`

**Interfaces:**
- `PortalHomePage` — lists user's tickets using `UserTicketList`, "Buat Tiket Baru" button
- `PortalNewTicketPage` — `UserTicketForm` pre-filled with locked CrmUser data
- `PortalTicketViewPage` — ticket detail view: status, description, message thread (EXCLUDING internal notes), reply input, "Tandai Masalah Sudah Selesai" button

- [ ] **Step 1: Create `PortalHomePage.tsx`**
- [ ] **Step 2: Create `PortalNewTicketPage.tsx`**
- [ ] **Step 3: Create `PortalTicketViewPage.tsx`** — ensure `is_internal_note: true` messages are filtered out
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: user portal pages"
```

---

## Task 9: Wire Up Routing & Full App Integration

**Files:**
- Modify: `src/App.tsx` — full route tree
- Create: `src/App.tsx` routing: 
  - `/` → redirect to `/admin` if admin, `/portal` if user, `/login` if unauthenticated
  - `/login` → `LoginPage`
  - `/handoff` → `HandoffRedirectPage`
  - `/admin` → `AdminCrmLayout` wrapper
    - `/admin/` → `AdminDashboardPage`
    - `/admin/tickets` → `AdminTicketsPage`
    - `/admin/tickets/:id` → `AdminTicketDetailPage`
    - `/admin/contacts` → `AdminContactsPage`
    - `/admin/integrations` → `AdminIntegrationPage`
  - `/portal` → `UserPortalLayout` wrapper
    - `/portal/` → `PortalHomePage`
    - `/portal/new` → `PortalNewTicketPage`
    - `/portal/ticket/:id` → `PortalTicketViewPage`

- [ ] **Step 1: Wire full routing in `src/App.tsx`** with auth guards (redirect to `/login` if unauthenticated, redirect to `/portal` if non-admin user tries to access `/admin`)
- [ ] **Step 2: Connect `CrmProvider` wrapping entire app in `src/main.tsx`**
- [ ] **Step 3: Verify `npm run build` succeeds with zero TypeScript errors**
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: full routing, auth guards, app integration complete"
```

---

## Task 10: Seed Data, Styling Polish & README

**Files:**
- Create: `README.md`
- Modify: `src/services/storageService.ts` — enrich seed data with 7 realistic tickets
- Create: `src/styles/` or inline Tailwind utility classes for distinctive UI

**Seed Tickets (must exist on first load, no PocketBase required):**
1. `SNK-001` — snackloop, staff1 — "Rekap harian tidak tersimpan setelah klik Simpan" — open — high — bug_error
2. `SNK-002` — snackloop, admin_kiky — "Export laporan CSV kosong" — in_progress — medium — data_transaction
3. `REC-001` — recruiter, employer@demo.com — "Tombol Post Job tidak muncul di dashboard" — open — urgent — bug_error
4. `REC-002` — recruiter, kandidat@demo.com — "Upload CV gagal, file terlalu besar" — solved — medium — account_login
5. `WED-001` — wedding, admin@wedding.local — "Kalender acara tidak sync dengan Google Calendar" — open — high — feature_question
6. `LFP-001` — life-planner, kiky@lifeplanner.local — "Habit tracker tidak menghitung streak dengan benar" — in_progress — medium — bug_error
7. `AIE-001` — ai-endurance, kipchoge@berlin.org — "Data lari minggu lalu hilang setelah update" — open — urgent — data_transaction
8. `KPT-001` — kept, user@kept.local — "Password vault tidak bisa dibuka di Firefox" — solved — low — bug_error

- [ ] **Step 1: Enrich fallback seed data** in `storageService.ts` with all 8 tickets above and corresponding CrmUsers
- [ ] **Step 2: Apply UI polish** — ensure the simulation bar is always visible, app health matrix shows red pulsing indicators for apps with open tickets, ticket workspace has clear solve button
- [ ] **Step 3: Create `README.md`** with setup instructions, `npm install`, `npm run pb:init`, `npm run dev`, handoff URL format, demo accounts
- [ ] **Step 4: Final build verification** — `npm run build` must succeed
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: seed data, UI polish, README — application complete"
```
