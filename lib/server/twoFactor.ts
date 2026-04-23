import crypto from "crypto";

function normalizeIndianPhone(phone: string): string {
  const d = String(phone).replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  return d;
}

function otpSecret(): string {
  return process.env.OTP_SECRET || process.env.JWT_SECRET || "dev-otp-secret";
}

export function hashOtp(otp: string): string {
  return crypto.createHmac("sha256", otpSecret()).update(String(otp)).digest("hex");
}

function generateOtp4(): string {
  const n = crypto.randomInt(0, 10000);
  return String(n).padStart(4, "0");
}

async function try2FactorSend(url: string): Promise<string> {
  let res = await fetch(url, { method: "POST" });
  let text = await res.text();
  let data: { Status?: string; Details?: string; status?: string } = {};
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error(text.slice(0, 200) || "Invalid response from SMS provider");
  }

  if (data.Status === "Success" && data.Details) {
    return String(data.Details);
  }

  res = await fetch(url, { method: "GET" });
  text = await res.text();
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error(text.slice(0, 200) || "Invalid response from SMS provider");
  }

  if (data.Status === "Success" && data.Details) {
    return String(data.Details);
  }

  const errMsg =
    typeof data.Details === "string"
      ? data.Details
      : typeof data.status === "string"
        ? data.status
        : text.slice(0, 200) || "Failed to send OTP";
  throw new Error(errMsg);
}

async function sendTemplateOtp(phone10: string, otp: string): Promise<string> {
  const key = process.env.TWO_FACTOR_API_KEY;
  const template = process.env.TWO_FACTOR_TEMPLATE_NAME || "OTPtemplate";
  if (!key) throw new Error("Missing TWO_FACTOR_API_KEY");
  const ph = normalizeIndianPhone(phone10);
  // 2Factor OTP template API.
  const url = `https://2factor.in/API/V1/${key}/SMS/${ph}/${encodeURIComponent(
    String(otp)
  )}/${encodeURIComponent(String(template))}`;
  return await try2FactorSend(url);
}

async function sendTransactionalSms(phone10: string, msg: string): Promise<string> {
  const key = process.env.TWO_FACTOR_API_KEY;
  const sender = process.env.TWO_FACTOR_SENDER_ID || process.env.SMS_SENDER_ID || "";
  if (!key) throw new Error("Missing TWO_FACTOR_API_KEY");
  if (!sender) throw new Error("Missing TWO_FACTOR_SENDER_ID");

  const ph = normalizeIndianPhone(phone10);
  const url = `https://2factor.in/API/V1/${key}/ADDON_SERVICES/SEND/TSMS`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: sender,
      To: ph,
      Msg: String(msg).slice(0, 500),
    }),
  });

  const text = await res.text();
  let data: { Status?: string; Details?: string; status?: string } = {};
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    throw new Error(text.slice(0, 200) || "Invalid response from SMS provider");
  }
  if (data.Status === "Success" && data.Details) return String(data.Details);
  const errMsg =
    typeof data.Details === "string"
      ? data.Details
      : typeof data.status === "string"
        ? data.status
        : text.slice(0, 200) || "Failed to send SMS";
  throw new Error(errMsg);
}

export async function sendSmsOtp(
  phone10: string
): Promise<{ sessionId: string; dev: boolean; otp: string }> {
  const key = process.env.TWO_FACTOR_API_KEY;
  const template = process.env.TWO_FACTOR_TEMPLATE_NAME || "OTPtemplate";
  const bypass = process.env.DEV_OTP_BYPASS === "true";

  if (bypass || !key) {
    return { sessionId: "DEV_SESSION", dev: true, otp: process.env.DEV_OTP_CODE || "1234" };
  }

  const otp = generateOtp4();
  const message =
    process.env.OTP_SMS_MESSAGE ||
    `Your verification code is ${otp}. Do not share this code with anyone.`;

  try {
    // Prefer transactional SMS to force 4-digit OTP in message.
    const sessionId = await sendTransactionalSms(phone10, message);
    return { sessionId, dev: false, otp };
  } catch (e) {
    const last = e instanceof Error ? e : new Error(String(e));
    // Fallback: 2Factor OTP template endpoint (works without sender id).
    // We still generate our own 4-digit OTP and verify via DB hash.
    try {
      const sessionId = await sendTemplateOtp(phone10, otp);
      return { sessionId, dev: false, otp };
    } catch {
      throw last;
    }
  }
}

export async function verifySmsOtp(sessionId: string, otp: string): Promise<boolean> {
  const bypass = process.env.DEV_OTP_BYPASS === "true";
  if (bypass && sessionId === "DEV_SESSION") {
    return String(otp) === (process.env.DEV_OTP_CODE || "1234");
  }

  const key = process.env.TWO_FACTOR_API_KEY;
  if (!key) {
    return String(otp) === "1234";
  }

  // We don't use provider verification when sending manual 4-digit OTP.
  // Verification is done against the hash stored in DB.
  return false;
}
