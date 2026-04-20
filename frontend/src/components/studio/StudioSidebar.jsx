import { Layers3, Sparkles } from "lucide-react";
import Card from "../Card";

const scoreTone = (score) => {
  if (score >= 8) {
    return "border-emerald-300/20 bg-emerald-500/10 text-emerald-100";
  }

  if (score >= 6) {
    return "border-amber-300/20 bg-amber-500/10 text-amber-100";
  }

  return "border-rose-300/20 bg-rose-500/10 text-rose-100";
};

const StudioSidebar = ({
  agentStatus,
  analysis,
  loading,
  onAnalyzePost,
  postMetrics,
  steps,
  statusToneMap,
  workflowStatus
}) => {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
      <Card
        title="Workflow"
        subtitle="Where you are in the production cycle"
        icon={Layers3}
      >
        <div className="space-y-3">
          {steps.map((step) => (
            <a
              key={step.id}
              href={`#${step.id}`}
              className="group block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    {step.eyebrow}
                  </p>
                  <p className="mt-1 font-medium text-ink">{step.title}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
                    statusToneMap[workflowStatus[step.id]]
                  }`}
                >
                  {workflowStatus[step.id]}
                </span>
              </div>
            </a>
          ))}
        </div>
      </Card>

      <Card title="Agent Analysis" subtitle="Critic signals from the current draft" icon={Sparkles}>
        {analysis ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Agent Status</p>
              <p className="mt-2 text-sm font-medium text-slate-200">{agentStatus || "Idle"}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ["Hook", analysis.hookScore],
                ["Readability", analysis.readabilityScore],
                ["Virality", analysis.viralityScore]
              ].map(([label, score]) => (
                <span
                  key={label}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${scoreTone(score)}`}
                >
                  {label}: {score}/10
                </span>
              ))}
            </div>

            {analysis.suggestions?.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Critic Suggestions
                </p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300/82">
                  {analysis.suggestions.map((suggestion, index) => (
                    <p key={`${suggestion}-${index}`}>{suggestion}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onAnalyzePost}
              disabled={loading.analyze}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading.analyze ? "Refreshing..." : "Refresh Critic Analysis"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm leading-6 text-slate-300/82">
                Generate a draft to see the Critic Agent’s hook, readability, and virality scores.
              </p>
            </div>
            <button
              type="button"
              onClick={onAnalyzePost}
              disabled={!postMetrics.words || loading.analyze}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading.analyze ? "Working..." : "Run Critic Analysis"}
            </button>
          </div>
        )}
      </Card>

      <Card title="Post Metrics" subtitle="Live signals from your current draft" icon={Sparkles}>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Chars</p>
            <p className="mt-2 font-display text-2xl text-ink">{postMetrics.characters}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Words</p>
            <p className="mt-2 font-display text-2xl text-ink">{postMetrics.words}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lines</p>
            <p className="mt-2 font-display text-2xl text-ink">{postMetrics.lines}</p>
          </div>
        </div>
      </Card>
    </aside>
  );
};

export default StudioSidebar;
