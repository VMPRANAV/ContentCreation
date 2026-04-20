import { BookmarkPlus, RefreshCw, Sparkles } from "lucide-react";
import Card from "../Card";

const DraftSection = ({
  buttonClass,
  canGeneratePost,
  contextTemplates,
  draftVersions,
  loading,
  onGeneratePost,
  onRestoreDraftVersion,
  onSaveCurrentDraftVersion,
  onSetPostContent,
  postContent
}) => {
  return (
    <Card
      title="Draft"
      subtitle="Generate and manually shape the LinkedIn post"
      icon={Sparkles}
    >
      <div id="draft" className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="post-content">
            Post Draft
          </label>
          <textarea
            id="post-content"
            rows={12}
            value={postContent}
            onChange={(event) => onSetPostContent(event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-sm leading-6 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/65"
            placeholder="Your generated post appears here..."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className={`${buttonClass} bg-white/8 hover:bg-white/14`}
            onClick={onGeneratePost}
            disabled={!canGeneratePost || loading.text}
          >
            <RefreshCw size={16} />
            {loading.text ? "Regenerating..." : "Regenerate Draft"}
          </button>
          <a href="#refine" className={`${buttonClass} bg-white/8 hover:bg-white/14`}>
            Continue To Refine
          </a>
          <button
            className={`${buttonClass} bg-white/8 hover:bg-white/14`}
            onClick={onSaveCurrentDraftVersion}
            disabled={!postContent.trim()}
          >
            <BookmarkPlus size={16} />
            Save Snapshot
          </button>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Context Templates</p>
            {contextTemplates.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Generate a draft to inspect which RAG templates influenced the post.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {contextTemplates.map((template, index) => (
                  <div
                    key={template._id || `${template.hook}-${index}`}
                    className="rounded-2xl border border-white/10 bg-surface/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Template {index + 1}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {template.hook || "Untitled hook"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300/80">
                      {template.structure || template.example || template.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Editorial Notes</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300/82">
              <p>
                Audience, goal, and CTA now travel with the topic into generation so the
                backend prompt and retrieval query both reflect the full brief.
              </p>
              <p>
                The editable draft remains the source of truth. AI helps generate and
                refine, but final language still stays in your hands.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Draft Versions</p>
            {draftVersions.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Save snapshots, accept refinements, or reuse history items to build version
                history here.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {draftVersions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-2xl border border-white/10 bg-surface/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{version.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(version.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRestoreDraftVersion(version.id)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                      >
                        Restore
                      </button>
                    </div>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300/80">
                      {version.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DraftSection;
