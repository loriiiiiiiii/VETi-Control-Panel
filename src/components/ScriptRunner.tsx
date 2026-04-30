import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  describeError,
  getScripts,
  runScript,
  type ScriptInfo,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const ALL_TAB = "All";

type ScriptRunnerProps = {
  embedded?: boolean;
};

export function ScriptRunner({ embedded = false }: ScriptRunnerProps) {
  const [scripts, setScripts] = useState<ScriptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runningName, setRunningName] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_TAB);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getScripts();
        if (cancelled) return;
        setScripts(data);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(describeError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleRun = async (script: ScriptInfo) => {
    setRunningName(script.filename);
    try {
      const res = await runScript(script.name || script.filename);
      if (res.success) {
        toast.success(`Started: ${res.script ?? script.name}`);
      } else if (res.error === "busy") {
        toast.error(`Busy: ${res.script ?? script.name}`);
      } else {
        toast.error(res.error ?? `Failed to run ${script.name}`);
      }
    } catch (err) {
      toast.error(`Run failed: ${describeError(err)}`);
    } finally {
      setRunningName(null);
    }
  };

  const tabClass = embedded
    ? "min-h-12 rounded-xl px-4 text-sm font-medium"
    : "rounded-full px-3 py-1 text-xs font-medium";

  const body = (
    <>
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
                    "touch-manipulation transition-colors",
                    tabClass,
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
                disabled={runningName !== null && runningName !== s.filename}
                onClick={() => handleRun(s)}
                className="h-auto min-h-14 w-full justify-between gap-3 py-3 text-left"
                title={s.filename}
              >
                <span className="line-clamp-2 text-base">{s.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {runningName === s.filename && (
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
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-2">{body}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scripts</CardTitle>
        <CardDescription>
          {loading
            ? "Loading…"
            : `${scripts.length} script${scripts.length === 1 ? "" : "s"} available`}
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
