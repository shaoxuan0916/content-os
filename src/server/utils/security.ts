import { headers } from "next/headers";
import { getEnv } from "@/server/config";

export async function assertCronRequest() {
  const env = getEnv();
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get("authorization");
  const cronHeader = requestHeaders.get("x-vercel-cron");
  const secret = authHeader?.replace(/^Bearer\s+/i, "");

  if (env.CRON_SECRET) {
    if (secret !== env.CRON_SECRET) {
      throw new Error("Unauthorized cron request.");
    }

    return;
  }

  if (cronHeader === "1") {
    return;
  }

  throw new Error("Unauthorized cron request.");
}
