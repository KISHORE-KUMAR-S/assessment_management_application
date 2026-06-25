# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full-stack MERN + TypeScript "Assessment Builder". Users compose assessments as a
**Category → Factor → Question** hierarchy, launch them to collect responses, and view reports.
Two independently-installed npm projects: `server/` (Express API) and `client/` (Vite React SPA).
There is no root `package.json` — run commands inside each subdirectory.

Note: `README.md` says "Scaffold + config only" but is stale — feature code (models, controllers,
routes, pages, builder UI) is implemented.

## Commands

Backend (`cd server`):
- `npm run dev` — tsx watch on `src/index.ts`, serves http://localhost:5000 (`GET /api/health`)
- `npm run build` — `tsc` → `dist/`
- `npm start` — run compiled `dist/index.js`
- `npm test` — Jest (no tests written yet)

Frontend (`cd client`):
- `npm run dev` — Vite dev server at http://localhost:5173
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — **oxlint** (not ESLint), config in `client/.oxlintrc.json`
- `npm run preview` — preview production build

Env: copy `.env.example` → `.env` in each dir. Server needs `MONGO_URI`, `JWT_SECRET`,
optional `PORT`/`CLIENT_ORIGIN`. Client needs `VITE_API_URL` (defaults to `http://localhost:5000/api`).

## Architecture

### Core data model: the Category/Factor/Question tree
The same nested shape (`Factor` → `Question[]`) is defined once in `server/src/models/subdocs.ts`
and reused as embedded Mongoose subdocuments by both `Category` and `Assessment`.

- **`Category`** is a reusable, standalone template the user authors in the builder.
- **`Assessment`** does **not reference** categories — it embeds **deep copies** of them
  (`IAssessmentCategory` with its own factors/questions) so that editing a Category later never
  mutates an already-launched Assessment. This snapshot-on-create design is intentional; preserve it.
- **`Response`** stores answers keyed by `questionId` (string), with `value` as a Mixed type
  (`string | number | string[]`) to cover the three `QuestionType`s: `multiple_choice`, `rating`, `text`.

### Backend (Express, ESM TypeScript)
- ESM project (`"type": "module"`): **all relative imports use `.js` extensions** even from `.ts`
  source (e.g. `import ... from "./routes/authRoutes.js"`). Keep this when adding files.
- `index.ts` connects Mongo then starts the app; `app.ts` wires middleware + routers and holds the
  central 404 + error handler. Per-route: `requireAuth` guard → `asyncHandler`-wrapped controller.
- `asyncHandler` (`utils/asyncHandler.ts`) wraps every async controller so rejections reach the
  error middleware — controllers themselves do no try/catch. Add new routes the same way.
- Auth: JWT in `Authorization: Bearer <token>`. `middleware/auth.ts` verifies and attaches
  `req.user` (typed via a `declare global` Express augmentation). Routers call `router.use(requireAuth)`
  to protect all their routes. Ownership is scoped by `createdBy: req.user?.id`.
- Route prefixes (in `app.ts`): `/api/auth`, `/api/categories`, `/api/assessments`, `/api/responses`.

### Frontend (React 19 + Vite)
- `@/*` path alias → `client/src/*` (configured in both `vite.config.ts` and tsconfig).
- Routing in `App.tsx`: public `/login` `/register`; everything else nested under
  `<ProtectedRoute>` → `<AppLayout>` (`/builder`, `/assessments`, `/launch/:assessmentId`, `/reports`).
  Unknown paths redirect to `/builder`.
- Auth state in `context/AuthContext.tsx`: `useState` seeded from `localStorage` (`token` + `user`).
  Token/user persist to localStorage; `useAuth()` throws if used outside the provider.
- API layer in `src/api/`: `client.ts` is a shared axios instance whose request interceptor injects
  the JWT from localStorage. Per-resource modules (`auth.ts`, `categories.ts`, `assessments.ts`)
  build on it — add new endpoints there, not with raw axios.
- UI is **shadcn/ui on Tailwind v4** built over `@base-ui/react` (not Radix). `components.json` drives
  the shadcn CLI; primitives live in `components/ui/`. Feature components are grouped by domain
  (`auth/`, `builder/`, `layout/`). Toasts via `sonner`.
