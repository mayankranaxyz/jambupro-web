import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { parseBearer } from "@/lib/server/jwt";
import { Lead, User } from "@/lib/server/models";

type UpdateBody = {
  clientId?: unknown;
  status?: unknown;
  notes?: unknown;
  followUp?: unknown;
};

export async function POST(request: Request) {
  try {
    await connectDb();
    const auth = parseBearer(request);
    if (!auth?.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as UpdateBody;
    const clientId = body.clientId;
    if (clientId == null) {
      return NextResponse.json({ success: false, message: "clientId required" }, { status: 400 });
    }

    const actor = (await User.findById(auth.userId)
      .select({ _id: 1, userType: 1, organizationId: 1, disabled: 1, name: 1, phone: 1 })
      .lean()
      .exec()) as unknown as {
      _id: mongoose.Types.ObjectId;
      userType?: unknown;
      organizationId?: mongoose.Types.ObjectId | null;
      disabled?: unknown;
    } | null;

    if (!actor || Boolean(actor.disabled)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const actorType = String(actor.userType || "");
    const actorId = new mongoose.Types.ObjectId(String(actor._id));

    // Find lead that actor is allowed to update:
    // - individual: lead.userId = actorId
    // - organization: lead.userId = orgId (actorId)
    // - org employee: lead.assignedTo = actorId (assigned lead)
    const filter =
      actorType === "organization_employee"
        ? { assignedTo: actorId, clientId }
        : { userId: actorId, clientId };

    const lead = await Lead.findOne(filter);
    if (!lead) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    const now = new Date();
    const updates: Record<string, unknown> = {};

    const newStatus = body.status != null ? String(body.status || "") : null;
    const newNotes = body.notes != null ? String(body.notes || "") : null;
    const newFollowUp = body.followUp != null ? String(body.followUp || "") : null;

    // Status change audit
    if (newStatus != null && newStatus.length > 0 && newStatus !== String(lead.status || "")) {
      const from = String(lead.status || "");
      updates.status = newStatus;
      updates.lastStatusUpdatedAt = now;
      updates.lastStatusUpdatedBy = actorId;
      (lead as any).activity = Array.isArray((lead as any).activity) ? (lead as any).activity : [];
      (lead as any).activity.push({
        type: "status",
        at: now,
        by: actorId,
        fromStatus: from,
        toStatus: newStatus,
        note: "",
      });
    }

    // Notes audit (only if explicitly provided)
    if (newNotes != null && newNotes !== String(lead.notes || "")) {
      updates.notes = newNotes;
      (lead as any).activity = Array.isArray((lead as any).activity) ? (lead as any).activity : [];
      (lead as any).activity.push({
        type: "note",
        at: now,
        by: actorId,
        fromStatus: "",
        toStatus: "",
        note: String(newNotes).slice(0, 280),
      });
    }

    // Follow-up audit
    if (newFollowUp != null && newFollowUp !== String(lead.followUp || "")) {
      updates.followUp = newFollowUp;
      (lead as any).activity = Array.isArray((lead as any).activity) ? (lead as any).activity : [];
      (lead as any).activity.push({
        type: "followUp",
        at: now,
        by: actorId,
        fromStatus: "",
        toStatus: "",
        note: String(newFollowUp).slice(0, 280),
      });
    }

    if (Object.keys(updates).length === 0 && !Array.isArray((lead as any).activity)) {
      return NextResponse.json({ success: true });
    }

    updates.lastActivityAt = now;
    updates.lastActivityBy = actorId;

    // Apply updates + keep activity capped
    Object.assign(lead, updates);
    if (Array.isArray((lead as any).activity) && (lead as any).activity.length > 80) {
      (lead as any).activity = (lead as any).activity.slice(-80);
    }
    await lead.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

