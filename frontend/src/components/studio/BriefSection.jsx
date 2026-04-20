import { Bot, Sparkles } from "lucide-react";
import Card from "../Card";

const BriefSection = ({
  brief,
  buttonClass,
  canGeneratePost,
  loading,
  onGeneratePost,
  onUpdateBriefField
}) => {
  return (
    <Card
      title="Brief"
      subtitle="Start with the core angle of the post"
      icon={Bot}
      className="animate-rise-in"
    >
      <div id="brief" className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="topic">
            Topic
          </label>
          <input
            id="topic"
            value={brief.topic}
            onChange={(event) => onUpdateBriefField("topic", event.target.value)}
            placeholder="How AI copilots improve GTM velocity"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/65"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="audience">
            Audience
          </label>
          <input
            id="audience"
            value={brief.audience}
            onChange={(event) => onUpdateBriefField("audience", event.target.value)}
            placeholder="B2B marketers, founders, revenue teams"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/65"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="goal">
            Goal
          </label>
          <input
            id="goal"
            value={brief.goal}
            onChange={(event) => onUpdateBriefField("goal", event.target.value)}
            placeholder="Educate, build trust, drive replies"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/65"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="cta">
            CTA direction
          </label>
          <input
            id="cta"
            value={brief.cta}
            onChange={(event) => onUpdateBriefField("cta", event.target.value)}
            placeholder="Invite readers to comment, share a take, or book a demo"
            className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/65"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            className={`${buttonClass} bg-accent/18 hover:bg-accent/28`}
            onClick={onGeneratePost}
            disabled={!canGeneratePost || loading.text}
          >
            <Sparkles size={16} />
            {loading.text ? "Generating..." : "Generate Draft"}
          </button>
          <a href="#draft" className={`${buttonClass} bg-white/8 hover:bg-white/14`}>
            Jump To Draft
          </a>
        </div>
      </div>
    </Card>
  );
};

export default BriefSection;
