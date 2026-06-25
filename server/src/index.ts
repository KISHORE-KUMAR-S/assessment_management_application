import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function start(): Promise<void> {
  await connectDB();
  const server = app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

  // Clear, actionable message instead of an unhandled 'error' crash dump.
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} already in use. Stop the other process or set PORT in .env.`);
      process.exit(1);
    }
    throw err;
  });

  // Release the port on shutdown so tsx-watch restarts don't orphan a listener.
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
