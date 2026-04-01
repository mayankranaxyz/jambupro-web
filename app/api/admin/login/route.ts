import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { AdminAuth } from "@/lib/server/models";

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    const admin = await AdminAuth.findOne({ username })
      .select("_id username name active passwordHash")
      .lean<{
        _id: unknown;
        username: string;
        name?: string;
        active: boolean;
        passwordHash: string;
      }>();
    if (!admin || !admin.active) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, message: "JWT_SECRET is required" }, { status: 500 });
    }

    const token = jwt.sign(
      { sub: String(admin._id), role: "admin", kind: "admin-dashboard" },
      secret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      admin: { username: admin.username, name: admin.name || "Admin" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
