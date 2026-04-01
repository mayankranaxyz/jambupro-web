import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { OtpPending, User } from "@/lib/server/models";
import { sendSmsOtp } from "@/lib/server/twoFactor";
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
  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body (need JSON with phone)" },
      { status: 400 }
    );
  }

  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
  const testBypassPhone = process.env.TEST_BYPASS_PHONE || "9999999999";
  if (phone.length !== 10) {
    return NextResponse.json(
      { success: false, message: "Enter valid 10-digit phone number" },
      { status: 400 }
    );
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
    // Registration: jab OTP bhejo, users collection mein row (naye number par)
    await User.updateOne(
      { phone },
      { $setOnInsert: { phone, role: "user" } },
      { upsert: true }
    );
    const existing = await OtpPending.findOne({ phone }).sort({ createdAt: -1 });

    // Dedicated QA bypass number (no SMS hit).
    if (phone === testBypassPhone) {
      await OtpPending.findOneAndUpdate(
        { phone },
        {
          $set: {
            sessionId: "DEV_SESSION",
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

    const { sessionId } = await sendSmsOtp(phone);
    await OtpPending.findOneAndUpdate(
      { phone },
      {
        $set: {
          sessionId,
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
        message: `SMS/OTP: ${errMsg(e)}. 2Factor key/template check karo; ya DEV_OTP_BYPASS=true + OTP 123456 se test karo.`,
      },
      { status: 500 }
    );
  }
}
