import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { User, serializeUser } from "@/lib/server/models";
import { resolveUserId } from "@/lib/server/userContext";

export async function GET(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const u = serializeUser(user);
    return NextResponse.json({
      success: true,
      user: {
        ...u,
        name: u.name,
        phone: u.phone,
        altPhone: u.altPhone,
        address: u.address,
        city: u.city,
        state: u.state,
        pincode: u.pincode,
        country: u.country,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
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

    const profile = body.profile || {};
    const address = profile.address || {};

    const update: Record<string, string> = {
      userType: String(profile.userType || ""),
      name: String(profile.name || ""),
      email: String(profile.email || ""),
      altPhone: String(profile.altPhone || ""),
      profilePic: String(profile.profilePic || ""),
      companyLogo: String(profile.companyLogo || ""),
      companyName: String(profile.companyName || ""),
      reraNumber: String(profile.reraNumber || ""),
      gstNumber: String(profile.gstNumber || ""),
      country: String(address.country || "India"),
      state: String(address.state || ""),
      city: String(address.city || ""),
      pincode: String(address.pincode || ""),
      address: String(address.addressLine || ""),
    };

    const user = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      { $set: update },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: serializeUser(user) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}

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

    const user = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      {
        $set: {
          userType: "",
          name: "",
          email: "",
          profilePic: "",
          companyLogo: "",
          companyName: "",
          reraNumber: "",
          gstNumber: "",
          altPhone: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: serializeUser(user) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
