import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { ObjectId } from "mongodb";
import { env } from "../config/env.js";
import { getDb } from "../db/mongo.js";

const groq = new Groq({ apiKey: env.groqApiKey });
const gemini = new GoogleGenAI({ apiKey: env.geminiApiKey });

const getPostTemplatesCollection = () => getDb().collection("post_templates");
const getImageHistoryCollection = () => getDb().collection("image_history");

const buildContextBlock = (templates) => {
  if (!templates.length) {
    return "No matching templates were found. Use strong LinkedIn structure best practices.";
  }

  return templates
    .map((template, index) => {
      const hook = template.hook || "";
      const structure = template.structure || "";
      const example = template.example || template.content || "";

      return `Template ${index + 1}:\nHook: ${hook}\nStructure: ${structure}\nExample: ${example}`;
    })
    .join("\n\n");
};

const normalizeBrief = (briefInput) => ({
  topic: briefInput?.topic?.trim() || "",
  audience: briefInput?.audience?.trim() || "",
  goal: briefInput?.goal?.trim() || "",
  cta: briefInput?.cta?.trim() || ""
});

const buildBriefQuery = (briefInput) => {
  const brief = normalizeBrief(briefInput);

  return [brief.topic, brief.audience, brief.goal, brief.cta].filter(Boolean).join(" | ");
};

const buildBriefInstructionBlock = (briefInput) => {
  const brief = normalizeBrief(briefInput);
  const lines = [
    `Topic: ${brief.topic || "Not provided"}`,
    `Audience: ${brief.audience || "General LinkedIn professionals"}`,
    `Goal: ${brief.goal || "Deliver a useful professional insight"}`,
    `CTA: ${brief.cta || "End with a light, relevant invitation to engage"}`
  ];

  return lines.join("\n");
};

const embedText = async (input) => {
  const response = await gemini.models.embedContent({
    model: env.geminiEmbeddingModel,
    contents: input,
    config: {
      taskType: "RETRIEVAL_QUERY"
    }
  });

  const vector = response?.embeddings?.[0]?.values;
  if (!vector) {
    throw new Error("Gemini embedding API returned an empty vector");
  }

  return vector;
};

const searchTemplatesByTopic = async (topic, limit = 4) => {
  const queryVector = await embedText(topic);

  const templates = await getPostTemplatesCollection()
    .aggregate([
      {
        $vectorSearch: {
          index: env.vectorIndexName,
          path: "embedding",
          queryVector,
          numCandidates: 50,
          limit
        }
      },
      {
        $project: {
          _id: 1,
          hook: 1,
          structure: 1,
          example: 1,
          content: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ])
    .toArray();

  return templates;
};

export const generateTextWithRAG = async (briefInput) => {
  const brief = normalizeBrief(
    typeof briefInput === "string" ? { topic: briefInput } : briefInput
  );

  if (!brief.topic) {
    throw new Error("topic is required");
  }

  const searchQuery = buildBriefQuery(brief);
  const templates = await searchTemplatesByTopic(searchQuery);
  const context = buildContextBlock(templates);
  const briefInstructions = buildBriefInstructionBlock(brief);

  const completion = await groq.chat.completions.create({
    model: env.groqModel,
    temperature: 0.7,
    max_tokens: 900,
    messages: [
      {
        role: "system",
        content:
          "You are a senior LinkedIn ghostwriter. Generate high-performing, professional posts with a strong hook, clear structure, and CTA."
      },
      {
        role: "user",
        content:
          `Use this content brief to shape the draft:\n${briefInstructions}\n\n` +
          `Reference template context:\n${context}\n\n` +
          `Generate one polished LinkedIn post in plain text. Keep it authentic, concise, outcome-focused, and aligned to the audience and goal. ` +
          `Make the closing CTA consistent with the brief.`
      }
    ]
  });

  const post = completion.choices?.[0]?.message?.content?.trim() || "";

  return {
    topic: brief.topic,
    brief,
    post,
    contextTemplates: templates
  };
};

export const refineLinkedInPost = async (postContent, style = "shorter and punchier") => {
  if (!postContent?.trim()) {
    throw new Error("postContent is required for refinement");
  }

  const completion = await groq.chat.completions.create({
    model: env.groqModel,
    temperature: 0.6,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are a world-class editor for LinkedIn. Preserve the original meaning but improve clarity and engagement."
      },
      {
        role: "user",
        content: `Rewrite the following LinkedIn post to be ${style}.\n\nPost:\n${postContent}`
      }
    ]
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
};

export const generateImagePrompt = async (postContent) => {
  if (!postContent?.trim()) {
    throw new Error("postContent is required");
  }

  const completion = await groq.chat.completions.create({
    model: env.groqModel,
    temperature: 0.5,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You convert business writing into premium Stable Diffusion prompts. Output one prompt only."
      },
      {
        role: "user",
        content:
          `Transform this LinkedIn post into a single photorealistic, professional, high-contrast digital art prompt. ` +
          `The image should feel corporate, modern, and editorial-quality, with cinematic lighting and a clean composition. ` +
          `Avoid text overlays, logos, and watermarks.\n\nPost:\n${postContent}`
      }
    ]
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
};

const parseImageResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.message || payload?.error || "Stability API returned an error";
      throw new Error(message);
    }

    if (payload?.image) {
      return Buffer.from(payload.image, "base64");
    }

    throw new Error("Stability API did not return image data");
  }

  const arrayBuffer = await response.arrayBuffer();
  if (!response.ok) {
    throw new Error(`Stability API request failed with status ${response.status}`);
  }

  return Buffer.from(arrayBuffer);
};

export const generateSDImage = async (imagePrompt) => {
  if (!imagePrompt?.trim()) {
    throw new Error("imagePrompt is required");
  }

  const body = new FormData();
  body.append("prompt", imagePrompt);
  body.append("mode", "text-to-image");
  body.append("model", "sd3.5-large");
  body.append("output_format", "png");

  const response = await fetch(env.stabilityApiBaseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.stabilityApiKey}`,
      Accept: "image/*"
    },
    body
  });

  const imageBuffer = await parseImageResponse(response);
  const base64 = imageBuffer.toString("base64");

  return {
    mimeType: "image/png",
    imageBuffer,
    imageBase64: `data:image/png;base64,${base64}`
  };
};

export const saveImageHistory = async ({
  brief,
  topic,
  postContent,
  imagePrompt,
  imageUrl,
  imageBase64
}) => {
  const normalizedBrief = normalizeBrief(brief || { topic });
  const doc = {
    brief: normalizedBrief,
    topic: normalizedBrief.topic || topic || "",
    postContent: postContent || "",
    imagePrompt: imagePrompt || "",
    imageUrl: imageUrl || "",
    imageBase64: imageBase64 || "",
    createdAt: new Date()
  };

  const result = await getImageHistoryCollection().insertOne(doc);

  return { ...doc, _id: result.insertedId };
};

export const getImageHistory = async (limit = 20) => {
  const docs = await getImageHistoryCollection()
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) => ({ ...doc, _id: new ObjectId(doc._id).toString() }));
};
