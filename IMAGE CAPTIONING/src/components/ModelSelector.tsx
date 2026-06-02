import { MODELS, type ModelId } from "@/types/caption.types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface Props {
  value: ModelId;
  onChange: (id: ModelId) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            backbone
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-md border border-border bg-card/60 p-1">
          {MODELS.map((m) => (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onChange(m.id)}
                  className={cn(
                    "group flex items-center justify-center gap-1 rounded px-2 py-2 font-mono text-xs transition-colors",
                    value === m.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  {m.name}
                  <Info className="h-3 w-3 opacity-60" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">{m.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
