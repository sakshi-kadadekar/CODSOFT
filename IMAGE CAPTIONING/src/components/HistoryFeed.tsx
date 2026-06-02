import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/types/caption.types";

interface Props {
  history: HistoryEntry[];
  currentId?: string;
  onSelect: (entry: HistoryEntry) => void;
}

function relativeTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function HistoryFeed({ history, currentId, onSelect }: Props) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          session history
        </span>
        <span className="font-mono text-xs text-muted-foreground">{history.length}</span>
      </div>
      <ScrollArea className="flex-1">
        {history.length === 0 ? (
          <p className="px-4 py-6 font-mono text-xs text-muted-foreground">
            {"// no captions yet"}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((entry) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <button
                  onClick={() => onSelect(entry)}
                  className={cn(
                    "flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60",
                    currentId === entry.id && "bg-secondary",
                  )}
                >
                  <img
                    src={entry.imageUrl}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-xs text-foreground">{entry.caption}</p>
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
                      <span>{entry.model}</span>
                      <span>·</span>
                      <span>{relativeTime(entry.timestamp)}</span>
                    </div>
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
