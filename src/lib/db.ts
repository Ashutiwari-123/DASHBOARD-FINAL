import mongoose from "mongoose";

import { env } from "@/lib/env";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};
const cache = globalForMongoose.mongooseCache ?? {
  connection: null,
  promise: null,
};
globalForMongoose.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");

  cache.promise ??= mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
  });
  cache.connection = await cache.promise;
  return cache.connection;
}
