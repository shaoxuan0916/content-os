import { headers } from "next/headers";

export class UnauthorizedCronRequestError extends Error {
  constructor(message = "Unauthorized cron request.") {
    super(message);
    this.name = "UnauthorizedCronRequestError";
  }
}

export async function assertCronRequest() {
  const requestHeaders = await headers();
  const authHeader = requestHeaders.get("authorization");
  const secret = authHeader?.replace(/^Bearer\s+/i, "");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    throw new UnauthorizedCronRequestError("CRON_SECRET is not configured.");
  }

  if (secret === expectedSecret) {
    return;
  }

  throw new UnauthorizedCronRequestError();
}
