import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { OtpPending, User } from "@/lib/server/models";
import { hashOtp, sendSmsOtp } from "@/lib/server/twoFactor";
import { ensureDemoProduct } from "@/lib/server/seed";

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
}

export async function POST(request: Request) {
  let body: {
    phone?: string;
    userType?: string;
    organizationName?: string;
    organizationId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body (need JSON with phone)" },
      { status: 400 }
    );
  }

  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
  const userType = String(body.userType || "").trim();
  const organizationName = String(body.organizationName || "").trim();
  const organizationId = String(body.organizationId || "").trim();
  const testBypassPhone = process.env.TEST_BYPASS_PHONE || "9999999999";
  if (phone.length !== 10) {
    return NextResponse.json(
      { success: false, message: "Enter valid 10-digit phone number" },
      { status: 400 }
    );
  }

  const allowedUserTypes = new Set([
    "",
    "organization",
    "organization_employee",
    "individual",
  ]);
  if (!allowedUserTypes.has(userType)) {
    return NextResponse.json(
      { success: false, message: "Invalid userType" },
      { status: 400 }
    );
  }
  if (userType === "organization_employee") {
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "Organization selection required" },
        { status: 400 }
      );
    }
  }
  if (userType === "organization") {
    if (!organizationName) {
      return NextResponse.json(
        { success: false, message: "Organization name required" },
        { status: 400 }
      );
    }
    if (organizationName.length > 120) {
      return NextResponse.json(
        { success: false, message: "Organization name too long" },
        { status: 400 }
      );
    }
  }

  try {
    await connectDb();
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: `Database connect nahi ho paya: ${errMsg(e)}. .env mein MONGODB_URI check karo; Atlas par IP whitelist (0.0.0.0/0 dev ke liye).`,
      },
      { status: 500 }
    );
  }

  try {
    await ensureDemoProduct();
  } catch (e) {
    return NextResponse.json(
      { success: false, message: `DB seed error: ${errMsg(e)}` },
      { status: 500 }
    );
  }

  try {
    // IMPORTANT: Do NOT create/update user until OTP is verified.
    // For org-employee, validate org exists & store reference in pending.
    let employeeOrg: { _id: unknown; companyName?: unknown; phone?: unknown } | null = null;
    if (userType === "organization_employee") {
      employeeOrg = (await User.findOne({
        _id: organizationId,
        userType: "organization",
      })
        .select({ _id: 1, companyName: 1, phone: 1 })
        .lean()
        .exec()) as unknown as { _id: unknown; companyName?: unknown; phone?: unknown } | null;
      if (!employeeOrg || !employeeOrg.companyName) {
        return NextResponse.json(
          { success: false, message: "Selected organization not found" },
          { status: 400 }
        );
      }
    }
    const existing = await OtpPending.findOne({ phone }).sort({ createdAt: -1 });

    // Dedicated QA bypass number (no SMS hit).
    if (phone === testBypassPhone) {
      const otp = process.env.TEST_BYPASS_OTP || "9999";
      await OtpPending.findOneAndUpdate(
        { phone },
        {
          $set: {
            sessionId: "DEV_SESSION",
            otpHash: hashOtp(String(otp)),
            pendingUserType: userType,
            pendingOrganizationId:
              userType === "organization_employee" && employeeOrg
                ? (employeeOrg._id as never)
                : null,
            pendingCompanyName:
              userType === "organization"
                ? organizationName
                : userType === "organization_employee" && employeeOrg
                  ? String(employeeOrg.companyName)
                  : "",
            lastSentAt: new Date(),
            verifyAttempts: 0,
            blockedUntil: null,
          },
          $setOnInsert: { phone },
          $inc: { sendCount: 1 },
        },
        { upsert: true, new: true }
      );
      return NextResponse.json({
        success: true,
        message: "Test OTP sent",
      });
    }
    const now = Date.now();

    if (existing?.lastSentAt) {
      const seconds = Math.floor((now - new Date(existing.lastSentAt).getTime()) / 1000);
      if (seconds < 30) {
        return NextResponse.json({
          success: true,
          message: `OTP already sent. ${30 - seconds}s baad dubara try karein.`,
          cooldown: 30 - seconds,
        });
      }
    }

    const sendCount = Number(existing?.sendCount || 0);
    if (sendCount >= 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many OTP requests. 10 min baad retry karein.",
        },
        { status: 429 }
      );
    }

    const { sessionId, otp } = await sendSmsOtp(phone);
    if (!otp || String(otp).length !== 4) throw new Error("OTP generation failed");
    await OtpPending.findOneAndUpdate(
      { phone },
      {
        $set: {
          sessionId: String(sessionId || ""),
          otpHash: hashOtp(String(otp)),
          pendingUserType: userType,
          pendingOrganizationId:
            userType === "organization_employee" && employeeOrg
              ? (employeeOrg._id as never)
              : null,
          pendingCompanyName:
            userType === "organization"
              ? organizationName
              : userType === "organization_employee" && employeeOrg
                ? String(employeeOrg.companyName)
                : "",
          lastSentAt: new Date(),
          verifyAttempts: 0,
          blockedUntil: null,
        },
        $setOnInsert: { phone },
        $inc: { sendCount: 1 },
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message: `SMS/OTP: ${errMsg(e)}. 4-digit OTP ke liye TWO_FACTOR_SENDER_ID set karna zaroori hai (Transactional SMS). Ya DEV_OTP_BYPASS=true + OTP 1234 se test karein.`,
      },
      { status: 500 }
    );
  }
}
