import { ObjectId } from "mongodb";
import { getDb } from "../db/mongo.js";

const getScheduledPostsCollection = () => getDb().collection("scheduled_posts");

const normalizeMongoId = (doc) => {
  if (!doc) {
    return doc;
  }

  const id = doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id || "");
  return { ...doc, _id: id };
};

const normalizeOptionalString = (value) =>
  typeof value === "string" ? value.trim() : "";

const buildDefaultScheduledDate = () => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date.toISOString();
};

export const validateSchedulePayload = (payload = {}) => {
  const postContent = normalizeOptionalString(payload.postContent);
  const imageUrl = normalizeOptionalString(payload.imageUrl);
  const scheduledDateInput = normalizeOptionalString(payload.scheduledDate);
  const brief =
    payload.brief && typeof payload.brief === "object" ? payload.brief : undefined;
  const analysis =
    payload.analysis && typeof payload.analysis === "object" ? payload.analysis : undefined;

  if (!postContent) {
    const error = new Error("postContent is required and must be a non-empty string.");
    error.status = 400;
    throw error;
  }

  let scheduledDate = scheduledDateInput || buildDefaultScheduledDate();
  const parsedDate = new Date(scheduledDate);

  if (Number.isNaN(parsedDate.getTime())) {
    const error = new Error("scheduledDate must be a valid ISO-safe date string.");
    error.status = 400;
    throw error;
  }

  scheduledDate = parsedDate.toISOString();

  return {
    postContent,
    imageUrl,
    scheduledDate,
    brief,
    analysis
  };
};

export const schedulePost = async (payload) => {
  const normalized = validateSchedulePayload(payload);
  const doc = {
    postContent: normalized.postContent,
    imageUrl: normalized.imageUrl || "",
    scheduledDate: normalized.scheduledDate,
    status: "scheduled",
    createdAt: new Date(),
    ...(normalized.analysis ? { analysis: normalized.analysis } : {}),
    ...(normalized.brief ? { brief: normalized.brief } : {})
  };

  const result = await getScheduledPostsCollection().insertOne(doc);
  return normalizeMongoId({ ...doc, _id: result.insertedId });
};
