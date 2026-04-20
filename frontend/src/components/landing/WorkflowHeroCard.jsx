const WorkflowHeroCard = ({ steps, statusToneMap, workflowStatus }) => {
  return (
    <div className="animate-fade-slide">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-panel/80 p-5 shadow-card backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              End-to-end system
            </p>
            <h2 className="mt-2 font-display text-2xl text-ink">Production cockpit</h2>
          </div>
          <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Backend Ready
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {step.eyebrow}
                  </p>
                  <p className="mt-1 font-display text-xl text-ink">{step.title}</p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                    statusToneMap[workflowStatus[step.id]]
                  }`}
                >
                  {workflowStatus[step.id]}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300/78">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowHeroCard;
