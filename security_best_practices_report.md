# Security Best Practices Report — Assessment Management Application

**Date:** 2026-06-25
**Stack:** MERN + TypeScript (Express 5 backend, React 19 + Vite frontend, MongoDB/Mongoose)
**Guidance applied:** `javascript-express-web-server-security.md`, `javascript-typescript-react-web-frontend-security.md`

## Executive Summary

The app uses stateless **Bearer-token (JWT) auth in the `Authorization` header**, so classic browser **CSRF is not applicable** (good). The dominant risk class here is **broken access control (IDOR)**: every route is correctly behind `requireAuth`, but the controllers do **not scope reads/writes to the owning user (`createdBy`)**. Any authenticated user can read or modify other users' categories, assessments, and responses. A secondary risk is **NoSQL operator injection** because raw `req.body` / `req.query` fields flow into Mongoose queries without type checks. Frontend code is clean of XSS sinks; main frontend note is JWT stored in `localStorage`.

Findings ordered by severity. IDs for reference.

---

## High

### H-1 — Broken access control (IDOR) on categories
**Rule:** EXPRESS-INPUT-001 / general authz
**Location:** [categoryController.ts:4-16](server/src/controllers/categoryController.ts#L4-L16), [categoryController.ts:32-44](server/src/controllers/categoryController.ts#L32-L44)
**Evidence:**
```ts
const categories = await Category.find().sort({ createdAt: -1 }); // no createdBy filter
const cat = await Category.findById(req.params.id);                // no owner check
const cat = await Category.findByIdAndUpdate(req.params.id, {...}); // no owner check
```
**Impact:** Any logged-in user lists, reads, and **overwrites** any other user's categories. `createdBy` is stored but never enforced.
**Fix:** Scope every query by owner: `Category.find({ createdBy: req.user?.id })`; for id lookups use `findOne({ _id: req.params.id, createdBy: req.user?.id })` and `findOneAndUpdate({ _id, createdBy }, ...)`.

### H-2 — Broken access control (IDOR) on assessments
**Location:** [assessmentController.ts:11-18](server/src/controllers/assessmentController.ts#L11-L18)
**Evidence:** `const a = await Assessment.findById(req.params.id);` — list is scoped by `createdBy`, but single-get is not.
**Impact:** Any authenticated user reads any assessment (incl. embedded question tree) by guessing/enumerating IDs.
**Fix:** `Assessment.findOne({ _id: req.params.id, createdBy: req.user?.id })`.

### H-3 — Broken access control + NoSQL injection on responses listing
**Rule:** EXPRESS-INJECT-002 / authz
**Location:** [responseController.ts:18-26](server/src/controllers/responseController.ts#L18-L26)
**Evidence:**
```ts
const { assessmentId } = req.query;
const responses = await ResponseModel.find({ assessmentId }).sort({ createdAt: -1 });
```
**Impact:** (a) No check that the assessment belongs to the caller → any user reads any assessment's responses. (b) `assessmentId` is untrusted `req.query`; `?assessmentId[$ne]=` injects a Mongo operator and dumps **all** responses across all users.
**Fix:** Coerce/validate `assessmentId` to a string ObjectId; first verify the parent assessment is owned by `req.user?.id`, then query `{ assessmentId: <string>, ... }`.

### H-4 — NoSQL operator injection in auth lookups
**Rule:** EXPRESS-INJECT-002
**Location:** [authController.ts:12](server/src/controllers/authController.ts#L12), [authController.ts:29](server/src/controllers/authController.ts#L29)
**Evidence:** `await User.findOne({ username });` where `username` is raw `req.body`.
**Impact:** Passing `{"username":{"$gt":""}}` makes the query match an arbitrary user. Full login bypass is blocked because `bcrypt.compare` throws on a non-string password, but this still enables user enumeration / unexpected matches and is a fragile boundary.
**Fix:** Validate body at the route boundary (`typeof username === "string"`, same for password). Add a schema validator (zod/express-validator) and reject non-string types before querying.

---

## Medium

### M-1 — JWT stored in `localStorage` (XSS-exfiltratable)
**Rule:** REACT-AUTH-001
**Location:** [AuthContext.tsx:23-24](client/src/context/AuthContext.tsx#L23-L24), [client.ts:9](client/src/api/client.ts#L9)
**Impact:** A single XSS anywhere in the SPA can steal the 7-day bearer token. Persistent storage is readable by any JS in the origin.
**Fix (tradeoff):** Prefer short-lived in-memory access token + HttpOnly refresh cookie. If keeping `localStorage`, minimize token lifetime and add a CSP (see M-4) to reduce XSS surface. Acceptable as a documented tradeoff for a small app — note it.

### M-2 — Permissive CORS default (`origin: "*"`)
**Rule:** EXPRESS-CORS-001
**Location:** [app.ts:10](server/src/app.ts#L10)
**Evidence:** `app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));`
**Impact:** When `CLIENT_ORIGIN` is unset, any website can call the API from a browser. Lower severity because auth is via `Authorization` header (not auto-sent cookies), so an attacker site still needs the token — but `*` defeats origin allowlisting.
**Fix:** Default to the known dev origin, not `*`. Require an explicit allowlist in production; do not combine `*` with credentials.

### M-3 — No rate limiting on auth endpoints (brute force)
**Rule:** EXPRESS-AUTH-001
**Location:** [authController.ts:23-36](server/src/controllers/authController.ts#L23-L36) (login)
**Impact:** Unlimited password-guessing attempts against `/api/auth/login`.
**Fix:** Add `express-rate-limit` (or `rate-limiter-flexible`) keyed by IP + username on the auth router. Application-specific — flagging for awareness.

---

## Low

### L-1 — Missing security headers / Helmet
**Rule:** EXPRESS-HEADERS-001, EXPRESS-FINGERPRINT-001, REACT-CSP-001
**Location:** [app.ts:8-11](server/src/app.ts#L8-L11)
**Impact:** No `helmet()`, no CSP, `X-Powered-By: Express` left on. CSP is the main defense-in-depth lever against XSS (relevant to M-1).
**Fix:** `app.use(helmet())`, `app.disable("x-powered-by")`, and serve a CSP (`script-src` is the priority directive) at the edge or app.

### L-2 — No request body size limit
**Rule:** EXPRESS-BODY-001
**Location:** [app.ts:11](server/src/app.ts#L11)
**Evidence:** `app.use(express.json());` (defaults to 100kb, but not explicit; embedded category/factor/question trees can be large).
**Fix:** `express.json({ limit: "100kb" })` — set deliberately.

### L-3 — Error handler echoes `err.message` to client
**Rule:** EXPRESS-ERROR-001
**Location:** [app.ts:24-27](server/src/app.ts#L24-L27)
**Impact:** Mongoose/internal messages reach the client. Low risk (no stack trace), but can leak schema/field detail.
**Fix:** Return a generic message for 500s in production; keep `console.error` server-side only.

---

## Not Issues (verified)

- **CSRF** — N/A. Auth is `Authorization: Bearer`, not cookies (EXPRESS-CSRF-001 / REACT-CSRF-001 note).
- **Frontend XSS sinks** — none. No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or untrusted `href/src`. React escaping intact.
- **TLS / Secure cookies** — not flagged; dev runs over HTTP and no cookies are used.

---

## Suggested fix order
1. H-1, H-2, H-3 — add `createdBy` ownership scoping to all controller queries (core access control).
2. H-3, H-4 — add input validation (string coercion / zod) at route boundaries to kill operator injection.
3. M-2, M-3, L-1, L-2 — backend hardening (CORS allowlist, rate limit, helmet, body limit).
4. M-1, L-3 — token storage tradeoff decision + error message hygiene.
