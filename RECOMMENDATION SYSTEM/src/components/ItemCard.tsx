import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ItemThumb } from "./ItemThumb";
import type { Recommendation } from "@/lib/recommendationEngine";
import type { Feedback } from "@/lib/recommendationEngine";

interface Props {
  item: Recommendation;
  feedback?: Feedback;
  onOpen: () => void;
  onFeedback: (f: Feedback) => void;
}

export function ItemCard({ item, feedback, onOpen, onFeedback }: Props) {
  const pct = Math.round(item.score * 100);
  return (
    <Card
      className="group overflow-hidden border-border/70 bg-card/70 p-0 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full p-3 text-left"
      >
        <div className="relative">
          <ItemThumb item={item} />
          <div className="glass-strong absolute right-2 top-2 rounded-full px-2 py-1 font-mono text-[11px] font-semibold text-primary">
            {pct}% match
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <h3 className="line-clamp-1 font-display text-sm font-semibold tracking-tight">
            {item.title}
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {item.creator}
            {item.year ? ` · ${item.year}` : ""}
            {item.price ? ` · $${item.price}` : ""}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            {item.tags.slice(0, 2).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
          <p className="pt-1 text-[11px] italic text-muted-foreground/80">
            {item.reasons[0]}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-1 border-t border-border/60 px-3 py-2">
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 flex-1 gap-1 text-xs",
            feedback === "like" && "bg-primary/15 text-primary",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onFeedback("like");
          }}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          Like
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 flex-1 gap-1 text-xs",
            feedback === "dislike" && "bg-destructive/15 text-destructive",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onFeedback("dislike");
          }}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          Pass
        </Button>
      </div>
    </Card>
  );
}
