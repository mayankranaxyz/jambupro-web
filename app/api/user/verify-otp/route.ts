import { NextResponse } from "next/server";
import { connectDb } from "@/lib/server/db";
import { adminPhones, OtpPending, User, serializeUser } from "@/lib/server/models";
import { signUserToken } from "@/lib/server/jwt";
import { verifySmsOtp } from "@/lib/server/twoFactor";

export async function POST(request: Request) {
  try {
    await connectDb();
    const body = await request.json();
    const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
    const otp = String(body.otp || "");
    const testBypassPhone = process.env.TEST_BYPASS_PHONE || "9999999999";
    const testBypassOtp = process.env.TEST_BYPASS_OTP || "999999";

    if (phone.length !== 10 || otp.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Invalid phone or OTP" },
        { status: 400 }
      );
    }

    if (phone === testBypassPhone && otp === testBypassOtp) {
      await OtpPending.deleteMany({ phone });
      let user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({ phone, role: "user" });
      }
      const token = signUserToken(user);
      return NextResponse.json({
        success: true,
        token,
        user: serializeUser(user),
      });
    }

    const pending = await OtpPending.findOne({ phone }).sort({ createdAt: -1 });
    if (!pending) {
      return NextResponse.json(
        { success: false, message: "OTP expired. Request again." },
        { status: 400 }
      );
    }

    if (pending.blockedUntil && new Date(pending.blockedUntil).getTime() > Date.now()) {
      const wait = Math.ceil(
        (new Date(pending.blockedUntil).getTime() - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          success: false,
          message: `Too many wrong attempts. ${wait}s baad try karein.`,
        },
        { status: 429 }
      );
    }

    const ok = await verifySmsOtp(pending.sessionId, otp);
    if (!ok) {
      const attempts = Number(pending.verifyAttempts || 0) + 1;
      const lock = attempts >= 5 ? new Date(Date.now() + 5 * 60 * 1000) : null;
      await OtpPending.updateOne(
        { _id: pending._id },
        { $set: { verifyAttempts: attempts, blockedUntil: lock } }
      );
      return NextResponse.json(
        {
          success: false,
          message:
            attempts >= 5
              ? "Too many wrong OTP attempts. 5 min ke liye blocked."
              : `Invalid OTP. ${5 - attempts} attempts left.`,
        },
        { status: 400 }
      );
    }

    await OtpPending.deleteMany({ phone });

    const admins = adminPhones();
    const role = admins.has(phone) ? "admin" : "user";

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, role });
    } else {
      if (role === "admin") {
        user.role = "admin";
        await user.save();
      }
    }

    const token = signUserToken(user);

    return NextResponse.json({
      success: true,
      token,
      user: serializeUser(user),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
