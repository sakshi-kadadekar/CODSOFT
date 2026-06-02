import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SlidersHorizontal } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { DomainSwitcher } from "@/components/DomainSwitcher";
import { AlgorithmToggle } from "@/components/AlgorithmToggle";
import { FilterPanel } from "@/components/FilterPanel";
import { ItemCard } from "@/components/ItemCard";
import { ItemDetailDrawer } from "@/components/ItemDetailDrawer";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { CardSkeleton } from "@/components/CardSkeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { recommend, type Recommendation, type Feedback } from "@/lib/recommendationEngine";
import type { Item } from "@/data/items";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover — taste.engine" },
      {
        name: "description",
        content:
          "Your personalized feed of movies, books, and products. Powered by dual recommendation algorithms.",
      },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const {
    domain,
    algorithm,
    onboarded,
    feedback,
    selectedTags,
    minRating,
    yearRange,
    priceRange,
    search,
    setFeedback,
  } = useAppStore();

  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate model fetch when domain/algorithm changes
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, [domain, algorithm]);

  const recs = useMemo<Recommendation[]>(() => {
    return recommend(algorithm, { feedback: feedback[domain] }, domain);
  }, [algorithm, feedback, domain]);

  const filtered = useMemo(() => {
    return recs.filter((r) => {
      if (selectedTags.length && !selectedTags.some((t) => r.tags.includes(t)))
        return false;
      if (r.rating < minRating) return false;
      if (
        domain !== "products" &&
        r.year !== undefined &&
        (r.year < yearRange[0] || r.year > yearRange[1])
      )
        return false;
      if (
        domain === "products" &&
        r.price !== undefined &&
        (r.price < priceRange[0] || r.price > priceRange[1])
      )
        return false;
      if (
        search &&
        !`${r.title} ${r.creator}`.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [recs, selectedTags, minRating, yearRange, priceRange, search, domain]);

  const handleFeedback = (id: string, f: Feedback) => {
    setFeedback(domain, id, f);
    toast.success(
      f === "like" ? "Added to your taste profile" : "We'll show fewer like this",
      { description: `${algorithm === "collaborative" ? "Collaborative" : "Content-based"} model updated.` },
    );
  };

  if (!onboarded[domain]) {
    return (
      <div className="min-h-screen gradient-mesh">
        <AppHeader />
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <DomainSwitcher />
        </div>
        <OnboardingFlow domain={domain} />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Top control bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <DomainSwitcher />
            <AlgorithmToggle />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
              {filtered.length} results
            </span>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-5">
                <FilterPanel domain={domain} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <div className="sticky top-20 hidden h-fit rounded-2xl border border-border/60 bg-card/50 p-5 lg:block">
            <FilterPanel domain={domain} />
          </div>

          <main>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  For you
                </h2>
                <p className="text-xs text-muted-foreground">
                  {algorithm === "collaborative"
                    ? "Based on people with taste similar to yours."
                    : "Based on items you've liked."}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 text-center">
                <p className="font-display text-lg font-semibold">No matches</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Try loosening your filters or switching the algorithm.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {filtered.slice(0, 32).map((r) => (
                  <ItemCard
                    key={r.id}
                    item={r}
                    feedback={feedback[domain][r.id]}
                    onOpen={() => setSelected(r)}
                    onFeedback={(f) => handleFeedback(r.id, f)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ItemDetailDrawer
        item={selected}
        domain={domain}
        onClose={() => setSelected(null)}
        onSelect={(it: Item) => {
          const asRec = recs.find((r) => r.id === it.id);
          if (asRec) setSelected(asRec);
        }}
      />
    </div>
  );
}
