import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("MONGO_URI not set — skipping DB connect");
    return;
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
