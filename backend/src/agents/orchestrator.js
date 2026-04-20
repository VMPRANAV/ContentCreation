import {
  analyzePostContent,
  generateImagePrompt,
  generateTextWithRAG
} from "../services/aiService.js";

const wrapAgentError = (agentLabel, error) => {
  const providerPrefix = error?.provider ? `${error.provider}: ` : "";
  const wrapped = new Error(
    `${agentLabel} failed. ${providerPrefix}${error?.message || "Unknown error."}`
  );
  wrapped.status = error?.status || 500;
  wrapped.provider = error?.provider;

  if (error?.retryAfterSeconds) {
    wrapped.retryAfterSeconds = error.retryAfterSeconds;
  }

  return wrapped;
};

export const orchestrateWorkflow = async (brief) => {
  let writerOutput;

  try {
    writerOutput = await generateTextWithRAG(brief);
  } catch (error) {
    throw wrapAgentError("Writer Agent", error);
  }

  let analysis;

  try {
    analysis = await analyzePostContent(writerOutput.post);
  } catch (error) {
    throw wrapAgentError("Critic Agent", error);
  }

  let imagePrompt;

  try {
    imagePrompt = await generateImagePrompt(writerOutput.post);
  } catch (error) {
    throw wrapAgentError("Visual Artist Agent", error);
  }

  return {
    brief: writerOutput.brief,
    post: writerOutput.post,
    analysis,
    imagePrompt,
    contextTemplates: writerOutput.contextTemplates || []
  };
};
