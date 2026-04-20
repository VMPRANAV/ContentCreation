import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

export const canUseCloudinary = () =>
  Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);

if (canUseCloudinary()) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true
  });
}

export const uploadBufferToCloudinary = async ({
  buffer,
  mimeType,
  folder = env.cloudinaryFolder,
  publicId,
  tags = []
}) => {
  if (!canUseCloudinary()) {
    throw new Error("Cloudinary is not configured.");
  }

  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
    public_id: publicId,
    tags
  });
};

export { cloudinary };
