import { History, RefreshCw } from "lucide-react";
import Card from "../Card";

const HistorySection = ({
  buttonClass,
  history,
  loading,
  onRefresh,
  onReuseFullHistoryItem,
  onReuseHistoryPrompt
}) => {
  return (
    <Card
      title="Image History"
      subtitle="Recent generations you can mine for prompts and themes"
      icon={History}
    >
      <div id="history" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-300/80">
            {loading.history ? "Refreshing history..." : "Latest generated image records"}
          </p>
          <button
            className={`${buttonClass} bg-white/8 hover:bg-white/14`}
            onClick={onRefresh}
            disabled={loading.history}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No images generated yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {history.map((item) => (
              <article
                key={item._id}
                className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5"
              >
                {item.imageBase64 ? (
                  <img
                    src={item.imageUrl || item.imageBase64}
                    alt={item.topic || "Generated history image"}
                    className="h-40 w-full object-cover"
                  />
                ) : item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.topic || "Generated history image"}
                    className="h-40 w-full object-cover"
                  />
                ) : null}
                <div className="space-y-2 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "Saved generation"}
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {item.topic || "Untitled topic"}
                  </p>
                  {item.brief?.audience || item.brief?.goal ? (
                    <p className="text-xs leading-5 text-slate-400">
                      {[item.brief?.audience, item.brief?.goal].filter(Boolean).join(" • ")}
                    </p>
                  ) : null}
                  <p className="text-sm leading-6 text-slate-300/80">
                    {item.imagePrompt || "No prompt saved"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onReuseFullHistoryItem(item)}
                      className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/16"
                    >
                      Load Session
                    </button>
                    <button
                      type="button"
                      onClick={() => onReuseHistoryPrompt(item)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                    >
                      Reuse Prompt
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default HistorySection;
