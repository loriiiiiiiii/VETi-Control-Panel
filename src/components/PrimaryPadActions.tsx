import { Eye, Loader2, ScanLine } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBackend } from "@/context/BackendContext";
import { describeError, getScripts, runScript, type ScriptInfo } from "@/lib/api";
import { resolveQuickScripts } from "@/lib/quickScripts";
import { cn } from "@/lib/utils";

export function PrimaryPadActions() {
  const { activeUrl } = useBackend();
  const [scripts, setScripts] = useState<ScriptInfo[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [runningFile, setRunningFile] = useState<string | null>(null);

  useEffect(() => {
    if (!activeUrl) return;
    setScripts([]);
    setListLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const data = await getScripts();
        if (!cancelled) setScripts(data);
      } catch {
        if (!cancelled) setScripts([]);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeUrl]);

  const { scan, visionTest } = useMemo(
    () => resolveQuickScripts(scripts),
    [scripts],
  );

  const runNamed = async (displayName: string, script: ScriptInfo | null) => {
    if (!script) {
      toast.error(`${displayName} is not available on this device.`);
      return;
    }
    setRunningFile(script.filename);
    try {
      const res = await runScript(script.name || script.filename);
      if (res.success) {
        toast.success(`Started: ${displayName}`);
      } else if (res.error === "busy") {
        toast.error(`Busy: ${displayName}`);
      } else {
        toast.error(res.error ?? `Failed: ${displayName}`);
      }
    } catch (err) {
      toast.error(`${describeError(err)}`);
    } finally {
      setRunningFile(null);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 px-1 sm:grid-cols-2 sm:gap-5">
      <ActionCard
        title="Scan"
        description="Full eye processing · Shift+F5"
        icon={<ScanLine className="size-8 text-muted-foreground" aria-hidden />}
        disabled={listLoading}
        busy={runningFile === scan?.filename}
        onActivate={() => void runNamed("Scan", scan)}
      />
      <ActionCard
        title="Vision Test"
        description="App vision workflow · F10"
        icon={<Eye className="size-8 text-muted-foreground" aria-hidden />}
        disabled={listLoading}
        busy={runningFile === visionTest?.filename}
        onActivate={() => void runNamed("Vision Test", visionTest)}
      />

      {listLoading && (
        <p className="col-span-full text-center text-sm text-muted-foreground">
          Loading actions…
        </p>
      )}
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  disabled,
  busy,
  onActivate,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  disabled: boolean;
  busy: boolean;
  onActivate: () => void;
}) {
  const run = () => {
    if (disabled || busy) return;
    onActivate();
  };

  return (
    <Card
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-busy={busy}
      aria-disabled={disabled}
      className={cn(
        "touch-manipulation transition-[transform,box-shadow,border-color,background-color]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        disabled || busy
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-primary/35 hover:bg-muted/25 active:scale-[0.99]",
      )}
      onClick={run}
      onKeyDown={(e) => {
        if (disabled || busy) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          run();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60"
          aria-hidden
        >
          {busy ? (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          ) : (
            icon
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle className="text-xl leading-tight">{title}</CardTitle>
          <CardDescription className="text-pretty leading-snug">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs font-medium text-muted-foreground">
          Tap to run
        </p>
      </CardContent>
    </Card>
  );
}
