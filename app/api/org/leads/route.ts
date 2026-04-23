import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { parseBearer } from "@/lib/server/jwt";
import { Lead, User } from "@/lib/server/models";

export async function GET(request: Request) {
  try {
    await connectDb();
    const auth = parseBearer(request);
    if (!auth?.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const me = (await User.findById(auth.userId)
      .select({ _id: 1, userType: 1, disabled: 1 })
      .lean()
      .exec()) as unknown as { _id: unknown; userType?: unknown; disabled?: unknown } | null;
    if (!me || Boolean(me.disabled)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (String(me.userType || "") !== "organization") {
      return NextResponse.json({ success: false, message: "Organization only" }, { status: 403 });
    }

    const orgId = new mongoose.Types.ObjectId(String(me._id));
    const list = await Lead.find({ userId: orgId })
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();

    const assigneeIds = new Set<string>();
    const updaterIds = new Set<string>();
    for (const l of list as any[]) {
      if (l?.assignedTo) assigneeIds.add(String(l.assignedTo));
      if (l?.lastStatusUpdatedBy) updaterIds.add(String(l.lastStatusUpdatedBy));
    }

    const peopleIds = Array.from(new Set([...assigneeIds, ...updaterIds]));
    const people = peopleIds.length
      ? await User.find({ _id: { $in: peopleIds.map((id) => new mongoose.Types.ObjectId(id)) } })
          .select({ _id: 1, name: 1, phone: 1, userType: 1 })
          .lean()
      : [];
    const peopleMap = new Map<string, { id: string; name: string; phone: string; userType: string }>();
    for (const p of people as any[]) {
      peopleMap.set(String(p._id), {
        id: String(p._id),
        name: String(p.name || ""),
        phone: String(p.phone || ""),
        userType: String(p.userType || ""),
      });
    }

    const leads = (list as any[]).map((l) => ({
      clientId: l.clientId,
      name: l.name || "",
      phone: l.phone || "",
      property: l.property || "",
      status: l.status || "New",
      notes: l.notes || "",
      followUp: l.followUp || "",
      createdAt: l.createdAt || 0,
      assignedTo: l.assignedTo ? peopleMap.get(String(l.assignedTo)) || { id: String(l.assignedTo), name: "", phone: "", userType: "" } : null,
      lastStatusUpdatedAt: l.lastStatusUpdatedAt ? new Date(l.lastStatusUpdatedAt).toISOString() : "",
      lastStatusUpdatedBy: l.lastStatusUpdatedBy ? peopleMap.get(String(l.lastStatusUpdatedBy)) || { id: String(l.lastStatusUpdatedBy), name: "", phone: "", userType: "" } : null,
    }));

    return NextResponse.json({ success: true, total: leads.length, leads });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

