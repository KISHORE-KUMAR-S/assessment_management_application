import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGO_URI not set — skipping DB connect");
    return;
  }
  // Fail server selection in 10s instead of the 30s default so connection
  // problems surface fast in deploy logs.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log("MongoDB connected");
}
