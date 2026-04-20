import { Router } from "express";
import { orchestrateWorkflow } from "../agents/orchestrator.js";
import {
  analyzePostContent,
  generateImagePrompt,
  generateSDImage,
  generateTextWithRAG,
  getImageHistory,
  refineLinkedInPost,
  saveImageHistory
} from "../services/aiService.js";
import { persistGeneratedImage } from "../services/mediaStorage.js";
import { schedulePost } from "../services/schedulerService.js";

const router = Router();

const normalizeFrontendBrief = (body = {}) => {
  const source = body.brief && typeof body.brief === "object" ? body.brief : body;

  return {
    topic: typeof source.topic === "string" ? source.topic.trim() : "",
    audience: typeof source.audience === "string" ? source.audience.trim() : "",
    goal: typeof source.goal === "string" ? source.goal.trim() : "",
    cta: typeof source.cta === "string" ? source.cta.trim() : ""
  };
};

router.post("/generate", async (req, res, next) => {
  try {
    const brief = normalizeFrontendBrief(req.body);

    if (!brief.topic) {
      return res.status(400).json({
        error: "brief.topic is required and must be a non-empty string."
      });
    }

    const output = await generateTextWithRAG(brief);
    res.json(output);
  } catch (error) {
    next(error);
  }
});

router.post("/orchestrate", async (req, res, next) => {
  try {
    const brief = normalizeFrontendBrief(req.body);

    if (!brief.topic) {
      return res.status(400).json({
        error: "brief.topic is required and must be a non-empty string."
      });
    }

    const output = await orchestrateWorkflow(brief);
    res.json(output);
  } catch (error) {
    next(error);
  }
});

router.post("/refine", async (req, res, next) => {
  try {
    const { postContent, style } = req.body;
    if (!postContent?.trim()) {
      return res.status(400).json({
        error: "postContent is required and must be a non-empty string."
      });
    }

    const refinedPost = await refineLinkedInPost(postContent, style);
    res.json({ refinedPost });
  } catch (error) {
    next(error);
  }
});

router.post("/analyze", async (req, res, next) => {
  try {
    const { postContent } = req.body;

    if (!postContent?.trim()) {
      return res.status(400).json({
        error: "postContent is required and must be a non-empty string."
      });
    }

    const analysis = await analyzePostContent(postContent);
    res.json({ analysis });
  } catch (error) {
    next(error);
  }
});

router.post("/image-prompt", async (req, res, next) => {
  try {
    const { postContent } = req.body;
    const imagePrompt = await generateImagePrompt(postContent);
    res.json({ imagePrompt });
  } catch (error) {
    next(error);
  }
});

router.post("/image", async (req, res, next) => {
  try {
    const { topic, audience, goal, cta, brief, postContent, analysis, imagePrompt } = req.body;
    const normalizedBrief = brief || {
      topic,
      audience,
      goal,
      cta
    };

    const generated = await generateSDImage(imagePrompt);
    const persistedImage = await persistGeneratedImage({
      imageBuffer: generated.imageBuffer,
      mimeType: generated.mimeType,
      topic: normalizedBrief.topic || topic
    });

    const historyDoc = await saveImageHistory({
      brief: normalizedBrief,
      topic: normalizedBrief.topic || topic,
      postContent,
      analysis,
      imagePrompt,
      imageUrl: persistedImage.imageUrl,
      imageBase64: persistedImage.imageBase64
    });

    res.json({
      imageUrl: persistedImage.imageUrl,
      imageBase64: persistedImage.imageBase64,
      imageMimeType: generated.mimeType,
      historyId: historyDoc._id
    });
  } catch (error) {
    next(error);
  }
});

router.get("/image-history", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 20);
    const history = await getImageHistory(limit);
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

router.post("/schedule", async (req, res, next) => {
  try {
    const scheduledPost = await schedulePost(req.body);
    res.status(201).json({ scheduledPost });
  } catch (error) {
    next(error);
  }
});

export default router;
