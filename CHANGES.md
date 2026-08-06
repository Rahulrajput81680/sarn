# SarnConnect — Backend Integration & Feature Changes

## Overview

This document covers every file added or modified to build the full backend, wire the frontend to real APIs, and enable the Messages feature with real-time Socket.io — all without requiring the Meta WhatsApp API.

---


## What Was Built

### Backend — New (`backend/`)

Complete Node.js + Express REST API built from scratch.

---

### Backend File Structure

```
backend/
├── server.js                          Entry point — creates HTTP server, connects DB, starts Socket.io
├── package.json                       All dependencies
├── .env.example                       Template for required environment variables
├── .gitignore                         Excludes node_modules, .env, uploads
└── src/
    ├── app.js                         Express app — all middleware, routes, error handling
    ├── config/
    │   ├── db.js                      MongoDB connection via Mongoose
    │   └── socket.js                  Socket.io server — room management (tenant, conversation)
    ├── models/
    │   ├── User.js                    User schema — auth, profile, business info, WA settings, notifications, API key (hashed)
    │   ├── Tenant.js                  Tenant schema — plan, usage limits, WA number status
    │   ├── Contact.js                 Contact schema — tags, opt-in, source, custom fields (unique phone per tenant)
    │   ├── Conversation.js            Conversation schema — status, assignee, labels, unread count, 24h WA window
    │   ├── Message.js                 Message schema — type (customer/agent/note/system), status, Meta message ID
    │   ├── Template.js                Template schema — category, components, Meta approval status
    │   └── Campaign.js                Campaign schema — recipients, schedule, stats, batch config
    ├── middleware/
    │   ├── auth.middleware.js         JWT verification → attaches req.user and req.tenantId
    │   ├── error.middleware.js        Global error handler — normalises Mongoose errors, never leaks stack in production
    │   ├── rateLimiter.middleware.js  3 limiters: auth (10/15min), api (120/min), dev (30/min)
    │   └── upload.middleware.js       Multer config — avatar (JPEG/PNG/WebP, 2MB), CSV (5MB) with path sanitisation
    ├── utils/
    │   ├── apiResponse.js             Consistent { success, message, data } response shape
    │   ├── asyncHandler.js            Wraps async controllers so errors propagate to error middleware
    │   └── generateToken.js           JWT sign/verify + API key generation (SHA-256 hashed, raw returned once)
    ├── services/
    │   └── whatsapp/
    │       ├── whatsapp.service.js    Provider switch — reads WA_PROVIDER env var
    │       ├── mock.provider.js       Simulates Meta API responses (used NOW — no API needed)
    │       └── meta.provider.js       Real Meta Cloud API calls (fill in when you get access)
    ├── controllers/
    │   ├── auth.controller.js         register, login, getMe
    │   ├── profile.controller.js      getProfile, updateProfile, uploadAvatar, changePassword,
    │   │                              updateNotifications, updateWASettings, regenerateApiKey, updateWebhook
    │   ├── dashboard.controller.js    getStats, getMessageTrend, getDeliveryStats, getRecentConversations
    │   ├── contact.controller.js      CRUD, bulkDelete, CSV import (csv-parse), CSV export
    │   ├── conversation.controller.js getConversations, getMessages, sendMessage, updateConversation,
    │   │                              simulateIncoming (dev only — triggers Socket.io)
    │   ├── template.controller.js     CRUD + submitTemplate (auto-approves in mock mode after 3s)
    │   └── campaign.controller.js     CRUD + sendCampaign (processes contacts, calls WA service, tracks stats)
    └── routes/
        ├── index.js                   Mounts all routers under /api/v1, adds global API rate limiter
        ├── auth.routes.js             POST /register, POST /login, GET /me
        ├── profile.routes.js          GET /, PUT /, POST /avatar, PUT /password, PUT /notifications,
        │                              PUT /wa-settings, POST /api-key, PUT /webhook
        ├── dashboard.routes.js        GET /stats, /message-trend, /delivery-stats, /recent-conversations
        ├── contact.routes.js          GET /, POST /, GET /export, POST /import, DELETE /bulk, PUT/:id, DELETE/:id
        ├── conversation.routes.js     GET /, GET/:id/messages, POST/:id/messages, PATCH/:id,
        │                              POST /dev/simulate-incoming
        ├── template.routes.js         GET /, POST /, PUT/:id, DELETE/:id, POST/:id/submit
        └── campaign.routes.js         GET /, GET/:id, POST /, POST/:id/send, DELETE/:id
```

---

## API Endpoints Reference

### Auth — `/api/v1/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Create account + tenant |
| POST | `/login` | No | Returns JWT token |
| GET | `/me` | Yes | Get current user |

### Profile — `/api/v1/profile`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Full profile + tenant |
| PUT | `/` | Update personal + business + WA profile |
| POST | `/avatar` | Upload profile photo (multipart) |
| PUT | `/password` | Change password |
| PUT | `/notifications` | Save notification toggles |
| PUT | `/wa-settings` | Business hours, away message, auto-reply |
| POST | `/api-key` | Regenerate API key (returned raw once, stored as SHA-256 hash) |
| PUT | `/webhook` | Save webhook URL + event subscriptions |

### Dashboard — `/api/v1/dashboard`
| Method | Path | Description |
|---|---|---|
| GET | `/stats` | KPI counts from real DB |
| GET | `/message-trend` | Messages per day for last 30 days |
| GET | `/delivery-stats` | Delivered/Read/Failed percentages |
| GET | `/recent-conversations` | Last 5 conversations |

### Contacts — `/api/v1/contacts`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated list with search, tag, status, source filters |
| POST | `/` | Create single contact |
| PUT | `/:id` | Update contact |
| DELETE | `/:id` | Delete contact |
| DELETE | `/bulk` | Delete multiple by IDs |
| POST | `/import` | Upload CSV → bulk upsert |
| GET | `/export` | Download CSV |

### Conversations — `/api/v1/conversations`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List with filter (all/unread/assigned/resolved) |
| GET | `/:id/messages` | All messages in conversation |
| POST | `/:id/messages` | Send message or add internal note |
| PATCH | `/:id` | Update status, assignee, labels |
| POST | `/dev/simulate-incoming` | **Dev only** — create fake incoming message |

### Templates — `/api/v1/templates`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List with status/category filter |
| POST | `/` | Create template (DRAFT) |
| PUT | `/:id` | Edit (only DRAFT/REJECTED) |
| DELETE | `/:id` | Delete |
| POST | `/:id/submit` | Submit for Meta approval (mock auto-approves in 3s) |

### Campaigns — `/api/v1/campaigns`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List with status filter |
| GET | `/:id` | Single campaign with stats |
| POST | `/` | Create campaign |
| POST | `/:id/send` | Execute campaign (processes all recipients) |
| DELETE | `/:id` | Delete (draft only) |

---

## Security Measures

| Layer | Implementation |
|---|---|
| Password hashing | bcryptjs with 12 salt rounds |
| JWT | HS256, configurable expiry, secret never logged |
| API keys | Raw key returned once, stored as SHA-256 hash — cannot be recovered |
| Auth rate limiting | 10 requests per 15 minutes per IP on `/auth/*` |
| API rate limiting | 120 requests per minute per IP |
| NoSQL injection | express-mongo-sanitize strips `$` and `.` from inputs |
| XSS | xss-clean strips script tags from all inputs |
| HTTP param pollution | hpp blocks duplicate query params |
| Security headers | helmet sets CSP, HSTS, X-Frame-Options, etc. |
| CORS | Locked to `FRONTEND_URL` env var — no wildcard |
| Error messages | Stack traces never sent in production |
| File uploads | Type whitelist + size limits + random filenames |
| Role-based access | `protect` middleware + `restrictTo()` per route |

---

## Frontend Changes

### New Files
| File | Description |
|---|---|
| `frontend/src/api/socket.js` | Single Socket.io client instance — connect/disconnect explicitly |

### Modified Files

| File | What Changed |
|---|---|
| `frontend/package.json` | Added `socket.io-client ^4.6.2` |
| `frontend/src/store/authStore.js` | Added `updateUser()` action, fixed `isOnboarded` extraction from user object |
| `frontend/src/pages/auth/Register.jsx` | Wired `handleSubmit` to `POST /api/v1/auth/register`, added toast feedback, navigate to `/dashboard` |
| `frontend/src/pages/client/dashboard/Dashboard.jsx` | Full rewrite — fetches from 4 real API endpoints in parallel, loading skeletons, real chart data |
| `frontend/src/pages/client/inbox/Inbox.jsx` | Data layer replaced — real API for conversations and messages, Socket.io for real-time updates, optimistic UI for sends |
| `frontend/src/pages/client/profile/Profile.jsx` | Avatar upload hits `POST /api/v1/profile/avatar` (multipart), profile save hits `PUT /api/v1/profile` |
| `frontend/src/pages/client/settings/Settings.jsx` | All save buttons wired: password → `/profile/password`, notifications → `/profile/notifications`, WA settings → `/profile/wa-settings`, API key regen → `/profile/api-key`, webhook → `/profile/webhook` |

---

## WhatsApp Provider Abstraction

The entire WA layer is behind a single abstraction file:

```
WA_PROVIDER=mock  → mock.provider.js   (returns fake responses, no API needed)
WA_PROVIDER=meta  → meta.provider.js   (calls real Meta Cloud API)
```

**When you receive your Meta API credentials:**
1. Fill in `META_WA_TOKEN`, `META_WA_PHONE_ID`, `META_WA_BUSINESS_ID` in `.env`
2. Set `WA_PROVIDER=meta`
3. Register your server URL (`APP_URL/api/v1/webhooks/meta`) as the Meta webhook
4. Done — no other code changes needed

---

## Testing Messages Without Meta API

Use the dev simulate endpoint to test the full inbox flow:

```bash
POST http://localhost:5000/api/v1/conversations/dev/simulate-incoming
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "phone": "+91 98765 43210",
  "message": "Hi, I need help with my order",
  "name": "Test Customer"
}
```

This will:
1. Find or create a contact for that phone number
2. Find or create an open conversation
3. Add the message as a customer message
4. Emit a Socket.io event → inbox updates in real-time without refresh

---

## How to Run

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET at minimum
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:3000`
Backend runs at `http://localhost:5000`

---

## Environment Variables (Required)

```env
# Minimum required to run
MONGODB_URI=mongodb://localhost:27017/sarnconnect
JWT_SECRET=<random 32+ char string>

# Optional — defaults work locally
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
WA_PROVIDER=mock
```

---

## Pages Still Using Mock Data

These pages are fully built in the frontend but not yet wired to the backend (data layer is next step):

| Page | Status |
|---|---|
| Contacts | UI complete, backend endpoint ready — frontend still uses seed data |
| Templates | UI complete, backend endpoint ready — frontend still uses seed data |
| Bulk Messaging | UI complete, backend endpoint ready — frontend still uses mock wizard |
| Analytics | UI complete — needs aggregation queries added to backend |
| Billing | UI complete — needs Stripe integration |
| Chatbot Builder | UI complete — needs chatbot engine backend |
| Team & Access | UI complete — needs team member invite flow |
