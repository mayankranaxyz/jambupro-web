import { parseBearer } from "@/lib/server/jwt";

export function requireAdmin(request: Request): { ok: true } | { ok: false; message: string } {
  const auth = parseBearer(request);
  if (!auth?.userId || auth.role !== "admin") {
    return { ok: false, message: "Admin only" };
  }
  return { ok: true };
}
