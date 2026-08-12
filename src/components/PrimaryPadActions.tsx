import { Eye, Loader2, ScanLine } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScripts } from "@/hooks/useScripts";
import { type ScriptInfo } from "@/lib/api";
import { resolveQuickScripts } from "@/lib/quickScripts";
import { cn } from "@/lib/utils";

export function PrimaryPadActions() {
  const { scripts, loading, error, runningFile, run } = useScripts();
  const navigate = useNavigate();
  const showSkeleton = loading || !!error;
  const { scan, visionTest } = useMemo(
    () => resolveQuickScripts(scripts),
    [scripts],
  );

  const notAvailable = (displayName: string) => {
    toast.error(`${displayName} is not available on this device.`);
  };

  // Scan is tracked: on acceptance, go straight to the new session's page
  // (its live view is the feedback, so the "Started" toast is suppressed).
  const startScan = async (script: ScriptInfo) => {
    const accepted = await run(script, { displayName: "Scan", notify: false });
    if (accepted) navigate(`/results/${accepted.session}`);
  };

  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 px-1 sm:grid-cols-2 sm:gap-5">
      <ActionCard
        title="Scan"
        description="Full eye processing · Shift+F5"
        icon={<ScanLine className="size-8 text-muted-foreground" aria-hidden />}
        loading={showSkeleton}
        disabled={showSkeleton}
        busy={runningFile === scan?.filename}
        onActivate={() => (scan ? void startScan(scan) : notAvailable("Scan"))}
      />
      <ActionCard
        title="Vision Test"
        description="App vision workflow · F10"
        icon={<Eye className="size-8 text-muted-foreground" aria-hidden />}
        loading={showSkeleton}
        disabled={showSkeleton}
        busy={runningFile === visionTest?.filename}
        onActivate={() =>
          visionTest
            ? void run(visionTest, { displayName: "Vision Test" })
            : notAvailable("Vision Test")
        }
      />
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  loading: isLoading,
  disabled,
  busy,
  onActivate,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  loading?: boolean;
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
        {isLoading ? (
          <Skeleton className="size-14 shrink-0 rounded-xl" />
        ) : (
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
        )}
        <div className="min-w-0 flex-1 space-y-1">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-3.5 w-40 rounded" />
            </>
          ) : (
            <>
              <CardTitle className="text-xl leading-tight">{title}</CardTitle>
              <CardDescription className="text-pretty leading-snug">
                {description}
              </CardDescription>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-3 w-16 rounded" />
        ) : (
          <p className="text-xs font-medium text-muted-foreground">
            Tap to run
          </p>
        )}
      </CardContent>
    </Card>
  );
}
