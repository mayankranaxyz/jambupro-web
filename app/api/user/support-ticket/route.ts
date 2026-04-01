import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { SupportTicket } from "@/lib/server/models";
import { resolveUserId } from "@/lib/server/userContext";

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
    const { userId, error } = resolveUserId(request, body.userId != null ? String(body.userId) : null);
    if (!userId || error) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    if (!subject || !message) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    await SupportTicket.create({
      userId: new mongoose.Types.ObjectId(userId),
      subject,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
