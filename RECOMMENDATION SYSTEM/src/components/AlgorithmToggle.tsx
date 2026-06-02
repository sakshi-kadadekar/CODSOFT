import { Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Algorithm } from "@/lib/recommendationEngine";

export function AlgorithmToggle() {
  const algorithm = useAppStore((s) => s.algorithm);
  const setAlgorithm = useAppStore((s) => s.setAlgorithm);

  const Option = ({
    value,
    label,
    icon: Icon,
    sub,
  }: {
    value: Algorithm;
    label: string;
    icon: typeof Users;
    sub: string;
  }) => {
    const active = algorithm === value;
    return (
      <button
        onClick={() => setAlgorithm(value)}
        className={cn(
          "group relative flex-1 rounded-lg px-3 py-2 text-left transition-all",
          active
            ? "bg-card text-foreground shadow-sm accent-glow"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("h-3.5 w-3.5", active && "text-primary")} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-[10px] opacity-80">{sub}</p>
      </button>
    );
  };

  return (
    <div className="flex items-stretch gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
      <Option
        value="collaborative"
        label="Collaborative"
        icon={Users}
        sub="People like you"
      />
      <Option
        value="content"
        label="Content-based"
        icon={FileText}
        sub="What you liked"
      />
    </div>
  );
}
