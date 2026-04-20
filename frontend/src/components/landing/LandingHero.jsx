const LandingHero = ({ buttonClass, featureCards }) => {
  return (
    <div className="animate-rise-in">
      <p className="mb-4 inline-flex rounded-full border border-accent/35 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
        Strategy to draft to visual
      </p>
      <h1 className="max-w-3xl font-display text-5xl leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
        Build sharper LinkedIn content with an AI workflow that still feels like yours.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300/88 sm:text-lg">
        ContentC combines template-aware drafting, guided refinement, and AI image
        generation in one studio so a single topic can become a publishable post and a
        matching visual in minutes.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="#studio"
          className={`${buttonClass} bg-accent/20 hover:bg-accent/28`}
        >
          Open Studio
        </a>
        <a
          href="#workflow"
          className={`${buttonClass} bg-white/8 hover:bg-white/14`}
        >
          See Workflow
        </a>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {featureCards.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur"
          >
            <p className="font-display text-lg text-ink">{feature.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300/80">{feature.copy}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingHero;
