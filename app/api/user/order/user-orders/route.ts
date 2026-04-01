import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { Order } from "@/lib/server/models";
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

    const list = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    const orders = list.map((o) => ({
      _id: String(o._id),
      status: o.status,
      items: o.items,
      totalAmount: o.totalAmount,
      paymentMode: o.paymentMode,
      address: o.address,
      createdAt: o.createdAt,
      cancelReason: o.cancelReason,
    }));

    return NextResponse.json({ success: true, orders });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
