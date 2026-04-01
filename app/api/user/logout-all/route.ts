import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/server/userContext";

/** Stateless JWT: client clears token locally. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { error } = resolveUserId(request, body.userId != null ? String(body.userId) : null);
  if (error) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
