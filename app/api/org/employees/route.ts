import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { parseBearer } from "@/lib/server/jwt";
import { Lead, User, serializeUser } from "@/lib/server/models";

function computeEmployeeStatus(u: {
  disabled?: boolean;
  userType?: string;
  name?: string;
  lastLoginAt?: string;
}) {
  if (u.disabled) return "disabled";
  if (u.userType !== "organization_employee") return "not_employee";
  if (!u.name) return "incomplete_profile";
  if (!u.lastLoginAt) return "never_logged_in";
  return "active";
}

export async function GET(request: Request) {
  try {
    await connectDb();

    const auth = parseBearer(request);
    const { searchParams } = new URL(request.url);
    const explicitOrgId = String(searchParams.get("orgId") || "").trim();

    // Determine orgId from caller:
    // - admin: can pass orgId
    // - org user: orgId = self
    // - org employee: orgId = organizationId (view peers)
    let orgId = "";
    if (auth?.role === "admin") {
      orgId = explicitOrgId;
    } else if (auth?.userId) {
      const me = await User.findById(auth.userId).select({
        _id: 1,
        userType: 1,
        organizationId: 1,
        companyName: 1,
        phone: 1,
        disabled: 1,
      });
      if (!me || me.disabled) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const myType = String(me.userType || "");
      if (myType === "organization") {
        orgId = String(me._id);
      } else if (myType === "organization_employee") {
        orgId = me.organizationId ? String(me.organizationId) : "";
      } else {
        return NextResponse.json(
          { success: false, message: "Organization only" },
          { status: 403 }
        );
      }
    }

    if (!orgId || !mongoose.isValidObjectId(orgId)) {
      return NextResponse.json(
        { success: false, message: "Invalid orgId" },
        { status: 400 }
      );
    }

    const org = await User.findOne({ _id: orgId, userType: "organization" }).select({
      _id: 1,
      companyName: 1,
      phone: 1,
    });
    if (!org) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 }
      );
    }

    const employees = await User.find({
      userType: "organization_employee",
      organizationId: new mongoose.Types.ObjectId(orgId),
    })
      .sort({ createdAt: -1 })
      .limit(1000);

    const orgLeads = await Lead.find({
      userId: new mongoose.Types.ObjectId(orgId),
    })
      .select({
        assignedTo: 1,
        status: 1,
        clientId: 1,
        name: 1,
        phone: 1,
        property: 1,
        createdAt: 1,
        lastStatusUpdatedAt: 1,
        lastStatusUpdatedBy: 1,
      })
      .lean();

    const updaterIds = new Set<string>();
    for (const l of orgLeads as any[]) {
      if (l?.lastStatusUpdatedBy) updaterIds.add(String(l.lastStatusUpdatedBy));
    }
    const updaters = updaterIds.size
      ? await User.find({ _id: { $in: Array.from(updaterIds).map((id) => new mongoose.Types.ObjectId(id)) } })
          .select({ _id: 1, name: 1, phone: 1 })
          .lean()
      : [];
    const updaterMap = new Map<string, { name: string; phone: string }>();
    for (const u of updaters as any[]) {
      updaterMap.set(String(u._id), { name: String(u.name || ""), phone: String(u.phone || "") });
    }

    const leadStatsByEmployee = new Map<
      string,
      {
        total: number;
        statuses: Record<string, number>;
        recent: Array<{
          clientId: unknown;
          name: unknown;
          phone: unknown;
          property: unknown;
          status: unknown;
          createdAt: unknown;
        }>;
      }
    >();

    let unassignedTotal = 0;
    const unassignedStatuses: Record<string, number> = {};

    for (const l of orgLeads) {
      const status = String((l as any).status || "New");
      const assignedTo = (l as any).assignedTo ? String((l as any).assignedTo) : "";
      if (!assignedTo) {
        unassignedTotal += 1;
        unassignedStatuses[status] = (unassignedStatuses[status] || 0) + 1;
        continue;
      }
      const cur =
        leadStatsByEmployee.get(assignedTo) ||
        { total: 0, statuses: {} as Record<string, number>, recent: [] as any[] };
      cur.total += 1;
      cur.statuses[status] = (cur.statuses[status] || 0) + 1;
      if (cur.recent.length < 15) {
        cur.recent.push({
          clientId: (l as any).clientId,
          name: (l as any).name,
          phone: (l as any).phone,
          property: (l as any).property,
          status: (l as any).status,
          createdAt: (l as any).createdAt,
          lastStatusUpdatedAt: (l as any).lastStatusUpdatedAt || null,
          lastStatusUpdatedBy: (l as any).lastStatusUpdatedBy
            ? {
                id: String((l as any).lastStatusUpdatedBy),
                ...(updaterMap.get(String((l as any).lastStatusUpdatedBy)) || { name: "", phone: "" }),
              }
            : null,
        });
      }
      leadStatsByEmployee.set(assignedTo, cur);
    }

    const serialized = employees.map((e) => {
      const u = serializeUser(e);
      const stats = leadStatsByEmployee.get(String(u._id)) || { total: 0, statuses: {}, recent: [] };
      return {
        ...u,
        employeeStatus: computeEmployeeStatus(u),
        leadStats: stats,
      };
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: String(org._id),
        name: String(org.companyName || ""),
        phone: String(org.phone || ""),
      },
      leads: {
        total: orgLeads.length,
        unassigned: { total: unassignedTotal, statuses: unassignedStatuses },
      },
      total: serialized.length,
      employees: serialized,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

