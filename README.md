# Assessment Management Application (MERN + TypeScript)

Full-stack app to build structured assessments (**Category → Factor → Question**), launch them
to collect responses, and read aggregated reports. Authenticated, single-workspace.

- **Frontend** (`/client`): Vite + React 19 + TypeScript, React Router, shadcn/ui on base-ui +
  Tailwind v4, Axios, sonner.
- **Backend** (`/server`): Node + Express + TypeScript (ESM), Mongoose, JWT (bcryptjs),
  helmet, express-rate-limit.
- **DB**: MongoDB (Atlas or local).

Two independent npm projects — no root `package.json`. Run commands inside each subdir.

## Features

- **Auth** — register / login (JWT); all app routes gated by `ProtectedRoute` (client) +
  `requireAuth` (server).
- **Builder** — accordion hierarchy Category → Factor → Question, inline edit, a question-config
  popup (pick types + count), and **Load Categories** to append previously saved categories.
- **Assessments** — list of published assessments; launch from here.
- **Launch Pad** — take an assessment and submit responses.
- **Reports** — searchable assessment selector, per-question **summary** (MCQ bars, rating
  avg + distribution, text comments), and collapsible **individual responses**.

## Setup

```bash
# 1. Database — create a MongoDB Atlas M0 cluster (or run mongod locally), grab the URI.

# 2. Backend
cd server
cp .env.example .env          # fill MONGO_URI, JWT_SECRET
npm install
npm run dev                   # http://localhost:5000  (GET /api/health)

# 3. Frontend
cd client
cp .env.example .env          # VITE_API_URL (defaults to http://localhost:5000/api)
npm install
npm run dev                   # http://localhost:5173
```

### Env vars

**server/.env**: `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` (def `7d`),
`CLIENT_ORIGIN` (CORS allow-list), `TRUST_PROXY` (set `1` behind a proxy in prod).
**client/.env**: `VITE_API_URL`.

### Scripts

- server: `npm run dev` (tsx watch) · `npm run build` (tsc → `dist/`) · `npm start`
- client: `npm run dev` · `npm run build` (tsc -b + vite) · `npm run lint` (oxlint) · `npm run preview`

## Architecture

### Data model
`Factor → Question[]` shape defined once (`server/src/models/subdocs.ts`), embedded by both
`Category` and `Assessment`.

- **Category** — reusable template the user authors / saves.
- **Assessment** — embeds **deep copies** of categories (snapshot-on-create), so editing a
  category later never mutates an already-launched assessment.
- **Response** — answers keyed by `questionId`, `value` is Mixed (`string | number | string[]`)
  covering the three question types: `multiple_choice`, `rating`, `text`.

### Backend
ESM TypeScript (relative imports use `.js`). `index.ts` connects Mongo then starts `app.ts`,
which wires helmet → CORS → JSON limit → routers → 404 → central error handler. Each route:
`requireAuth` → `asyncHandler`-wrapped controller (no try/catch in controllers). JWT in
`Authorization: Bearer <token>`; ownership scoped by `createdBy: req.user.id` (prevents IDOR).

Routes: `/api/auth` (register/login/me), `/api/categories`, `/api/assessments`, `/api/responses`.

### Frontend
`@/*` → `client/src/*`. Public `/login` `/register`; everything else under
`ProtectedRoute → AppLayout` (`/builder`, `/assessments`, `/launch`, `/launch/:id`, `/reports`).
Auth state in `context/AuthContext` (seeded from localStorage). API layer in `src/api/`:
shared axios instance injects the JWT; per-resource modules build on it.

## Key decisions

- **Snapshot-on-create** assessments (deep copy, not reference) — launched assessments stay
  immutable when templates change.
- **base-ui** under shadcn/ui (style `base-nova`), not Radix — all primitives
  (Combobox, Avatar, ScrollArea, Accordion…) built on `@base-ui/react`.
- **Builder draft persisted to localStorage** — survives reload; cleared on publish.
- **Security**: NoSQL-injection guards (reject non-string creds), bcrypt, credential validation
  (username regex, password 8–72), constant-time login to resist user enumeration, rate-limited
  auth endpoints, helmet, explicit CORS + body-size limit.

## Deployment

| Piece | Host |
|---|---|
| DB | MongoDB Atlas M0 |
| Server | Render Web Service — root `server`, build `npm install && npm run build`, start `npm start` |
| Client | Vercel — root `client`, build `npm run build`, output `dist` (`vercel.json` handles SPA rewrites) |

Order: Atlas → Render → Vercel. On Render set `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`,
`TRUST_PROXY=1`, `CLIENT_ORIGIN=<vercel url>`. On Vercel set `VITE_API_URL=<render url>/api`.
Atlas Network Access must allow Render (use `0.0.0.0/0` — IPs are dynamic).

## AI usage summary

- **Tool**: Claude Code (caveman mode), with the emil-design-eng and security-best-practices skills.
- **Sample prompts**:
  - "Refactor the Builder to accordion-style hierarchy with a question-config popup and Load Categories."
  - "Refactor the Reports assessment selector to a shadcn Combobox with search, loading/empty/error states."
  - "Redesign Reports with Summary + Individual Responses using Emil Kowalski's principles."
  - "Security-review the login/signup page."
- **AI-generated**: accordion Builder, Combobox/Avatar/ScrollArea/Separator UI wrappers,
  redesigned Reports, account-menu (Avatar + DropdownMenu + confirm Dialog), auth hardening,
  this README.
- **Manually directed / decided**: feature scope, base-ui-over-Radix constraint, snapshot data
  model, deployment topology; all AI output was typechecked (`tsc`), linted (oxlint), and
  build-verified before acceptance.
