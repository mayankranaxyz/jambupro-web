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

    const order = await Order.create({
      userId: new mongoose.Types.ObjectId(userId),
      address: body.address,
      items: body.items || [],
      totalAmount: body.totalAmount,
      paymentMode: body.paymentMode,
      status: "Pending",
    });

    return NextResponse.json({ success: true, orderId: String(order._id) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
