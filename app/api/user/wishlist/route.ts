import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { Product, Wishlist, serializeProduct } from "@/lib/server/models";
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

    const oid = new mongoose.Types.ObjectId(userId);
    const wl = await Wishlist.findOne({ userId: oid });
    const ids = wl?.productIds || [];
    if (ids.length === 0) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    const objectIds = ids
      .filter((id: string) => mongoose.isValidObjectId(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));
    const products = await Product.find({ _id: { $in: objectIds } });
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const ordered = ids
      .map((id: string) => byId.get(id))
      .filter(Boolean) as InstanceType<typeof Product>[];

    return NextResponse.json({
      success: true,
      wishlist: ordered.map((p) => serializeProduct(p)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

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
    const productId = String(body.productId || "");
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return NextResponse.json({ success: false, message: "Invalid product" }, { status: 400 });
    }

    const oid = new mongoose.Types.ObjectId(userId);
    await Wishlist.findOneAndUpdate(
      { userId: oid },
      { $addToSet: { productIds: productId } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    const productId = String(body.productId || "");
    const oid = new mongoose.Types.ObjectId(userId);
    await Wishlist.findOneAndUpdate({ userId: oid }, { $pull: { productIds: productId } });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
