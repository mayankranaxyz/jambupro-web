import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    userType: String,
    name: String,
    email: String,
    profilePic: String,
    companyLogo: String,
    companyName: String,
    reraNumber: String,
    gstNumber: String,
    altPhone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const otpPendingSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    lastSentAt: { type: Date, default: Date.now },
    sendCount: { type: Number, default: 1 },
    verifyAttempts: { type: Number, default: 0 },
    blockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);
otpPendingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const leadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: Schema.Types.Mixed, required: true },
    name: String,
    phone: String,
    property: String,
    notes: String,
    followUp: String,
    status: { type: String, default: "New" },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { timestamps: true }
);
leadSchema.index({ userId: 1, clientId: 1 }, { unique: true });

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    address: Schema.Types.Mixed,
    items: [Schema.Types.Mixed],
    totalAmount: Number,
    paymentMode: String,
    status: { type: String, default: "Pending" },
    cancelReason: String,
  },
  { timestamps: true }
);

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    productIds: [{ type: String }],
  },
  { timestamps: true }
);

const productSchema = new Schema(
  {
    name: String,
    price: Number,
    description: String,
    images: [{ url: String }],
  },
  { timestamps: true }
);

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: String,
    body: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const supportTicketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: String,
    message: String,
    status: { type: String, default: "open" },
  },
  { timestamps: true }
);

const adminAuthSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "Admin" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const appVersionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "mobile" },
    latestVersion: { type: String, default: "" },
    minRequiredVersion: { type: String, default: "" },
    message: { type: String, default: "" },
    defaultUrl: { type: String, default: "" },
    androidUrl: { type: String, default: "" },
    iosUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const OtpPending =
  mongoose.models.OtpPending || mongoose.model("OtpPending", otpPendingSchema);
export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const Wishlist =
  mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);
export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export const SupportTicket =
  mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);
export const AdminAuth =
  mongoose.models.AdminAuth || mongoose.model("AdminAuth", adminAuthSchema);
export const AppVersionConfig =
  mongoose.models.AppVersionConfig ||
  mongoose.model("AppVersionConfig", appVersionSchema);

export function serializeUser(doc: InstanceType<typeof User>) {
  const u = doc.toObject();
  return {
    _id: String(u._id),
    phone: u.phone,
    role: u.role,
    userType: u.userType || "",
    name: u.name || "",
    email: u.email || "",
    profilePic: u.profilePic || "",
    companyLogo: u.companyLogo || "",
    companyName: u.companyName || "",
    reraNumber: u.reraNumber || "",
    gstNumber: u.gstNumber || "",
    altPhone: u.altPhone || "",
    address: u.address || "",
    city: u.city || "",
    state: u.state || "",
    pincode: u.pincode || "",
    country: u.country || "India",
  };
}

export function adminPhones(): Set<string> {
  const raw = process.env.ADMIN_MOBILE_NUMBERS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.replace(/\D/g, "").slice(-10))
      .filter((s) => s.length === 10)
  );
}

export function serializeProduct(doc: InstanceType<typeof Product>) {
  const o = doc.toObject();
  return {
    _id: String(o._id),
    name: o.name,
    price: o.price,
    description: o.description || "",
    images: o.images || [],
  };
}
