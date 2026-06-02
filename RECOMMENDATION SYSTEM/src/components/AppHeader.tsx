import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles, LayoutDashboard, Home } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navItem = (to: string, label: string, Icon: typeof Home) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        path === to
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );

  return (
    <header className="glass sticky top-0 z-30 border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight">
            taste<span className="text-primary">.engine</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItem("/", "Discover", Home)}
          {navItem("/dashboard", "Taste Profile", LayoutDashboard)}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
