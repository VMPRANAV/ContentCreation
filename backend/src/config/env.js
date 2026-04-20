import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";

const backendEnvPath = path.resolve(process.cwd(), ".env");
const rootEnvPath = path.resolve(process.cwd(), "..", ".env");

dotenv.config({
  path: existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath
});

export const env = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "",
  dbName: "linkedin_content_engine",
  vectorIndexName: "post_templates_vector_idx",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: "llama-3.3-70b-versatile",
  geminiApiKey: process.env.EMBEDDING_KEY || "",
  geminiEmbeddingModel: "gemini-embedding-001",
  stabilityApiKey: process.env.STABILITY_API_KEY || "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "contentc",
  stabilityApiBaseUrl:
    "https://api.stability.ai/v2beta/stable-image/generate/sd3"
};

export const validateEnv = () => {
  const required = [
    "MONGODB_URI",
    "GROQ_API_KEY",
    "EMBEDDING_KEY",
    "STABILITY_API_KEY"
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `[config] Missing env vars: ${missing.join(", ")}. Some routes may fail until configured.`
    );
  }
};
