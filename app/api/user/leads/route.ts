import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { Lead } from "@/lib/server/models";
import { resolveUserId } from "@/lib/server/userContext";

function leadToApp(doc: InstanceType<typeof Lead>) {
  const o = doc.toObject();
  return {
    id: o.clientId,
    name: o.name,
    phone: o.phone,
    property: o.property,
    notes: o.notes,
    followUp: o.followUp,
    status: o.status,
    createdAt: o.createdAt,
  };
}

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

    const leads = await Lead.find({ userId: new mongoose.Types.ObjectId(userId) }).lean();
    const mapped = leads.map((l) => ({
      id: l.clientId,
      name: l.name,
      phone: l.phone,
      property: l.property,
      notes: l.notes,
      followUp: l.followUp,
      status: l.status,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({ success: true, leads: mapped });
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

    const leads = Array.isArray(body.leads) ? body.leads : [];
    const oid = new mongoose.Types.ObjectId(userId);

    await Lead.deleteMany({ userId: oid });

    if (leads.length > 0) {
      const docs = leads.map((l: Record<string, unknown>) => ({
        userId: oid,
        clientId: l.id ?? l.clientId ?? Date.now(),
        name: String(l.name || ""),
        phone: String(l.phone || ""),
        property: String(l.property || ""),
        notes: String(l.notes || ""),
        followUp: String(l.followUp || ""),
        status: String(l.status || "New"),
        createdAt: typeof l.createdAt === "number" ? l.createdAt : Date.now(),
      }));
      await Lead.insertMany(docs);
    }

    const saved = await Lead.find({ userId: oid });
    return NextResponse.json({
      success: true,
      leads: saved.map((d) => leadToApp(d)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
