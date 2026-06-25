import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import responseRoutes from "./routes/responseRoutes.js";

const app = express();

// Security headers; reduce fingerprinting.
app.use(helmet());
app.disable("x-powered-by");

// CORS: default to the known dev origin, not "*". Set CLIENT_ORIGIN explicitly in production.
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));

// Explicit body size limit to bound memory use / DoS surface.
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/responses", responseRoutes);

// 404
app.use((_req: Request, res: Response) => res.status(404).json({ error: "Not found" }));

// Error handler: log details server-side; do not leak internal messages to clients in production.
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const status = err.status || 500;
  const message =
    status < 500 || process.env.NODE_ENV !== "production"
      ? err.message || "Server error"
      : "Server error";
  res.status(status).json({ error: message });
});

export default app;
