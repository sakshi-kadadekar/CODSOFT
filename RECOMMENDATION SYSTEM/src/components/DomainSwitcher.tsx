import { Film, BookOpen, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Domain } from "@/data/items";

const opts: { value: Domain; label: string; icon: typeof Film }[] = [
  { value: "movies", label: "Movies", icon: Film },
  { value: "books", label: "Books", icon: BookOpen },
  { value: "products", label: "Products", icon: ShoppingBag },
];

export function DomainSwitcher() {
  const domain = useAppStore((s) => s.domain);
  const setDomain = useAppStore((s) => s.setDomain);
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
      {opts.map((o) => {
        const active = domain === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setDomain(o.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <o.icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
