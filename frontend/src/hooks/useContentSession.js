import { useEffect, useMemo, useState } from "react";
import {
  analyzeContent,
  fetchImageHistory,
  generateImage,
  generateImagePrompt,
  orchestrateContent,
  refinePost,
  schedulePost
} from "../api";

const SESSION_STORAGE_KEYS = [
  "contentc.studio.session.v2",
  "contentc.studio.session.v1"
];
const SESSION_STORAGE_KEY = SESSION_STORAGE_KEYS[0];
const MAX_DRAFT_VERSIONS = 12;

export const steps = [
  {
    id: "brief",
    eyebrow: "01",
    title: "Brief",
    description: "Define the topic, audience, and angle before generating."
  },
  {
    id: "draft",
    eyebrow: "02",
    title: "Draft",
    description: "Generate a LinkedIn post grounded in your stored templates."
  },
  {
    id: "refine",
    eyebrow: "03",
    title: "Refine",
    description: "Tighten tone and pacing without losing the original message."
  },
  {
    id: "visual",
    eyebrow: "04",
    title: "Visual",
    description: "Turn the post into a prompt, then into a finished image asset."
  }
];

export const refinementStyles = [
  "shorter and punchier",
  "more authoritative and strategic",
  "more conversational and warm"
];

export const featureCards = [
  {
    title: "RAG-backed post generation",
    copy: "Drafts are shaped by your stored templates instead of generic social copy."
  },
  {
    title: "Human-in-the-loop editing",
    copy: "Every post stays editable so strategy and taste remain in your hands."
  },
  {
    title: "Visual workflow included",
    copy: "Generate an editorial image prompt and render a matching visual without leaving the app."
  }
];

export const workflowHighlights = [
  "Brief-first workflow so the draft starts with intent",
  "Separate text and image generation steps for tighter control",
  "Reusable image history for quick iteration on winning themes"
];

export const statusToneMap = {
  ready: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  working: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  waiting: "border-white/10 bg-white/5 text-slate-300"
};

const createInitialBrief = () => ({
  topic: "",
  audience: "",
  goal: "",
  cta: ""
});

const createVersionId = () =>
  `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatVersionReason = (reason, meta = {}) => {
  if (reason === "generated") {
    return "AI draft generated";
  }

  if (reason === "manual-save") {
    return "Manual snapshot saved";
  }

  if (reason === "refine-accepted") {
    return `Refine accepted: ${meta.style || "custom style"}`;
  }

  if (reason === "history-reuse") {
    return "Loaded from image history";
  }

  if (reason === "history-prompt") {
    return "Prompt reused from image history";
  }

  if (reason === "restored") {
    return "Restored older draft version";
  }

  return "Saved draft version";
};

const createDraftVersion = ({ brief, content, reason, meta = {} }) => ({
  id: createVersionId(),
  content,
  brief,
  reason,
  label: formatVersionReason(reason, meta),
  meta,
  createdAt: new Date().toISOString()
});

const readPersistedSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    for (const key of SESSION_STORAGE_KEYS) {
      const raw = window.localStorage.getItem(key);

      if (raw) {
        return JSON.parse(raw);
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to read persisted session", error);
    return null;
  }
};

const getPersistedBrief = () => readPersistedSession()?.brief || createInitialBrief();
const getPersistedValue = (key, fallback) => readPersistedSession()?.[key] ?? fallback;

const runAgentStatusSequence = (setAgentStatus) => [
  window.setTimeout(() => setAgentStatus("Critic reviewing..."), 900),
  window.setTimeout(() => setAgentStatus("Artist designing..."), 1800)
];

const buildScheduleNotice = (scheduledDate) =>
  scheduledDate
    ? `Post scheduled for ${new Date(scheduledDate).toLocaleString()}.`
    : "Post scheduled successfully.";

export const useContentSession = () => {
  const [brief, setBrief] = useState(getPersistedBrief);
  const [selectedRefinementStyle, setSelectedRefinementStyle] = useState(() =>
    getPersistedValue("selectedRefinementStyle", refinementStyles[0])
  );
  const [postContent, setPostContentState] = useState(() =>
    getPersistedValue("postContent", "")
  );
  const [contextTemplates, setContextTemplates] = useState(() =>
    getPersistedValue("contextTemplates", [])
  );
  const [analysis, setAnalysis] = useState(() => getPersistedValue("analysis", null));
  const [imagePrompt, setImagePromptState] = useState(() =>
    getPersistedValue("imagePrompt", "")
  );
  const [imagePreview, setImagePreview] = useState(() =>
    getPersistedValue("imagePreview", "")
  );
  const [agentStatus, setAgentStatus] = useState(() =>
    getPersistedValue("agentStatus", "Idle")
  );
  const [history, setHistory] = useState([]);
  const [draftVersions, setDraftVersions] = useState(() =>
    getPersistedValue("draftVersions", [])
  );
  const [latestRefinement, setLatestRefinement] = useState(() =>
    getPersistedValue("latestRefinement", null)
  );
  const [scheduledPost, setScheduledPost] = useState(() =>
    getPersistedValue("scheduledPost", null)
  );
  const [scheduleNotice, setScheduleNotice] = useState(() =>
    getPersistedValue("scheduleNotice", "")
  );
  const [loading, setLoading] = useState({
    analyze: false,
    text: false,
    refine: false,
    imagePrompt: false,
    image: false,
    schedule: false,
    history: false
  });
  const [error, setError] = useState("");

  const canGeneratePost = useMemo(() => Boolean(brief.topic.trim()), [brief.topic]);
  const canGenerateImage = useMemo(() => Boolean(postContent.trim()), [postContent]);

  const postMetrics = useMemo(() => {
    const trimmed = postContent.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = trimmed ? trimmed.split("\n").filter(Boolean).length : 0;

    return {
      characters: postContent.length,
      words,
      lines
    };
  }, [postContent]);

  const workflowStatus = useMemo(
    () => ({
      brief: brief.topic.trim() ? "ready" : "working",
      draft: postContent.trim() ? "ready" : "waiting",
      refine: latestRefinement?.after ? "working" : postContent.trim() ? "ready" : "waiting",
      visual:
        imagePrompt.trim() || imagePreview ? "ready" : postContent.trim() ? "working" : "waiting"
    }),
    [brief.topic, imagePreview, imagePrompt, latestRefinement, postContent]
  );

  const pushDraftVersion = ({ content, reason, meta = {}, briefOverride }) => {
    const trimmed = content?.trim();

    if (!trimmed) {
      return;
    }

    setDraftVersions((prev) => {
      const nextVersion = createDraftVersion({
        brief: briefOverride || brief,
        content: trimmed,
        reason,
        meta
      });

      return [nextVersion, ...prev].slice(0, MAX_DRAFT_VERSIONS);
    });
  };

  const setLoadingState = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const updateBriefField = (field, value) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  };

  const setPostContent = (value) => {
    if (value !== postContent) {
      setAnalysis(null);
    }

    setPostContentState(value);
  };

  const setImagePrompt = (value) => {
    setImagePromptState(value);
  };

  const loadHistory = async () => {
    setLoadingState("history", true);

    try {
      const response = await fetchImageHistory();
      setHistory(response.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingState("history", false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const session = {
      agentStatus,
      analysis,
      brief,
      contextTemplates,
      draftVersions,
      imagePreview,
      imagePrompt,
      latestRefinement,
      postContent,
      scheduleNotice,
      scheduledPost,
      selectedRefinementStyle
    };

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [
    agentStatus,
    analysis,
    brief,
    contextTemplates,
    draftVersions,
    imagePreview,
    imagePrompt,
    latestRefinement,
    postContent,
    scheduleNotice,
    scheduledPost,
    selectedRefinementStyle
  ]);

  const handleGeneratePost = async () => {
    setError("");
    setScheduleNotice("");
    setLoadingState("text", true);
    setAgentStatus("Writer drafting...");

    const statusTimers =
      typeof window === "undefined" ? [] : runAgentStatusSequence(setAgentStatus);

    try {
      const response = await orchestrateContent(brief);
      const nextPost = response.post || "";

      setPostContentState(nextPost);
      setAnalysis(response.analysis || null);
      setContextTemplates(response.contextTemplates || []);
      setImagePromptState(response.imagePrompt || "");
      setLatestRefinement(null);
      pushDraftVersion({
        content: nextPost,
        reason: "generated",
        briefOverride: response.brief || brief
      });
    } catch (err) {
      setError(err.message);
    } finally {
      statusTimers.forEach((timer) => window.clearTimeout(timer));
      setAgentStatus("Idle");
      setLoadingState("text", false);
    }
  };

  const handleRefine = async () => {
    setError("");
    setLoadingState("refine", true);

    try {
      const response = await refinePost(postContent, selectedRefinementStyle);
      setLatestRefinement({
        before: postContent,
        after: response.refinedPost || "",
        style: selectedRefinementStyle,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingState("refine", false);
    }
  };

  const acceptRefinement = () => {
    if (!latestRefinement?.after?.trim()) {
      return;
    }

    setPostContentState(latestRefinement.after);
    setAnalysis(null);
    pushDraftVersion({
      content: latestRefinement.after,
      reason: "refine-accepted",
      meta: { style: latestRefinement.style }
    });
    setLatestRefinement(null);
  };

  const discardRefinement = () => {
    setLatestRefinement(null);
  };

  const saveCurrentDraftVersion = () => {
    pushDraftVersion({
      content: postContent,
      reason: "manual-save"
    });
  };

  const restoreDraftVersion = (versionId) => {
    const version = draftVersions.find((item) => item.id === versionId);

    if (!version) {
      return;
    }

    setBrief(version.brief || createInitialBrief());
    setPostContentState(version.content);
    setLatestRefinement(null);
    pushDraftVersion({
      content: version.content,
      reason: "restored"
    });
  };

  const removeDraftVersion = (versionId) => {
    setDraftVersions((prev) => prev.filter((item) => item.id !== versionId));
  };

  const handleGenerateImagePrompt = async () => {
    setError("");
    setLoadingState("imagePrompt", true);

    try {
      const imagePromptResponse = await generateImagePrompt(postContent);
      setImagePromptState(imagePromptResponse.imagePrompt || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingState("imagePrompt", false);
    }
  };

  const handleGenerateImage = async () => {
    setError("");
    setLoadingState("image", true);

    try {
      const imageResponse = await generateImage({
        brief,
        postContent,
        analysis,
        imagePrompt
      });

      setImagePreview(imageResponse.imageUrl || imageResponse.imageBase64 || "");
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingState("image", false);
    }
  };

  const handleSchedule = async () => {
    if (!postContent.trim()) {
      return;
    }

    setError("");
    setScheduleNotice("");
    setLoadingState("schedule", true);

    try {
      const response = await schedulePost({
        postContent,
        imageUrl: imagePreview || undefined,
        brief,
        analysis
      });

      setScheduledPost(response.scheduledPost || null);
      setScheduleNotice(buildScheduleNotice(response.scheduledPost?.scheduledDate));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingState("schedule", false);
    }
  };

  const handleAnalyzePost = async (contentOverride) => {
    const content = (contentOverride ?? postContent).trim();

    if (!content) {
      setAnalysis(null);
      return null;
    }

    setError("");
    setAgentStatus("Critic reviewing...");
    setLoadingState("analyze", true);

    try {
      const response = await analyzeContent(content);
      setAnalysis(response.analysis || null);
      return response.analysis || null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoadingState("analyze", false);
      setAgentStatus("Idle");
    }
  };

  const reuseHistoryItem = (item, mode = "full") => {
    const nextBrief = item.brief || {
      topic: item.topic || "",
      audience: "",
      goal: "",
      cta: ""
    };

    setBrief(nextBrief);
    setScheduledPost(null);
    setScheduleNotice("");

    if (mode === "full") {
      setPostContentState(item.postContent || "");
      setImagePromptState(item.imagePrompt || "");
      setImagePreview(item.imageUrl || item.imageBase64 || "");
      setAnalysis(item.analysis || null);
      setLatestRefinement(null);
      pushDraftVersion({
        content: item.postContent || "",
        reason: "history-reuse",
        meta: { historyId: item._id },
        briefOverride: nextBrief
      });
      return;
    }

    if (mode === "prompt") {
      setImagePromptState(item.imagePrompt || "");
      setImagePreview(item.imageUrl || item.imageBase64 || "");
      pushDraftVersion({
        content: postContent,
        reason: "history-prompt",
        meta: { historyId: item._id },
        briefOverride: nextBrief
      });
    }
  };

  return {
    acceptRefinement,
    agentStatus,
    analysis,
    brief,
    canGenerateImage,
    canGeneratePost,
    contextTemplates,
    discardRefinement,
    draftVersions,
    error,
    history,
    imagePreview,
    imagePrompt,
    latestRefinement,
    loading,
    postContent,
    postMetrics,
    scheduleNotice,
    scheduledPost,
    restoreDraftVersion,
    removeDraftVersion,
    reuseHistoryItem,
    saveCurrentDraftVersion,
    selectedRefinementStyle,
    workflowStatus,
    handleGenerateImage,
    handleGenerateImagePrompt,
    handleAnalyzePost,
    handleGeneratePost,
    handleRefine,
    handleSchedule,
    loadHistory,
    setImagePrompt,
    setPostContent,
    setSelectedRefinementStyle,
    updateBriefField
  };
};
