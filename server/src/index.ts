import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Retry the DB connection in the background instead of crashing the process.
// The HTTP server binds first so the platform (Render) detects the open port
// and keeps the service up; routes that hit Mongo will error until it connects.
async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await connectDB();
  } catch (err) {
    const wait = Math.min(30_000, 2_000 * attempt);
    console.error(
      `MongoDB connect failed (attempt ${attempt}): ${(err as Error).message}. Retrying in ${wait / 1000}s.`
    );
    setTimeout(() => void connectWithRetry(attempt + 1), wait);
  }
}

function start(): void {
  const server = app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

  // Clear, actionable message instead of an unhandled 'error' crash dump.
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} already in use. Stop the other process or set PORT in .env.`);
      process.exit(1);
    }
    throw err;
  });

  void connectWithRetry();

  // Release the port on shutdown so tsx-watch restarts don't orphan a listener.
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
