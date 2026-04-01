import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";
import { AppVersionConfig } from "@/lib/server/models";

export async function GET(request: Request) {
  try {
    await connectDb();
    const guard = requireAdmin(request);
    if (!guard.ok) {
      return NextResponse.json({ success: false, message: guard.message }, { status: 403 });
    }

    const config =
      (await AppVersionConfig.findOne({ key: "mobile" }).lean()) ||
      (await AppVersionConfig.create({ key: "mobile" }));

    return NextResponse.json({ success: true, config });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDb();
    const guard = requireAdmin(request);
    if (!guard.ok) {
      return NextResponse.json({ success: false, message: guard.message }, { status: 403 });
    }

    const body = await request.json();
    const payload = {
      latestVersion: String(body?.latestVersion || ""),
      minRequiredVersion: String(body?.minRequiredVersion || ""),
      message: String(body?.message || ""),
      defaultUrl: String(body?.defaultUrl || ""),
      androidUrl: String(body?.androidUrl || ""),
      iosUrl: String(body?.iosUrl || ""),
    };

    const config = await AppVersionConfig.findOneAndUpdate(
      { key: "mobile" },
      { $set: payload, $setOnInsert: { key: "mobile" } },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ success: true, config });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
