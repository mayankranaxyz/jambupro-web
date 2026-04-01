function normalizeIndianPhone(phone: string): string {
  const d = String(phone).replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length === 12 && d.startsWith("91")) return d;
  return d;
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

export async function sendSmsOtp(phone10: string): Promise<{ sessionId: string; dev: boolean }> {
  const key = process.env.TWO_FACTOR_API_KEY;
  const template = process.env.TWO_FACTOR_TEMPLATE_NAME || "OTPtemplate";
  const bypass = process.env.DEV_OTP_BYPASS === "true";

  if (bypass || !key) {
    return { sessionId: "DEV_SESSION", dev: true };
  }

  const ph = normalizeIndianPhone(phone10);
  const encTemplate = encodeURIComponent(template);

  const urls = [
    `https://2factor.in/API/V1/${key}/SMS/${ph}/AUTOGEN/${encTemplate}`,
    `https://2factor.in/API/V1/${key}/SMS/${ph}/AUTOGEN/${template}`,
    `https://2factor.in/API/V1/${key}/SMS/${ph}/AUTOGEN`,
  ];

  let last: Error | null = null;
  for (const url of urls) {
    try {
      const sessionId = await try2FactorSend(url);
      return { sessionId, dev: false };
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw last || new Error("OTP send failed");
}

export async function verifySmsOtp(sessionId: string, otp: string): Promise<boolean> {
  const bypass = process.env.DEV_OTP_BYPASS === "true";
  if (bypass && sessionId === "DEV_SESSION") {
    return String(otp) === (process.env.DEV_OTP_CODE || "123456");
  }

  const key = process.env.TWO_FACTOR_API_KEY;
  if (!key) {
    return String(otp) === "123456";
  }

  const url = `https://2factor.in/API/V1/${key}/SMS/VERIFY/${sessionId}/${otp}`;
  const res = await fetch(url, { method: "GET" });
  const data = (await res.json()) as { Status?: string; Details?: string };

  if (data.Status !== "Success") return false;
  const d = String(data.Details || "");
  return d.includes("Matched") || d === "OTP Matched";
}
