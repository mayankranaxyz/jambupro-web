import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureCloudinary() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export async function uploadBase64Image(
  dataUri: string,
  folder = "jambupro/profile"
) {
  ensureCloudinary();
  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });
}
