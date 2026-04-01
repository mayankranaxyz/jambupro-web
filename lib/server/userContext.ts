import { parseBearer } from "./jwt";

/** Resolves user id from Bearer token, or falls back to explicit userId (mobile app compatibility). */
export function resolveUserId(
  request: Request,
  explicitUserId: string | null
): { userId: string; error?: string } {
  const auth = parseBearer(request);
  if (auth?.userId) {
    if (explicitUserId && explicitUserId !== auth.userId) {
      return { userId: "", error: "userId does not match token" };
    }
    return { userId: auth.userId };
  }
  if (explicitUserId) return { userId: explicitUserId };
  return { userId: "", error: "Unauthorized" };
}
