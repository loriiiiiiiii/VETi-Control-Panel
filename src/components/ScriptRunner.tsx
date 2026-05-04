import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useScripts } from "@/hooks/useScripts";
import { cn } from "@/lib/utils";

const ALL_TAB = "All";

export function ScriptRunner() {
  const { scripts, loading, error: loadError, runningFile, run } = useScripts();
  const [activeCategory, setActiveCategory] = useState<string>(ALL_TAB);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of scripts) {
      if (s.category) set.add(s.category);
    }
    return [ALL_TAB, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [scripts]);

  const filtered = useMemo(() => {
    if (activeCategory === ALL_TAB) return scripts;
    return scripts.filter((s) => s.category === activeCategory);
  }, [scripts, activeCategory]);

  return (
    <div className="flex flex-col gap-2">
      {loading && (
        <div className="py-8 text-center text-base text-muted-foreground">
          Loading scripts…
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-err/40 bg-err/10 px-4 py-3 text-base text-err">
          Failed to load scripts: {loadError}
        </div>
      )}

      {!loading && !loadError && scripts.length === 0 && (
        <div className="py-8 text-center text-base text-muted-foreground">
          No scripts found.
        </div>
      )}

      {!loading && !loadError && scripts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div
            role="tablist"
            aria-label="Script categories"
            className="flex flex-wrap gap-2"
          >
            {categories.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "min-h-12 touch-manipulation rounded-xl px-4 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted",
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((s) => (
              <Button
                key={s.filename}
                variant="secondary"
                size="lg"
                disabled={runningFile !== null && runningFile !== s.filename}
                onClick={() => void run(s)}
                className="h-auto min-h-14 w-full justify-between gap-3 py-3 text-left"
                title={s.filename}
              >
                <span className="line-clamp-2 text-base">{s.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {runningFile === s.filename && (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  )}
                  {s.hotkey && (
                    <span className="rounded-lg border border-border bg-muted px-2 py-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                      {s.hotkey}
                    </span>
                  )}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
