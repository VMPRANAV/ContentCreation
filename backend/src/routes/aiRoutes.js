import { Router } from "express";
import {
  generateImagePrompt,
  generateSDImage,
  generateTextWithRAG,
  getImageHistory,
  refineLinkedInPost,
  saveImageHistory
} from "../services/aiService.js";
import { persistGeneratedImage } from "../services/mediaStorage.js";

const router = Router();

router.post("/generate", async (req, res, next) => {
  try {
    const { topic, audience, goal, cta, brief } = req.body;
    const output = await generateTextWithRAG(
      brief || {
        topic,
        audience,
        goal,
        cta
      }
    );
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
    const { topic, audience, goal, cta, brief, postContent, imagePrompt } = req.body;
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

export default router;
