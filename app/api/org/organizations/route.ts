import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { User } from "@/lib/server/models";

export async function GET() {
  try {
    await connectDb();
    const orgs = await User.find({
      userType: "organization",
      companyName: { $exists: true, $ne: "" },
    })
      .select({ _id: 1, companyName: 1, phone: 1, city: 1, state: 1 })
      .sort({ companyName: 1 })
      .limit(500);

    return NextResponse.json({
      success: true,
      organizations: orgs.map((o) => ({
        id: String(o._id),
        name: String(o.companyName || ""),
        phone: String(o.phone || ""),
        city: String(o.city || ""),
        state: String(o.state || ""),
        // Helps disambiguate same-named organizations in UI lists.
        label: `${String(o.companyName || "").trim()}${o.phone ? ` • ${String(o.phone)}` : ""}${
          o.city || o.state
            ? ` • ${[String(o.city || "").trim(), String(o.state || "").trim()]
                .filter(Boolean)
                .join(", ")}`
            : ""
        } • ${String(o._id).slice(-6)}`,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

