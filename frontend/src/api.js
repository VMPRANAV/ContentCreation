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

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
};

export const generatePost = (brief) =>
  request("/generate", {
    method: "POST",
    body: JSON.stringify({ brief })
  });

export const refinePost = (postContent, style) =>
  request("/refine", {
    method: "POST",
    body: JSON.stringify({ postContent, style })
  });

export const generateImagePrompt = (postContent) =>
  request("/image-prompt", {
    method: "POST",
    body: JSON.stringify({ postContent })
  });

export const generateImage = ({ brief, postContent, imagePrompt }) =>
  request("/image", {
    method: "POST",
    body: JSON.stringify({ brief, postContent, imagePrompt })
  });

export const fetchImageHistory = (limit = 12) =>
  request(`/image-history?limit=${limit}`);
