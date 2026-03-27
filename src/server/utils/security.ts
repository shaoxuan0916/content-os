import { headers } from "next/headers";
import { getEnv } from "@/server/config";

export async function assertInternalRequest() {
  const env = getEnv();
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get("authorization");
  const cronHeader = requestHeaders.get("x-vercel-cron");
  const secret = authHeader?.replace(/^Bearer\s+/i, "");

  if (cronHeader === "1") {
    return;
  }

  if (secret !== env.INTERNAL_API_SECRET) {
    throw new Error("Unauthorized internal request.");
  }
}
