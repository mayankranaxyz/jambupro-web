import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { parseBearer } from "@/lib/server/jwt";
import { Lead, User } from "@/lib/server/models";

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const clientId = body.clientId ?? body.id ?? null;
    const clientIds = Array.isArray(body.clientIds) ? body.clientIds : null;
    const assigneeUserIdRaw = String(body.assigneeUserId || "").trim(); // empty => unassign

    if (clientId == null && (!clientIds || clientIds.length === 0)) {
      return NextResponse.json(
        { success: false, message: "clientId or clientIds required" },
        { status: 400 }
      );
    }

    let assignedTo: mongoose.Types.ObjectId | null = null;
    if (assigneeUserIdRaw) {
      if (!mongoose.isValidObjectId(assigneeUserIdRaw)) {
        return NextResponse.json({ success: false, message: "Invalid assigneeUserId" }, { status: 400 });
      }
      const assignee = await User.findOne({
        _id: new mongoose.Types.ObjectId(assigneeUserIdRaw),
        userType: "organization_employee",
        organizationId: new mongoose.Types.ObjectId(String(me._id)),
        disabled: { $ne: true },
      }).select({ _id: 1 });
      if (!assignee) {
        return NextResponse.json(
          { success: false, message: "Assignee is not an employee of this organization" },
          { status: 400 }
        );
      }
      assignedTo = assignee._id;
    }

    const orgId = new mongoose.Types.ObjectId(String(me._id));
    if (clientIds && clientIds.length > 0) {
      const res = await Lead.updateMany(
        { userId: orgId, clientId: { $in: clientIds } },
        { $set: { assignedTo } }
      );
      return NextResponse.json({ success: true, updated: res.modifiedCount || 0 });
    }

    const updated = await Lead.findOneAndUpdate(
      { userId: orgId, clientId },
      { $set: { assignedTo } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

