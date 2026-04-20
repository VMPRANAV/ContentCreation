import { ArrowRight, Layers3 } from "lucide-react";
import BriefSection from "./components/studio/BriefSection";
import DraftSection from "./components/studio/DraftSection";
import HistorySection from "./components/studio/HistorySection";
import RefineSection from "./components/studio/RefineSection";
import StudioSidebar from "./components/studio/StudioSidebar";
import VisualSection from "./components/studio/VisualSection";
import LandingHero from "./components/landing/LandingHero";
import WorkflowHeroCard from "./components/landing/WorkflowHeroCard";
import WorkflowOverview from "./components/workflow/WorkflowOverview";
import {
  featureCards,
  refinementStyles,
  statusToneMap,
  steps,
  useContentSession,
  workflowHighlights
} from "./hooks/useContentSession";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white shadow-neon disabled:cursor-not-allowed disabled:opacity-50";

function App() {
  const {
    acceptRefinement,
    brief,
    canGenerateImage,
    canGeneratePost,
    contextTemplates,
    discardRefinement,
    draftVersions,
    error,
    history,
    imagePreview,
    imagePrompt,
    latestRefinement,
    loading,
    postContent,
    postMetrics,
    restoreDraftVersion,
    reuseHistoryItem,
    saveCurrentDraftVersion,
    selectedRefinementStyle,
    workflowStatus,
    handleGenerateImage,
    handleGenerateImagePrompt,
    handleGeneratePost,
    handleRefine,
    loadHistory,
    setImagePrompt,
    setPostContent,
    setSelectedRefinementStyle,
    updateBriefField
  } = useContentSession();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(82,199,184,0.14),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(255,143,111,0.16),transparent_28%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-neon">
              <Layers3 size={18} />
            </span>
            <div>
              <p className="font-display text-base">ContentC</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                LinkedIn Content Engine
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#workflow" className="transition-colors hover:text-white">
              Workflow
            </a>
            <a href="#studio" className="transition-colors hover:text-white">
              Studio
            </a>
            <a href="#history" className="transition-colors hover:text-white">
              History
            </a>
          </nav>

          <a
            href="#studio"
            className={`${buttonClass} bg-accent/18 hover:bg-accent/28`}
          >
            Start Creating
            <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 pb-16 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:pb-24">
          <LandingHero buttonClass={buttonClass} featureCards={featureCards} />
          <WorkflowHeroCard
            steps={steps}
            statusToneMap={statusToneMap}
            workflowStatus={workflowStatus}
          />
        </section>

        <WorkflowOverview steps={steps} workflowHighlights={workflowHighlights} />

        <section
          id="studio"
          className="grid gap-5 border-t border-white/10 py-16 lg:grid-cols-[280px_minmax(0,1fr)]"
        >
          <StudioSidebar
            postMetrics={postMetrics}
            steps={steps}
            statusToneMap={statusToneMap}
            workflowStatus={workflowStatus}
          />

          <div className="grid gap-5">
            <BriefSection
              brief={brief}
              buttonClass={buttonClass}
              canGeneratePost={canGeneratePost}
              loading={loading}
              onGeneratePost={handleGeneratePost}
              onUpdateBriefField={updateBriefField}
            />

            <DraftSection
              buttonClass={buttonClass}
              canGeneratePost={canGeneratePost}
              contextTemplates={contextTemplates}
              draftVersions={draftVersions}
              loading={loading}
              onGeneratePost={handleGeneratePost}
              onRestoreDraftVersion={restoreDraftVersion}
              onSaveCurrentDraftVersion={saveCurrentDraftVersion}
              onSetPostContent={setPostContent}
              postContent={postContent}
            />

            <RefineSection
              buttonClass={buttonClass}
              latestRefinement={latestRefinement}
              loading={loading}
              onAcceptRefinement={acceptRefinement}
              onDiscardRefinement={discardRefinement}
              onRefine={handleRefine}
              refinementStyles={refinementStyles}
              selectedRefinementStyle={selectedRefinementStyle}
              setSelectedRefinementStyle={setSelectedRefinementStyle}
              postContent={postContent}
            />

            <VisualSection
              buttonClass={buttonClass}
              canGenerateImage={canGenerateImage}
              imagePreview={imagePreview}
              imagePrompt={imagePrompt}
              loading={loading}
              onGenerateImage={handleGenerateImage}
              onGenerateImagePrompt={handleGenerateImagePrompt}
              onSetImagePrompt={setImagePrompt}
            />

            <HistorySection
              buttonClass={buttonClass}
              history={history}
              loading={loading}
              onRefresh={loadHistory}
              onReuseFullHistoryItem={(item) => reuseHistoryItem(item, "full")}
              onReuseHistoryPrompt={(item) => reuseHistoryItem(item, "prompt")}
            />

            {error ? (
              <div className="rounded-2xl border border-red-300/35 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
