import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { InferenceClient } from "@huggingface/inference";
import { ObjectId } from "mongodb";
import { env } from "../config/env.js";
import { getDb } from "../db/mongo.js";

const groq = new Groq({ apiKey: env.groqApiKey });
const gemini = new GoogleGenAI({ apiKey: env.geminiApiKey });
const hf = new InferenceClient(env.hfApiKey);

const getPostTemplatesCollection = () => getDb().collection("post_templates");
const getImageHistoryCollection = () => getDb().collection("image_history");

const WRITER_AGENT_PERSONA =
  "You are the Writer Agent for ContentC, an elite LinkedIn ghostwriter who turns briefs into high-performing posts. You write with a sharp hook, clear progression, professional warmth, and a CTA that matches the brief.";

const VISUAL_ARTIST_AGENT_PERSONA =
  "You are the Visual Artist Agent for ContentC. You turn a finished LinkedIn post into one premium image-generation prompt with a clear subject, composition, mood, lighting, and style direction. Output one prompt string only.";

const CRITIC_AGENT_PERSONA =
  "You are the Critic Agent for ContentC. You evaluate LinkedIn posts for hook strength, readability, and virality potential. You must return strict JSON only.";

const createProviderError = (provider, message, status = 500, extras = {}) => {
  const error = new Error(message);
  error.provider = provider;
  error.status = status;
  Object.assign(error, extras);
  return error;
};

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

const normalizeMongoId = (doc) => {
  if (!doc) {
    return doc;
  }

  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || "");
  return { ...doc, _id: id };
};

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

const extractRetryDelaySeconds = (details = []) => {
  const retryInfo = details.find((detail) => detail?.["@type"]?.includes("RetryInfo"));
  const retryDelay = retryInfo?.retryDelay;

  if (typeof retryDelay !== "string") {
    return null;
  }

  const seconds = Number.parseInt(retryDelay, 10);
  return Number.isFinite(seconds) ? seconds : null;
};

const normalizeGeminiError = (error, fallbackMessage) => {
  const rawMessage = error?.message || fallbackMessage;
  const match = rawMessage.match(/\{.*\}$/s);

  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]);
    const payload = parsed?.error;

    if (!payload) {
      return null;
    }

    const normalized = new Error(payload.message || fallbackMessage);
    normalized.status = payload.code || 500;
    normalized.provider = "gemini";
    normalized.details = payload.details || [];
    normalized.retryAfterSeconds = extractRetryDelaySeconds(payload.details || []);

    return normalized;
  } catch {
    return null;
  }
};

const normalizeGroqError = (error, fallbackMessage) => {
  const status =
    error?.status || error?.statusCode || error?.response?.status || error?.cause?.status;

  return createProviderError("groq", error?.message || fallbackMessage, status || 500);
};

const getGroqText = (completion) =>
  completion.choices?.[0]?.message?.content?.trim() || "";

const extractJsonObject = (content) => {
  if (typeof content !== "string") {
    return null;
  }

  const trimmed = content.trim();
  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return candidate.slice(start, end + 1);
};

const coerceScore = (value, fallback) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(10, Math.max(1, Math.round(numeric)));
};

const coerceSuggestionList = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);
};

const buildAnalysisFallback = (postContent, rawOutput = "") => {
  const trimmed = postContent?.trim() || "";
  const lines = trimmed ? trimmed.split("\n").filter((line) => line.trim()) : [];
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const hasQuestion = trimmed.includes("?");
  const hook = trimmed.split("\n")[0] || "";

  return {
    hookScore: hook.length >= 40 || hasQuestion ? 7 : 6,
    readabilityScore: words > 220 ? 6 : 7,
    viralityScore: lines.length >= 4 ? 7 : 6,
    suggestions: [
      "Sharpen the opening line so the value lands in the first sentence.",
      "Add one more concrete takeaway or invitation to respond."
    ],
    fallbackUsed: true,
    rawOutput: rawOutput?.trim() || ""
  };
};

const normalizeAnalysisPayload = (payload, fallbackPayload) => ({
  hookScore: coerceScore(payload?.hookScore, fallbackPayload.hookScore),
  readabilityScore: coerceScore(payload?.readabilityScore, fallbackPayload.readabilityScore),
  viralityScore: coerceScore(payload?.viralityScore, fallbackPayload.viralityScore),
  suggestions:
    coerceSuggestionList(payload?.suggestions).length > 0
      ? coerceSuggestionList(payload?.suggestions)
      : fallbackPayload.suggestions,
  fallbackUsed: Boolean(payload?.fallbackUsed),
  rawOutput: typeof payload?.rawOutput === "string" ? payload.rawOutput : fallbackPayload.rawOutput
});

const embedText = async (input) => {
  let response;

  try {
    response = await gemini.models.embedContent({
      model: env.geminiEmbeddingModel,
      contents: input,
      config: {
        taskType: "RETRIEVAL_QUERY"
      }
    });
  } catch (error) {
    throw normalizeGeminiError(error, "Gemini embedding request failed.") || error;
  }

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

  return templates.map(normalizeMongoId);
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

  let completion;

  try {
    completion = await groq.chat.completions.create({
      model: env.groqModel,
      temperature: 0.7,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: WRITER_AGENT_PERSONA
        },
        {
          role: "user",
          content:
            `Use this content brief to shape the draft:\n${briefInstructions}\n\n` +
            `Reference template context:\n${context}\n\n` +
            "Write one polished LinkedIn post in plain text only. Keep it authentic, concise, outcome-focused, and aligned to the audience and goal. " +
            "Make the closing CTA consistent with the brief."
        }
      ]
    });
  } catch (error) {
    throw normalizeGroqError(error, "Writer Agent failed to generate the draft.");
  }

  const post = getGroqText(completion);

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

  try {
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

    return getGroqText(completion);
  } catch (error) {
    throw normalizeGroqError(error, "Groq failed to refine the LinkedIn post.");
  }
};

export const analyzePostContent = async (postContent) => {
  if (!postContent?.trim()) {
    throw new Error("postContent is required");
  }

  const fallback = buildAnalysisFallback(postContent);

  try {
    const completion = await groq.chat.completions.create({
      model: env.groqModel,
      temperature: 0.2,
      max_tokens: 250,
      messages: [
        {
          role: "system",
          content: CRITIC_AGENT_PERSONA
        },
        {
          role: "user",
          content:
            'Analyze the following LinkedIn post and return strict JSON only with this schema: {"hookScore": number, "readabilityScore": number, "viralityScore": number, "suggestions": string[]}. ' +
            "Scores must be integers from 1 to 10. Provide exactly 2 concise suggestions.\n\n" +
            `Post:\n${postContent}`
        }
      ]
    });

    const rawOutput = getGroqText(completion);
    const jsonCandidate = extractJsonObject(rawOutput);

    if (!jsonCandidate) {
      return buildAnalysisFallback(postContent, rawOutput);
    }

    const parsed = JSON.parse(jsonCandidate);
    return normalizeAnalysisPayload(parsed, fallback);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return buildAnalysisFallback(postContent);
    }

    throw normalizeGroqError(error, "Critic Agent failed to analyze the draft.");
  }
};

export const generateImagePrompt = async (postContent) => {
  if (!postContent?.trim()) {
    throw new Error("postContent is required");
  }

  try {
    const completion = await groq.chat.completions.create({
      model: env.groqModel,
      temperature: 0.5,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: VISUAL_ARTIST_AGENT_PERSONA
        },
        {
          role: "user",
          content:
            "Transform this LinkedIn post into one image-generation prompt only. " +
            "The visual should feel professional, editorial, modern, and suitable for a polished social asset. " +
            "Avoid text overlays, logos, watermarks, and multiple prompt variants.\n\n" +
            `Post:\n${postContent}`
        }
      ]
    });

    return getGroqText(completion).replace(/^["'`]|["'`]$/g, "");
  } catch (error) {
    throw normalizeGroqError(error, "Visual Artist Agent failed to create the image prompt.");
  }
};

export const generateSDImage = async (imagePrompt) => {
  if (!imagePrompt?.trim()) {
    throw new Error("imagePrompt is required");
  }

  let imageBlob;

  try {
    imageBlob = await hf.textToImage({
      model: env.hfImageModel,
      provider: env.hfProvider,
      inputs: imagePrompt.trim()
    });
  } catch (error) {
    const status = error?.status || error?.statusCode || error?.response?.status;
    const retryAfter =
      Number.parseInt(error?.response?.headers?.get?.("retry-after"), 10) || null;

    if (status === 429) {
      const friendlyMessage =
        "Hugging Face image generation is currently unavailable because the configured token or provider has hit a rate limit or quota.";

      const enrichedError = new Error(
        retryAfter
          ? `${friendlyMessage} Retry after about ${retryAfter} seconds, or check your Hugging Face billing and provider quota.`
          : `${friendlyMessage} Check your Hugging Face billing and provider quota.`
      );

      enrichedError.status = 429;
      enrichedError.provider = "huggingface";
      enrichedError.retryAfterSeconds = retryAfter;
      throw enrichedError;
    }

    const fallbackMessage =
      error?.message || "Hugging Face image generation failed.";
    const enrichedError = new Error(fallbackMessage);
    enrichedError.status = status || 500;
    enrichedError.provider = "huggingface";
    throw enrichedError;
  }

  const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

  if (!imageBuffer.length) {
    throw new Error(
      "Hugging Face did not return an image. Try a more explicit image prompt."
    );
  }

  const mimeType = imageBlob.type || "image/png";
  const base64 = imageBuffer.toString("base64");

  return {
    mimeType,
    imageBuffer,
    imageBase64: `data:${mimeType};base64,${base64}`
  };
};

export const saveImageHistory = async ({
  brief,
  topic,
  postContent,
  analysis,
  imagePrompt,
  imageUrl,
  imageBase64
}) => {
  const normalizedBrief = normalizeBrief(brief || { topic });
  const doc = {
    brief: normalizedBrief,
    topic: normalizedBrief.topic || topic || "",
    postContent: postContent || "",
    analysis: analysis && typeof analysis === "object" ? analysis : undefined,
    imagePrompt: imagePrompt || "",
    imageUrl: imageUrl || "",
    imageBase64: imageBase64 || "",
    createdAt: new Date()
  };

  const result = await getImageHistoryCollection().insertOne(doc);

  return normalizeMongoId({ ...doc, _id: result.insertedId });
};

export const getImageHistory = async (limit = 20) => {
  const docs = await getImageHistoryCollection()
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map(normalizeMongoId);
};
