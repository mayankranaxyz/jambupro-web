import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { Lead, User } from "@/lib/server/models";
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

    const me = (await User.findById(userId)
      .select({ userType: 1, organizationId: 1 })
      .lean()
      .exec()) as unknown as { userType?: unknown; organizationId?: unknown } | null;
    const myType = String(me?.userType || "");
    const oid = new mongoose.Types.ObjectId(userId);

    // Individual: own leads (existing behavior).
    // Organization: org-owned leads (userId = orgId).
    // Org employee: assigned leads (assignedTo = employeeId).
    const filter =
      myType === "organization_employee"
        ? { assignedTo: oid }
        : { userId: oid };

    const leads = await Lead.find(filter).lean();
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

    const me = (await User.findById(userId)
      .select({ userType: 1 })
      .lean()
      .exec()) as unknown as { userType?: unknown } | null;
    const myType = String(me?.userType || "");

    // Org employees should not overwrite org-wide CRM store.
    if (myType === "organization_employee") {
      return NextResponse.json(
        { success: false, message: "Org employee cannot overwrite CRM leads. Ask organization to manage." },
        { status: 403 }
      );
    }

    // Organization: upsert-by-clientId to preserve assignments; then delete removed ones.
    if (myType === "organization") {
      const clientIds = leads
        .map((l: Record<string, unknown>) => l.id ?? l.clientId)
        .filter((x: unknown) => x != null);

      if (leads.length > 0) {
        const ops = leads.map((l: Record<string, unknown>) => {
          const clientId = (l.id ?? l.clientId ?? Date.now()) as never;
          const createdAt = typeof l.createdAt === "number" ? l.createdAt : Date.now();
          return {
            updateOne: {
              filter: { userId: oid, clientId },
              update: {
                $set: {
                  name: String(l.name || ""),
                  phone: String(l.phone || ""),
                  property: String(l.property || ""),
                  notes: String(l.notes || ""),
                  followUp: String(l.followUp || ""),
                  status: String(l.status || "New"),
                  createdAt,
                },
                $setOnInsert: { userId: oid, clientId },
              },
              upsert: true,
            },
          };
        });
        await Lead.bulkWrite(ops, { ordered: false });
      }

      await Lead.deleteMany({
        userId: oid,
        ...(clientIds.length ? { clientId: { $nin: clientIds } } : {}),
      });
    } else {
      // Individual (default): legacy replace-all semantics.
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
