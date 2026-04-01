import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { Notification } from "@/lib/server/models";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(_request: Request, context: Ctx) {
  try {
    await connectDb();
    const { id } = await context.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
    }

    await Notification.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { read: true } });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
