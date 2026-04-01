import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { SupportTicket } from "@/lib/server/models";
import { resolveUserId } from "@/lib/server/userContext";

export async function GET(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const { userId, error } = resolveUserId(request, searchParams.get("userId"));
    if (!userId || error) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const list = await SupportTicket.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    const tickets = list.map((t) => ({
      _id: String(t._id),
      subject: t.subject,
      message: t.message,
      status: t.status,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({ success: true, tickets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
