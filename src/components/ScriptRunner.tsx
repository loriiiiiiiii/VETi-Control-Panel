import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type Segment } from "@/components/ui/segmented-control";
import { useBackend } from "@/context/BackendContext";
import { describeError, DISPLAY_SCENES, type DisplayScene } from "@/lib/api";
import { useScripts } from "@/hooks/useScripts";

const ALL_TAB = "All";

export function ScriptRunner() {
  const { client } = useBackend();
  const { scripts, loading, error: loadError, runningFile, run } = useScripts();
  const [activeCategory, setActiveCategory] = useState<string>(ALL_TAB);
  const [activeScene, setActiveScene] = useState<DisplayScene | null>(null);
  const [pendingScene, setPendingScene] = useState<DisplayScene | null>(null);

  const categorySegments: Segment[] = useMemo(() => {
    const set = new Set<string>();
    for (const s of scripts) {
      if (s.category) set.add(s.category);
    }
    const cats = [ALL_TAB, ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    return cats.map((c) => ({ id: c, label: c }));
  }, [scripts]);

  const filtered = useMemo(() => {
    if (activeCategory === ALL_TAB) return scripts;
    return scripts.filter((s) => s.category === activeCategory);
  }, [scripts, activeCategory]);

  const handleSceneClick = async (scene: DisplayScene) => {
    setPendingScene(scene);
    try {
      const res = await client.setDisplaySource(scene);
      if (res.success) {
        setActiveScene(res.scene ?? scene);
        toast.success(`Display: ${res.scene ?? scene}`);
      } else {
        toast.error(res.error ?? `Failed to set scene: ${scene}`);
      }
    } catch (err) {
      toast.error(`Display failed: ${describeError(err)}`);
    } finally {
      setPendingScene(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">
          Display source
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DISPLAY_SCENES.map((scene) => (
            <Button
              key={scene}
              variant={activeScene === scene ? "default" : "outline"}
              size="lg"
              disabled={pendingScene !== null && pendingScene !== scene}
              onClick={() => handleSceneClick(scene)}
              className="min-h-14 w-full capitalize"
            >
              {pendingScene === scene && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {scene.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

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
          <SegmentedControl
            segments={categorySegments}
            activeSegment={activeCategory}
            onSegmentChange={setActiveCategory}
            wrap
          />

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
