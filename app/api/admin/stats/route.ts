import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/admin";
import { Lead, User } from "@/lib/server/models";

export async function GET(request: Request) {
  try {
    await connectDb();
    const guard = requireAdmin(request);
    if (!guard.ok) {
      return NextResponse.json({ success: false, message: guard.message }, { status: 403 });
    }

    const [totalUsers, totalLeads, statusAgg, userLeadAgg] = await Promise.all([
      User.countDocuments({}),
      Lead.countDocuments({}),
      Lead.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Lead.aggregate([{ $group: { _id: "$userId", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    ]);

    const statuses = statusAgg.map((s) => ({ status: String(s._id || "New"), count: Number(s.count || 0) }));
    const topUsers = userLeadAgg.map((u) => ({ userId: String(u._id), count: Number(u.count || 0) }));

    return NextResponse.json({
      success: true,
      stats: { totalUsers, totalLeads, statuses, topUsers },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
