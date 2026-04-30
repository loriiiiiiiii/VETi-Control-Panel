import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useToast } from "@/components/Toast";
import {
  describeError,
  getScripts,
  runScript,
  type ScriptInfo,
} from "@/lib/api";
import { cn } from "@/lib/cn";

const ALL_TAB = "All";

export function ScriptRunner() {
  const toast = useToast();
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

  return (
    <Card
      title="Scripts"
      description={
        loading
          ? "Loading…"
          : `${scripts.length} script${scripts.length === 1 ? "" : "s"} available`
      }
    >
      {loading && (
        <div className="py-6 text-sm text-slate-400">Loading scripts…</div>
      )}

      {!loading && loadError && (
        <div className="rounded-md border border-err/40 bg-err/10 px-3 py-2 text-sm text-err">
          Failed to load scripts: {loadError}
        </div>
      )}

      {!loading && !loadError && scripts.length === 0 && (
        <div className="py-6 text-sm text-slate-400">No scripts found.</div>
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
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-accent text-white"
                      : "bg-bg-subtle text-slate-300 hover:bg-border-strong",
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <Button
                key={s.filename}
                variant="secondary"
                size="md"
                loading={runningName === s.filename}
                disabled={runningName !== null && runningName !== s.filename}
                onClick={() => handleRun(s)}
                className="w-full justify-between"
                title={s.filename}
              >
                <span className="truncate text-left">{s.name}</span>
                {s.hotkey && (
                  <span className="ml-2 shrink-0 rounded border border-border-strong bg-bg px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-300">
                    {s.hotkey}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
