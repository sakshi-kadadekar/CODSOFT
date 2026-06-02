import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Brain, Play } from "lucide-react";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { ModelSelector } from "@/components/ModelSelector";
import { CaptionOutput } from "@/components/CaptionOutput";
import { HistoryFeed } from "@/components/HistoryFeed";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { AttentionMap } from "@/components/AttentionMap";
import { useCaptionSession, type GenerationSettings } from "@/hooks/useCaptionSession";
import type { ModelId } from "@/types/caption.types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caption.ai — Image Captioning Research Demo" },
      { name: "description", content: "Generate human-readable captions from images using CNN backbones and Vision Transformers with attention visualization." },
      { property: "og:title", content: "Caption.ai — Image Captioning Research Demo" },
      { property: "og:description", content: "CNN + sequence generation pipeline for real-time image captioning with attention maps." },
    ],
  }),
  component: Index,
});

function Index() {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [model, setModel] = useState<ModelId>("vit");
  const [settings, setSettings] = useState<GenerationSettings>({
    beamWidth: 5,
    maxLength: 20,
    temperature: 1,
  });
  const [showAttention, setShowAttention] = useState(true);
  const { history, current, isLoading, generate, selectFromHistory } = useCaptionSession();

  const handleGenerate = async () => {
    if (!image) return;
    await generate(image.file, image.url, model, settings);
  };

  const attentionAvailable = current?.attention_map && current.model === "vit";

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="bottom-right" />

      {/* header */}
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded border border-primary/40 bg-primary/10">
              <Brain className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="font-mono text-sm font-medium tracking-tight">caption.ai</h1>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                v0.1 · research demo
              </span>
            </div>
          </div>
          <SettingsDrawer settings={settings} onChange={setSettings} />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr_300px]">
          {/* left: input */}
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                01 · input
              </h2>
            </div>
            <ModelSelector value={model} onChange={setModel} />
            <ImageUploader image={image} onChange={setImage} />
            <Button
              onClick={handleGenerate}
              disabled={!image || isLoading}
              className="w-full gap-2 font-mono text-xs"
            >
              <Play className="h-3.5 w-3.5" />
              {isLoading ? "generating…" : "generate_caption()"}
            </Button>
          </section>

          {/* middle: output */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                02 · output
              </h2>
              {attentionAvailable && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="attn" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    attention overlay
                  </Label>
                  <Switch id="attn" checked={showAttention} onCheckedChange={setShowAttention} />
                </div>
              )}
            </div>
            {current && attentionAvailable ? (
              <AttentionMap
                imageUrl={current.imageUrl}
                grid={current.attention_map!}
                show={showAttention}
              />
            ) : current ? (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <img src={current.imageUrl} alt="" className="block w-full" />
              </div>
            ) : (
              <div className="bg-grid flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-card/30">
                <p className="font-mono text-xs text-muted-foreground">{"// awaiting input"}</p>
              </div>
            )}
            <CaptionOutput entry={current} isLoading={isLoading} />
          </section>

          {/* right: history */}
          <aside className="lg:h-[calc(100vh-7rem)] lg:sticky lg:top-20">
            <HistoryFeed
              history={history}
              currentId={current?.id}
              onSelect={selectFromHistory}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
