import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import responseRoutes from "./routes/responseRoutes.js";

const app = express();

// Behind a hosting proxy (Render/Heroku/etc.) trust the first proxy hop so
// req.ip reflects the real client — required for the auth rate limiter to key
// per-user instead of lumping everyone under the proxy IP. Opt-in via env so
// local/dev (no proxy) isn't exposed to X-Forwarded-For spoofing.
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);

// Security headers; reduce fingerprinting.
app.use(helmet());
app.disable("x-powered-by");

// CORS: allow-list of exact origins (never "*"). CLIENT_ORIGIN may be a comma-
// separated list (e.g. localhost + 127.0.0.1, or staging + prod). Trimmed so
// stray spaces don't silently break the match.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins,
  }),
);

// Explicit body size limit to bound memory use / DoS surface.
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req: Request, res: Response) =>
  res.json({ ok: true }),
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/responses", responseRoutes);

// 404
app.use((_req: Request, res: Response) =>
  res.status(404).json({ error: "Not found" }),
);

// Error handler: log details server-side; do not leak internal messages to clients in production.
app.use(
  (
    err: Error & { status?: number },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    console.error(err);
    const status = err.status || 500;
    const message =
      status < 500 || process.env.NODE_ENV !== "production"
        ? err.message || "Server error"
        : "Server error";
    res.status(status).json({ error: message });
  },
);

export default app;
