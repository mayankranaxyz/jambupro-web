import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";
import { User, serializeUser } from "@/lib/server/models";

export async function GET(request: Request) {
  try {
    await connectDb();
    const guard = requireAdmin(request);
    if (!guard.ok) {
      return NextResponse.json({ success: false, message: guard.message }, { status: 403 });
    }

    const users = await User.find().sort({ createdAt: -1 }).limit(500);
    return NextResponse.json({
      success: true,
      users: users.map((u) => serializeUser(u)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
