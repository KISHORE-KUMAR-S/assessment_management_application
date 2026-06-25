# Assessment Builder (MERN + TypeScript)

Full-stack assessment builder. Users build assessments as **Category → Factor → Question**, launch them, and view reports.

## Stack
- **Frontend** (`/client`): Vite + React 19 + TypeScript, React Router, **shadcn/ui** (Tailwind v4), Axios.
- **Backend** (`/server`): Node + Express + TypeScript, Mongoose (MongoDB), JWT auth (bcrypt).
- **DB**: MongoDB — set `MONGO_URI` (Atlas or local) in `server/.env`.

## Structure
```
client/                 # Vite React TS app
  src/
    api/        client.ts   # axios instance, JWT interceptor
    components/ auth builder assessments launch reports layout  ui(shadcn)
    context/    auth state
    pages/      route views
    hooks/
    types/
server/                 # Express TS API
  src/
    config/     db.ts       # mongoose connect (reads MONGO_URI)
    models/     User Category Assessment Response   (Mongoose schemas)
    controllers/
    routes/
    middleware/ JWT auth guard
    services/
    app.ts  index.ts
```

## Setup
```bash
# backend
cd server
cp .env.example .env        # fill MONGO_URI, JWT_SECRET
npm install
npm run dev                 # http://localhost:5000  (GET /api/health)

# frontend
cd client
cp .env.example .env        # VITE_API_URL
npm install
npm run dev                 # http://localhost:5173
```

## Planned API
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/POST /api/categories`, `GET/PUT /api/categories/:id`
- `POST /api/assessments`, `GET /api/assessments`, `GET /api/assessments/:id`
- `POST /api/responses`, `GET /api/responses?assessmentId=...`

JWT in `Authorization: Bearer <token>`; protected routes guarded by auth middleware (server) and `ProtectedRoute` (client).

## Status
Scaffold + config only. Feature code (models, routes, pages) not yet implemented.

## Deploy (planned)
Frontend → Vercel/Netlify · Backend → Render · DB → MongoDB Atlas (M0).
