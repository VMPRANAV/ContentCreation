import { Layers3, Sparkles } from "lucide-react";
import Card from "../Card";

const StudioSidebar = ({ postMetrics, steps, statusToneMap, workflowStatus }) => {
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
