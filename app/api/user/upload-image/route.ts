import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/server/userContext";
import { uploadBase64Image } from "@/lib/server/cloudinary";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const explicit = body.userId != null ? String(body.userId) : null;
    const { userId, error } = resolveUserId(request, explicit);
    if (!userId || error) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const dataUri = String(body.dataUri || "");
    const field = String(body.field || "profile");
    if (!dataUri.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, message: "Invalid image payload" },
        { status: 400 }
      );
    }

    const result = await uploadBase64Image(dataUri, `jambupro/${field}`);
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      userId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
