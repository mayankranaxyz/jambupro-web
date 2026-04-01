import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || "Admin@123");
const name = String(process.env.ADMIN_NAME || "Super Admin");

await mongoose.connect(MONGODB_URI);

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "Admin" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const AdminAuth = mongoose.models.AdminAuth || mongoose.model("AdminAuth", adminSchema);

const passwordHash = await bcrypt.hash(password, 10);
await AdminAuth.findOneAndUpdate(
  { username },
  { $set: { passwordHash, name, active: true } },
  { upsert: true, new: true }
);

console.log(`Admin seeded: ${username}`);
await mongoose.disconnect();
