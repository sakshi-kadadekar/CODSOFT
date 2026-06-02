import { cn } from "@/lib/utils";
import type { Item } from "@/data/items";

interface Props {
  item: Pick<Item, "gradient" | "emoji" | "title">;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ItemThumb({ item, className, size = "md" }: Props) {
  const [from, to] = item.gradient;
  const sizes = {
    sm: "h-14 w-14 text-2xl",
    md: "h-40 w-full text-5xl",
    lg: "h-56 w-full text-6xl",
  };
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl",
        sizes[size],
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(circle at 30% 20%, ${from}, ${to})`,
      }}
      aria-hidden
    >
      <span className="drop-shadow-lg">{item.emoji}</span>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.18),transparent_60%)]" />
    </div>
  );
}
