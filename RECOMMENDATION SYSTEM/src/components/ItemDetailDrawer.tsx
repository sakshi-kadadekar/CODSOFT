import { ThumbsDown, ThumbsUp, Star, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ItemThumb } from "./ItemThumb";
import { similar, type Recommendation, type Feedback } from "@/lib/recommendationEngine";
import type { Item, Domain } from "@/data/items";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  item: Recommendation | null;
  domain: Domain;
  onClose: () => void;
  onSelect: (item: Item) => void;
}

export function ItemDetailDrawer({ item, domain, onClose, onSelect }: Props) {
  const setFeedback = useAppStore((s) => s.setFeedback);
  const feedback = useAppStore((s) => (item ? s.feedback[domain][item.id] : undefined));

  if (!item) return null;
  const sims = similar(item, domain, 4);

  const handle = (f: Feedback) => {
    setFeedback(domain, item.id, f);
    toast.success(
      f === "like" ? "Added to your taste profile" : "We'll show fewer like this",
      { description: "Recommendation model updated." },
    );
  };

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="glass-strong w-full overflow-y-auto border-l border-border/60 sm:max-w-lg"
      >
        <SheetHeader className="space-y-0 p-0">
          <SheetTitle className="sr-only">{item.title}</SheetTitle>
          <SheetDescription className="sr-only">{item.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <ItemThumb item={item} size="lg" />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {item.title}
              </h2>
              <div className="font-mono text-sm font-semibold text-primary">
                {Math.round(item.score * 100)}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {item.creator}
              {item.year ? ` · ${item.year}` : ""}
              {item.price ? ` · $${item.price}` : ""}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-mono">{item.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 5.0</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground/90">
            {item.description}
          </p>

          <div className="flex gap-2">
            <Button
              variant={feedback === "like" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => handle("like")}
            >
              <ThumbsUp className="h-4 w-4" />
              Like
            </Button>
            <Button
              variant={feedback === "dislike" ? "destructive" : "outline"}
              className="flex-1 gap-2"
              onClick={() => handle("dislike")}
            >
              <ThumbsDown className="h-4 w-4" />
              Dislike
            </Button>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Similar items
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {sims.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelect(s)}
                  className="group rounded-lg border border-border/60 bg-card/50 p-2 text-left transition-colors hover:border-primary/50"
                >
                  <ItemThumb item={s} size="md" className="h-24" />
                  <p className="mt-2 line-clamp-1 text-xs font-medium">
                    {s.title}
                  </p>
                  <p className="line-clamp-1 text-[10px] text-muted-foreground">
                    {s.tags[0]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
