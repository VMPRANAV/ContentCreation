import { CheckCircle2 } from "lucide-react";

const WorkflowOverview = ({ steps, workflowHighlights }) => {
  return (
    <section
      id="workflow"
      className="grid gap-6 border-t border-white/10 py-16 lg:grid-cols-[0.9fr_1.1fr]"
    >
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workflow</p>
        <h2 className="mt-3 font-display text-4xl text-ink">
          A guided production flow instead of a pile of buttons.
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300/82">
          The backend already gives you a clean chain of generation endpoints. The
          frontend now mirrors that chain so each decision feels deliberate and easy to
          follow.
        </p>

        <div className="mt-8 space-y-3">
          {workflowHighlights.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <CheckCircle2 className="mt-0.5 text-accent" size={18} />
              <p className="text-sm leading-6 text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step) => (
          <article
            key={step.id}
            className="rounded-[1.75rem] border border-white/10 bg-panel/70 p-5 shadow-card backdrop-blur"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{step.eyebrow}</p>
            <h3 className="mt-3 font-display text-2xl text-ink">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300/80">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default WorkflowOverview;
