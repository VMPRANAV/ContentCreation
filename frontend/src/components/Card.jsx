const Card = ({ title, subtitle, icon: Icon, children, className = "" }) => {
  return (
    <section
      className={`rounded-3xl border border-white/10 bg-panel/90 p-5 shadow-card backdrop-blur ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-300/80">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-accent">
            <Icon size={18} strokeWidth={2.2} />
          </div>
        ) : null}
      </header>
      {children}
    </section>
  );
};

export default Card;
