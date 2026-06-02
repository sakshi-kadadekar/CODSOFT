import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ItemThumb } from "./ItemThumb";
import { dataset, type Domain } from "@/data/items";
import { useAppStore } from "@/store/useAppStore";
import { Sparkles } from "lucide-react";

const MIN_PICKS = 5;

export function OnboardingFlow({ domain }: { domain: Domain }) {
  const items = dataset[domain];
  const setFeedback = useAppStore((s) => s.setFeedback);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const feedback = useAppStore((s) => s.feedback[domain]);

  const [pool] = useState(() =>
    [...items].sort((a, b) => b.rating - a.rating).slice(0, 24),
  );

  const likes = Object.values(feedback).filter((v) => v === "like").length;
  const progress = Math.min(100, (likes / MIN_PICKS) * 100);

  const toggle = (id: string) => {
    setFeedback(domain, id, feedback[id] === "like" ? "dislike" : "like");
  };

  const finish = () => {
    setOnboarded(domain, true);
    toast.success("Taste profile created", {
      description: `Generating ${domain} recommendations...`,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <div className="space-y-3 text-center">
        <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
          <Sparkles className="h-3 w-3" />
          Step 1 · Taste intake
        </Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Pick at least {MIN_PICKS} {domain} you love
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          We use your picks to seed two recommendation models — collaborative and
          content-based. The more you choose, the sharper the feed.
        </p>
      </div>

      <Card className="glass sticky top-2 z-10 flex items-center gap-4 p-4">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-mono text-muted-foreground">
              {likes} / {MIN_PICKS} selected
            </span>
            <span className="font-mono text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <Button
          disabled={likes < MIN_PICKS}
          onClick={finish}
          className="shrink-0"
        >
          Build my feed
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {pool.map((it) => {
          const liked = feedback[it.id] === "like";
          return (
            <button
              key={it.id}
              onClick={() => toggle(it.id)}
              className={`group relative overflow-hidden rounded-xl border-2 p-2 text-left transition-all ${
                liked
                  ? "border-primary bg-primary/5 accent-glow"
                  : "border-border/60 hover:border-primary/40"
              }`}
            >
              <ItemThumb item={it} size="md" className="h-28" />
              <p className="mt-2 line-clamp-1 text-xs font-medium">{it.title}</p>
              <p className="line-clamp-1 text-[10px] text-muted-foreground">
                {it.tags[0]}
              </p>
              {liked && (
                <div className="absolute right-3 top-3 rounded-full bg-primary px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary-foreground">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
