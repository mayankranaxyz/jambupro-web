import type mongoose from "mongoose";
import jwt from "jsonwebtoken";

export function signUserToken(user: { _id: mongoose.Types.ObjectId; role?: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    { sub: String(user._id), role: user.role || "user" },
    secret,
    { expiresIn } as jwt.SignOptions
  );
}

export function parseBearer(request: Request): {
  userId: string;
  role: string;
} | null {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    if (!decoded.sub) return null;
    return { userId: String(decoded.sub), role: String(decoded.role || "user") };
  } catch {
    return null;
  }
}
