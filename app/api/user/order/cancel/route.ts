import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { Order } from "@/lib/server/models";
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

    const orderId = body.orderId;
    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order" }, { status: 400 });
    }

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    order.status = "Cancelled";
    order.cancelReason = String(body.reason || "");
    await order.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
