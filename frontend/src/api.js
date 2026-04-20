const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/ai";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let payload = {};

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload;
};

export const generatePost = (brief) =>
  request("/generate", {
    method: "POST",
    body: JSON.stringify({ brief })
  });

export const orchestrateContent = (brief) =>
  request("/orchestrate", {
    method: "POST",
    body: JSON.stringify({ brief })
  });

export const refinePost = (postContent, style) =>
  request("/refine", {
    method: "POST",
    body: JSON.stringify({ postContent, style })
  });

export const analyzeContent = (postContent) =>
  request("/analyze", {
    method: "POST",
    body: JSON.stringify({ postContent })
  });

export const generateImagePrompt = (postContent) =>
  request("/image-prompt", {
    method: "POST",
    body: JSON.stringify({ postContent })
  });

export const generateImage = ({ brief, postContent, analysis, imagePrompt }) =>
  request("/image", {
    method: "POST",
    body: JSON.stringify({ brief, postContent, analysis, imagePrompt })
  });

export const fetchImageHistory = (limit = 12) =>
  request(`/image-history?limit=${limit}`);

export const schedulePost = (payload) =>
  request("/schedule", {
    method: "POST",
    body: JSON.stringify(payload)
  });
