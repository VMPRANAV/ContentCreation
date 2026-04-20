import { Image as ImageIcon, WandSparkles } from "lucide-react";
import Card from "../Card";

const VisualSection = ({
  buttonClass,
  canGenerateImage,
  imagePreview,
  imagePrompt,
  loading,
  onGenerateImage,
  onGenerateImagePrompt,
  onSetImagePrompt
}) => {
  return (
    <Card
      title="Visual"
      subtitle="Generate the image prompt first, then render the final asset"
      icon={ImageIcon}
      className="animate-fade-slide"
    >
      <div id="visual" className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            className={`${buttonClass} bg-glow/20 hover:bg-glow/28`}
            onClick={onGenerateImagePrompt}
            disabled={!canGenerateImage || loading.imagePrompt}
          >
            <WandSparkles size={16} />
            {loading.imagePrompt ? "Writing Prompt..." : "Generate Image Prompt"}
          </button>
          <button
            className={`${buttonClass} bg-white/8 hover:bg-white/14`}
            onClick={onGenerateImage}
            disabled={!imagePrompt.trim() || loading.image}
          >
            <ImageIcon size={16} />
            {loading.image ? "Rendering Image..." : "Render Final Image"}
          </button>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="image-prompt">
            Refined SD Prompt
          </label>
          <textarea
            id="image-prompt"
            rows={5}
            value={imagePrompt}
            onChange={(event) => onSetImagePrompt(event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-sm leading-6 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-glow/60"
            placeholder="Prompt generated from post content"
          />
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-black/30">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Generated visual"
              className="h-[340px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[340px] items-center justify-center text-sm text-slate-400">
              Your generated image will appear here.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default VisualSection;
