import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { RotateCcw, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { DomainSwitcher } from "@/components/DomainSwitcher";
import { TasteRadar } from "@/components/TasteRadar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";
import { tasteProfile } from "@/lib/recommendationEngine";
import { dataset } from "@/data/items";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Taste Profile — taste.engine" },
      {
        name: "description",
        content: "Your personal taste profile across movies, books, and products.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const domain = useAppStore((s) => s.domain);
  const feedback = useAppStore((s) => s.feedback[domain]);
  const clearFeedbackFor = useAppStore((s) => s.clearFeedbackFor);
  const resetAll = useAppStore((s) => s.resetAll);

  const profile = useMemo(
    () => tasteProfile({ feedback }, domain),
    [feedback, domain],
  );

  const items = dataset[domain];
  const likes = Object.entries(feedback)
    .filter(([, v]) => v === "like")
    .map(([id]) => items.find((it) => it.id === id))
    .filter(Boolean);
  const dislikes = Object.entries(feedback)
    .filter(([, v]) => v === "dislike")
    .map(([id]) => items.find((it) => it.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen gradient-mesh">
      <AppHeader />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2 gap-1 font-mono text-[10px]">
              <Sparkles className="h-3 w-3" />
              Taste profile
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Your signal map
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              How the model sees you across {domain}. Updates live as you give
              feedback.
            </p>
          </div>
          <DomainSwitcher />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Affinity radar
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                top {profile.length} tags
              </span>
            </div>
            <TasteRadar data={profile} />
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Stats
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Liked" value={likes.length} accent />
              <Stat label="Passed" value={dislikes.length} />
              <Stat label="Tags ranked" value={profile.length} />
              <Stat label="Top tag" value={profile[0]?.tag ?? "—"} small />
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Top affinities
              </h3>
              <div className="space-y-1.5">
                {profile.slice(0, 6).map((p) => (
                  <div key={p.tag} className="flex items-center gap-3">
                    <span className="w-24 truncate text-xs">{p.tag}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${p.value}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
                      {p.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent feedback
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FeedbackList
              title="Liked"
              icon={<ThumbsUp className="h-3.5 w-3.5 text-primary" />}
              items={likes as { id: string; title: string; tags: string[] }[]}
            />
            <FeedbackList
              title="Passed"
              icon={<ThumbsDown className="h-3.5 w-3.5 text-destructive" />}
              items={dislikes as { id: string; title: string; tags: string[] }[]}
            />
          </div>
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-3 border-destructive/30 p-6">
          <div>
            <h3 className="font-display text-sm font-semibold">Reset taste profile</h3>
            <p className="text-xs text-muted-foreground">
              Clear feedback for {domain} or wipe everything across all domains.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearFeedbackFor(domain);
                toast.success(`${domain} preferences cleared`);
              }}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset {domain}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                resetAll();
                toast.success("All preferences reset");
              }}
            >
              Reset everything
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-display font-bold tracking-tight ${
          small ? "text-base" : "text-2xl"
        } ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function FeedbackList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; title: string; tags: string[] }[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {title} ({items.length})
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
          Nothing yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 10).map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
            >
              <span className="line-clamp-1 text-xs">{it.title}</span>
              <span className="ml-2 shrink-0 font-mono text-[10px] text-muted-foreground">
                {it.tags[0]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
