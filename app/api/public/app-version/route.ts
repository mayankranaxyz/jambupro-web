import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { AppVersionConfig } from "@/lib/server/models";

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number(n || 0));
  const pb = b.split(".").map((n) => Number(n || 0));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

export async function GET(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const appVersion = String(searchParams.get("version") || "");
    const platform = String(searchParams.get("platform") || "").toLowerCase();

    const config = await AppVersionConfig.findOne({ key: "mobile" }).lean();
    if (!config) {
      return NextResponse.json({ success: true, forceUpdate: false, hasUpdate: false });
    }

    const minRequiredVersion = String(config.minRequiredVersion || "");
    const latestVersion = String(config.latestVersion || "");
    const forceUpdate = appVersion && minRequiredVersion
      ? compareVersions(appVersion, minRequiredVersion) < 0
      : false;
    const hasUpdate = appVersion && latestVersion
      ? compareVersions(appVersion, latestVersion) < 0
      : false;

    const updateUrl = platform === "android"
      ? config.androidUrl || config.defaultUrl || ""
      : platform === "ios"
        ? config.iosUrl || config.defaultUrl || ""
        : config.defaultUrl || "";

    return NextResponse.json({
      success: true,
      forceUpdate,
      hasUpdate,
      latestVersion,
      minRequiredVersion,
      message: config.message || "",
      updateUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
