import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { allTags, type Domain } from "@/data/items";
import { useAppStore } from "@/store/useAppStore";

export function FilterPanel({ domain }: { domain: Domain }) {
  const {
    search,
    setSearch,
    selectedTags,
    setTags,
    minRating,
    setMinRating,
    yearRange,
    setYearRange,
    priceRange,
    setPriceRange,
  } = useAppStore();

  const tags = allTags(domain);
  const toggleTag = (t: string) =>
    setTags(
      selectedTags.includes(t)
        ? selectedTags.filter((x) => x !== t)
        : [...selectedTags, t],
    );

  return (
    <aside className="space-y-6 p-1">
      <div>
        <Label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Search
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${domain}...`}
            className="pl-8"
          />
        </div>
      </div>

      <Separator />

      <div>
        <Label className="mb-3 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {domain === "products" ? "Categories" : "Genres"}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <Badge
                key={t}
                variant={active ? "default" : "outline"}
                onClick={() => toggleTag(t)}
                className="cursor-pointer text-[10px]"
              >
                {t}
              </Badge>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Min rating
          </Label>
          <span className="flex items-center gap-1 font-mono text-xs">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {minRating.toFixed(1)}
          </span>
        </div>
        <Slider
          value={[minRating]}
          onValueChange={([v]) => setMinRating(v)}
          min={0}
          max={5}
          step={0.1}
        />
      </div>

      {domain !== "products" && (
        <>
          <Separator />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Year
              </Label>
              <span className="font-mono text-xs">
                {yearRange[0]}–{yearRange[1]}
              </span>
            </div>
            <Slider
              value={yearRange}
              onValueChange={(v) => setYearRange(v as [number, number])}
              min={1980}
              max={2025}
              step={1}
            />
          </div>
        </>
      )}

      {domain === "products" && (
        <>
          <Separator />
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Price
              </Label>
              <span className="font-mono text-xs">
                ${priceRange[0]}–${priceRange[1]}
              </span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              min={0}
              max={2000}
              step={10}
            />
          </div>
        </>
      )}
    </aside>
  );
}
