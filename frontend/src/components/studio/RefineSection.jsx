import { RefreshCw } from "lucide-react";
import Card from "../Card";

const RefineSection = ({
  buttonClass,
  latestRefinement,
  loading,
  onAcceptRefinement,
  onDiscardRefinement,
  onRefine,
  refinementStyles,
  selectedRefinementStyle,
  setSelectedRefinementStyle,
  postContent
}) => {
  return (
    <Card
      title="Refine"
      subtitle="Adjust voice and pacing without losing the core message"
      icon={RefreshCw}
    >
      <div id="refine" className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {refinementStyles.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setSelectedRefinementStyle(style)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                selectedRefinementStyle === style
                  ? "border-accent/40 bg-accent/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className={`${buttonClass} bg-white/8 hover:bg-white/14`}
            onClick={onRefine}
            disabled={!postContent.trim() || loading.refine}
          >
            <RefreshCw size={16} />
            {loading.refine ? "Refining..." : "Refine Draft"}
          </button>
          <a href="#visual" className={`${buttonClass} bg-white/8 hover:bg-white/14`}>
            Move To Visuals
          </a>
        </div>

        {latestRefinement ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Before</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300/82">
                {latestRefinement.before}
              </p>
            </div>

            <div className="rounded-3xl border border-accent/25 bg-accent/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-accent">After</p>
                  <p className="mt-1 text-sm text-slate-300/80">
                    Candidate using "{latestRefinement.style}"
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(latestRefinement.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                {latestRefinement.after}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className={`${buttonClass} bg-accent/18 hover:bg-accent/28`}
                  onClick={onAcceptRefinement}
                >
                  Accept Refinement
                </button>
                <button
                  className={`${buttonClass} bg-white/8 hover:bg-white/14`}
                  onClick={onDiscardRefinement}
                >
                  Keep Original
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm leading-6 text-slate-300/82">
              Refinement now creates a candidate version first, so you can compare before
              and after before replacing the current draft.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RefineSection;
