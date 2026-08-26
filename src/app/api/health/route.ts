import mongoose from "mongoose";

import { apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export function GET() {
  const database = [1, 2].includes(mongoose.connection.readyState)
    ? "connected"
    : "not-connected";

  return apiSuccess({
    status: "ok",
    database,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}
