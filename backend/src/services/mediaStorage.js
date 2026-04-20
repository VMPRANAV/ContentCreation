import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

const canUseCloudinary = () =>
  Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);

if (canUseCloudinary()) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true
  });
}

export const persistGeneratedImage = async ({ imageBuffer, mimeType, topic }) => {
  if (canUseCloudinary()) {
    const base64 = imageBuffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    const upload = await cloudinary.uploader.upload(dataUri, {
      folder: env.cloudinaryFolder,
      resource_type: "image",
      public_id: `linkedin-${Date.now()}`,
      tags: ["linkedin", "ai-generated", topic || "untitled"]
    });

    return {
      imageUrl: upload.secure_url,
      imageBase64: ""
    };
  }

  return {
    imageUrl: "",
    imageBase64: `data:${mimeType};base64,${imageBuffer.toString("base64")}`
  };
};
