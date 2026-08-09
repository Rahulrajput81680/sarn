# SarnConnect — WhatsApp Business Automation Platform


SarnConnect is a multi-tenant SaaS platform that lets businesses automate and scale their WhatsApp communication. It provides bulk messaging, a visual chatbot builder, a team inbox, contact management, analytics, and a full admin control panel — all built around the WhatsApp Business API.




---

## What This Project Is

SarnConnect sits between businesses and the WhatsApp Business API. A business (tenant) signs up, connects their WhatsApp number, imports their contacts, and can then:

- Blast marketing campaigns to thousands of contacts using approved templates
- Build automated chatbot flows that respond 24/7 without human intervention
- Manage live conversations through a shared team inbox
- Track delivery rates, open rates, campaign performance, and agent productivity

The platform is multi-tenant — each business gets its own isolated workspace. Platform admins manage all tenants, billing, API health, and system-wide operations from a separate admin panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite 5 |
| Routing | React Router DOM v6 |
| State Management | Zustand (persisted) |
| Forms & Validation | React Hook Form + Zod |
| HTTP Client | Axios (Bearer token auto-injection) |
| Data Fetching | TanStack React Query v5 |
| Styling | TailwindCSS v3 |
| Animations | Framer Motion |
| Charts | Recharts |
| Notifications | Sonner (toast) |
| Icons | Lucide React |
| Date Utilities | date-fns |
| Backend API | REST at `http://localhost:5000` (external repo) |

---

## User Roles

| Role | Access Level |
|---|---|
| `SUPER_ADMIN` | Full platform access — all admin routes + all client routes |
| `ADMIN` | Admin routes — tenant management, billing, system health, security |
| `AGENT` | Client routes — inbox, campaigns, chatbot, contacts, templates |
| `VIEWER` | Client routes — read-only dashboards and analytics |

---

## Application Flow

### Client (Business User) Flow

```
Register / Login
      │
      ▼
Onboarding Wizard (connect WhatsApp number, configure profile)
      │
      ▼
Dashboard (KPIs: messages sent, delivered, read, failed + trend charts)
      │
      ├── Contacts        → Import CSV / manually add → apply tags & segments
      │
      ├── Templates       → Create & submit WhatsApp templates for Meta approval
      │                     Categories: Marketing / Utility / Authentication
      │
      ├── Bulk Messaging  → 4-step wizard:
      │                     1. Pick approved template
      │                     2. Upload recipients (CSV) + map variables
      │                     3. Schedule send time + batch size
      │                     4. Review & confirm → campaign dispatched
      │
      ├── Campaigns       → View all campaigns, objectives, delivery metrics
      │
      ├── Chatbot Builder → Drag-and-drop visual flow builder
      │                     Node types: Trigger, Send Text, Send Buttons,
      │                     Send List, Condition, Set Tag, Delay,
      │                     Transfer to Human, End Flow
      │
      ├── Inbox           → Unified team inbox for live conversations
      │                     Features: assign to agent, canned responses,
      │                     conversation labels, internal notes
      │
      ├── Analytics       → Message delivery funnel, campaign performance,
      │                     chatbot analytics, agent performance reports
      │
      ├── Team            → Invite team members, assign roles
      │
      └── Billing         → View subscription plan, usage, invoices
```

### Admin Flow

```
Admin Login (/admin/login)
      │
      ▼
Admin Dashboard (platform MRR, active tenants, signups, churn)
      │
      ├── Tenant Management   → List / create / view all client organizations
      ├── User Management     → All users across tenants with filters
      ├── Plans               → Define pricing tiers (Starter / Growth / Enterprise)
      ├── Subscriptions       → Per-tenant subscription status
      ├── Billing             → Platform billing, invoices, payment config
      ├── API Usage           → Request counts, latency, error rates per tenant
      ├── Webhook Logs        → Incoming/outgoing webhook call history
      ├── Rate Limits         → Configure per-tenant API throttling
      ├── Moderation          → Flagged messages + moderation rule editor
      ├── Analytics           → Platform-wide and per-tenant analytics
      ├── System Health       → Service status dashboard
      ├── Announcements       → Broadcast announcements to all tenants
      ├── Email Templates     → Transactional email templates
      ├── Audit Log           → Full audit trail of admin actions
      ├── Sessions            → Active user sessions management
      ├── Security            → Platform security settings
      ├── Support             → Support ticket queue + ticket detail views
      ├── Meta Integration    → Meta Business Account config, linked numbers,
      │                         template approval status
      ├── Failures            → Failed message log
      ├── Retry Queue         → Queue of messages pending retry
      ├── Escalation Rules    → Escalation configuration
      └── Role Permissions    → Manage roles and granular permissions
```

---

## Features

### For Businesses (Client Panel)
- **Bulk Messaging** — Template-based campaigns with CSV upload, variable mapping, scheduling, and batch throttling
- **Chatbot Builder** — Visual no-code flow builder; bots handle FAQs, lead qualification, and customer support automatically
- **Team Inbox** — Shared inbox where multiple agents manage WhatsApp conversations; supports assignment, labels, and canned responses
- **Contact Management** — Import/export contacts, apply tags, segment by behavior or source, track opt-in status
- **Template Management** — Create and submit WhatsApp Business templates (Marketing / Utility / Authentication) and track Meta approval status
- **Analytics** — Delivery funnel (sent → delivered → read), campaign performance, chatbot funnel drop-offs, agent response times
- **Onboarding Wizard** — Guided setup flow for new tenants connecting their WhatsApp number for the first time

### For Platform Admins
- **Tenant Management** — Full CRUD for client organizations
- **Subscription & Billing** — Plan configuration, subscription tracking, invoice management
- **API & Webhook Monitoring** — Real-time API usage, error rate tracking, webhook call logs
- **Content Moderation** — Flagged message review and rule-based auto-moderation
- **System Health Dashboard** — Service-by-service health indicators
- **Failure Recovery** — Failed message log, retry queue, and escalation rules
- **Security & Compliance** — Audit logs, active session management, security config
- **Meta Integration Panel** — Manage WhatsApp Business Account connections and template approvals

---

## Project Structure

```
sarn/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # Axios instance + Bearer token injection
│   │   ├── components/
│   │   │   ├── charts/               # LineChart, BarChart, PieChart
│   │   │   ├── shared/               # SearchBar, Pagination, RoleBadge, ConfirmDialog
│   │   │   └── ui/                   # Button, Input, Card, Badge, Modal, Table, ...
│   │   ├── constants/
│   │   │   └── roles.js              # SUPER_ADMIN, ADMIN, AGENT, VIEWER
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx        # Login/register page shell
│   │   │   ├── DashboardLayout.jsx   # Client sidebar + nav
│   │   │   └── AdminLayout.jsx       # Admin sidebar + nav
│   │   ├── pages/
│   │   │   ├── auth/                 # Login, Register, ForgotPassword, AdminLogin
│   │   │   ├── client/               # Dashboard, BulkMessaging, Campaigns, Contacts,
│   │   │   │                         # Inbox, ChatbotBuilder, Analytics, Templates,
│   │   │   │                         # TeamAccess, Billing
│   │   │   └── admin/                # AdminDashboard + all admin sub-pages
│   │   ├── router/
│   │   │   ├── AppRouter.jsx         # All routes with guards
│   │   │   ├── ProtectedRoute.jsx    # Token check → redirect to /login
│   │   │   └── RoleRoute.jsx         # Role check → admin-only enforcement
│   │   └── store/
│   │       ├── authStore.js          # User, token, role (Zustand, persisted)
│   │       ├── uiStore.js            # Sidebar state, theme, modals
│   │       └── adminStore.js         # Admin-specific state
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Backend API running at `http://localhost:5000` (separate repository)

### Install & Run

```bash
cd frontend
npm install
npm run dev
```

App starts at `http://127.0.0.1:3000`

### Environment Variables

Create `frontend/.env` to override defaults:

```env
VITE_API_URL=http://localhost:5000
```

---

## Authentication

- Login hits `POST /api/v1/auth/login` → returns `{ user, token }`
- Token is stored in Zustand (persisted to localStorage as `wixabotic-auth`)
- Every subsequent API request includes `Authorization: Bearer <token>` via Axios interceptor
- A 401 response auto-clears the store and redirects to `/login`
- Admins use a separate login at `/admin/login`

---

## Routes Reference

### Client Routes (requires login)

| Path | Page |
|---|---|
| `/dashboard` | KPI overview + charts |
| `/bulk-messaging` | Campaign creation wizard |
| `/campaigns` | Campaign list + metrics |
| `/contacts` | Contact database |
| `/inbox` | Team conversation inbox |
| `/chatbot` | Visual flow builder |
| `/analytics` | Performance analytics |
| `/templates` | WhatsApp template manager |
| `/team` | Team member access |
| `/billing` | Subscription & billing |

### Admin Routes (requires ADMIN or SUPER_ADMIN role)

| Path | Page |
|---|---|
| `/admin/users` | All platform users |
| `/admin/tenants` | Tenant organizations |
| `/admin/plans` | Pricing plans |
| `/admin/subscriptions` | Subscription tracker |
| `/admin/billing` | Billing overview |
| `/admin/api-usage` | API usage monitor |
| `/admin/webhook-logs` | Webhook call logs |
| `/admin/rate-limits` | Rate limit config |
| `/admin/moderation` | Message moderation |
| `/admin/analytics` | Platform analytics |
| `/admin/system-health` | Service health |
| `/admin/announcements` | Tenant announcements |
| `/admin/audit-log` | Audit trail |
| `/admin/sessions` | Active sessions |
| `/admin/security` | Security settings |
| `/admin/support` | Support tickets |
| `/admin/meta` | Meta Business config |
| `/admin/failures` | Failed messages |
| `/admin/retry-queue` | Retry queue |
| `/admin/escalation` | Escalation rules |
| `/admin/role-permissions` | Role management |
