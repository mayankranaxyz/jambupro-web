import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { OtpPending, User } from "@/lib/server/models";
import { resolveUserId } from "@/lib/server/userContext";

export async function DELETE(request: Request) {
  try {
    await connectDb();
    const body = await request.json().catch(() => ({}));
    const explicit = body.userId != null ? String(body.userId) : null;
    const { userId, error } = resolveUserId(request, explicit);
    if (!userId || error) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const oid = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(oid).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // User requested non-destructive behavior:
    // keep all backend records; only clear pending OTP sessions.
    await OtpPending.deleteMany({ phone: String(user.phone || "") });

    return NextResponse.json({
      success: true,
      message: "Account deactivated on device. Backend data is preserved.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
