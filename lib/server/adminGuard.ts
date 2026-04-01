import { NextResponse } from "next/server";
import { parseBearer } from "./jwt";

export function getAdminOrReject(request: Request): { userId: string } | NextResponse {
  const auth = parseBearer(request);
  if (!auth?.userId || auth.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });
  }
  return { userId: auth.userId };
}
