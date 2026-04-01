import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";
import { Lead } from "@/lib/server/models";

export async function GET(request: Request) {
  try {
    await connectDb();
    const guard = requireAdmin(request);
    if (!guard.ok) {
      return NextResponse.json({ success: false, message: guard.message }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const filter =
      userId && mongoose.isValidObjectId(userId)
        ? { userId: new mongoose.Types.ObjectId(userId) }
        : {};

    const list = await Lead.find(filter).sort({ updatedAt: -1 }).limit(2000).lean();
    const leads = list.map((l) => ({
      _id: String(l._id),
      userId: String(l.userId),
      clientId: l.clientId,
      name: l.name,
      phone: l.phone,
      property: l.property,
      notes: l.notes,
      followUp: l.followUp,
      status: l.status,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({ success: true, leads });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
