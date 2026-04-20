import { env } from "../config/env.js";
import {
  canUseCloudinary,
  uploadBufferToCloudinary
} from "../config/cloudinary.js";

export const persistGeneratedImage = async ({ imageBuffer, mimeType, topic }) => {
  if (canUseCloudinary()) {
    const upload = await uploadBufferToCloudinary({
      buffer: imageBuffer,
      mimeType,
      folder: env.cloudinaryFolder,
      publicId: `linkedin-${Date.now()}`,
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
