import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/server/userContext";

/** OTP-based app: password change is a no-op success for UI compatibility. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { error } = resolveUserId(request, body.userId != null ? String(body.userId) : null);
  if (error) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    message: "Account uses mobile OTP sign-in; no password stored.",
  });
}
