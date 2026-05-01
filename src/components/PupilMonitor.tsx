import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBackend } from "@/context/BackendContext";
import {
  describeError,
  getPupilInfo,
  getPupilMjpegUrl,
  type PupilInfo,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type PupilMonitorProps = {
  embedded?: boolean;
};

function formatNumber(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(fractionDigits);
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = Math.round(seconds % 60);
  return `${minutes}m ${remSec}s`;
}

function StatusBadge({ data }: { data: PupilInfo }) {
  const tone = data.detected
    ? data.stable
      ? "bg-ok/15 text-ok border-ok/40"
      : "bg-warn/15 text-warn border-warn/40"
    : "bg-err/15 text-err border-err/40";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {data.status}
    </span>
  );
}

function MetricRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2.5 text-base last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-medium tabular-nums text-foreground">
        {value}
        {hint && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}

function Flag({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-sm font-medium",
        on
          ? "border-ok/40 bg-ok/10 text-ok"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "mr-2 h-2 w-2 shrink-0 rounded-full",
          on ? "bg-ok" : "bg-muted-foreground",
        )}
      />
      {label}
    </span>
  );
}

export function PupilMonitor({ embedded = false }: PupilMonitorProps) {
  const { activeUrl } = useBackend();
  const streamSrc = getPupilMjpegUrl(activeUrl);
  const [imgKey, setImgKey] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [data, setData] = useState<PupilInfo | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refreshMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const next = await getPupilInfo();
      setData(next);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setMetricsError(describeError(err));
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Re-fetch metrics and reconnect stream when the active backend changes
  useEffect(() => {
    if (!activeUrl) return;
    setData(null);
    setMetricsError(null);
    setStreamError(null);
    setImgKey((k) => k + 1);
    void refreshMetrics();
  }, [activeUrl, refreshMetrics]);

  const reconnectStream = useCallback(() => {
    setStreamError(null);
    setImgKey((k) => k + 1);
  }, []);

  const actionRow = (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        size="lg"
        variant="secondary"
        disabled={metricsLoading}
        onClick={() => void refreshMetrics()}
        className="min-h-12 flex-1 sm:flex-none"
      >
        {metricsLoading && (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        )}
        Refresh metrics
      </Button>
      <Button
        size="lg"
        variant="secondary"
        onClick={reconnectStream}
        className="min-h-12 flex-1 sm:flex-none"
      >
        Reconnect stream
      </Button>
    </div>
  );

  const streamBlock = (
    <div className="min-w-0 flex-1">
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        <img
          key={imgKey}
          src={streamSrc}
          alt="Pupil camera"
          className="mx-auto block max-h-[min(50dvh,480px)] w-full object-contain"
          onLoad={() => setStreamError(null)}
          onError={() =>
            setStreamError(
              "Stream failed to load. Check the backend and try Reconnect.",
            )
          }
        />
      </div>
      {streamError && (
        <div className="mt-3 rounded-xl border border-err/40 bg-err/10 px-4 py-3 text-base text-err">
          {streamError}
        </div>
      )}
      {!embedded && (
        <p className="mt-2 text-xs text-muted-foreground">
          Source:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {streamSrc}
          </code>
        </p>
      )}
    </div>
  );

  const metricsBlock = (
    <div className="w-full shrink-0 lg:w-[min(100%,380px)]">
      {metricsLoading && !data && (
        <div className="py-3 text-base text-muted-foreground">
          Loading metrics…
        </div>
      )}

      {!metricsLoading && !data && !metricsError && (
        <div className="py-3 text-base text-muted-foreground">
          No metrics yet. Tap Refresh metrics.
        </div>
      )}

      {metricsError && (
        <div className="mb-3 rounded-xl border border-err/40 bg-err/10 px-4 py-3 text-base text-err">
          {metricsError}
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-base text-muted-foreground">
              Active eye:{" "}
              <span className="font-semibold capitalize text-foreground">
                {data.eye}
              </span>
            </div>
            <StatusBadge data={data} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Flag label="Detected" on={data.detected} />
            <Flag label="Centered" on={data.in_center} />
            <Flag label="Stable" on={data.stable} />
            <Flag label="Tracking" on={data.tracking?.enabled ?? false} />
            <Flag label="In box" on={!(data.tracking?.outside ?? false)} />
          </div>

          <div className="rounded-xl border border-border bg-muted/40 px-4 py-2">
            <MetricRow
              label="Stable for"
              value={formatDuration(data.stable_ms)}
            />
            <MetricRow
              label="IPD"
              value={formatNumber(data.ipd_mm, 1)}
              hint="mm"
            />
            <MetricRow
              label="Size (W × H)"
              value={`${formatNumber(data.pupil.size_mm.width)} × ${formatNumber(data.pupil.size_mm.height)}`}
              hint="mm"
            />
            <MetricRow
              label="Area"
              value={formatNumber(data.pupil.area_mm2)}
              hint="mm²"
            />
            <MetricRow
              label="Aspect"
              value={formatNumber(data.pupil.aspect, 3)}
            />
            <MetricRow
              label="Ellipticity"
              value={formatNumber(data.pupil.ellipticity, 3)}
            />
            <MetricRow
              label="Position (x, y, z)"
              value={`${formatNumber(data.pupil.position_mm.x)}, ${formatNumber(data.pupil.position_mm.y)}, ${formatNumber(data.pupil.position_mm.z)}`}
              hint="mm"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            {lastUpdated
              ? `Metrics at ${new Date(lastUpdated).toLocaleTimeString()}`
              : ""}
          </div>
        </div>
      )}
    </div>
  );

  const streamAndMetrics = (
    <div className="flex flex-col gap-4 lg:flex-row">
      {streamBlock}
      {metricsBlock}
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-4">
        {actionRow}
        {streamAndMetrics}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="min-w-0">
          <CardTitle>Pupil monitor</CardTitle>
          <CardDescription>
            Live MJPEG camera stream (no polling)
          </CardDescription>
        </div>
        <CardAction className="w-full pt-2 sm:w-auto sm:pt-0">
          {actionRow}
        </CardAction>
      </CardHeader>
      <CardContent className="pt-6">{streamAndMetrics}</CardContent>
    </Card>
  );
}
