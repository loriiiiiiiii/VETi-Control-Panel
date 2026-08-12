import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { StreamTile } from "@/components/StreamTile";
import {
  SegmentedControl,
  type Segment,
} from "@/components/ui/segmented-control";
import { useBackend } from "@/context/BackendContext";
import { describeError, type PupilInfo } from "@/lib/api";
import { cn } from "@/lib/utils";

const SEGMENTS: Segment[] = [
  { id: "imaging", label: "Imaging" },
  { id: "pupil", label: "Pupil" },
];

const POLL_INTERVAL_MS = 3_000;

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
      ? "border-ok/40 bg-ok/15 text-ok"
      : "border-warn/40 bg-warn/15 text-warn"
    : "border-err/40 bg-err/15 text-err";

  return (
    <Badge variant="outline" className={tone}>
      {data.status}
    </Badge>
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

function ImagingPanel() {
  const { client } = useBackend();

  return (
    <div className="flex flex-col gap-4 landscape:flex-row">
      <StreamTile
        label="SLO"
        url={client.streamUrls.slo}
        className="landscape:flex-1"
      />
      <StreamTile
        label="OCT"
        url={client.streamUrls.oct}
        className="landscape:flex-1"
      />
    </div>
  );
}

function PupilPanel() {
  const { activeUrl, client } = useBackend();

  const [data, setData] = useState<PupilInfo | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refreshMetrics = useCallback(async () => {
    try {
      const next = await client.getPupilInfo();
      setData(next);
      setLastUpdated(new Date().toISOString());
      setMetricsError(null);
    } catch (err) {
      setMetricsError(describeError(err));
    }
  }, [client]);

  useEffect(() => {
    if (!activeUrl) return;
    setData(null);
    setMetricsError(null);
    void refreshMetrics();
  }, [activeUrl, refreshMetrics]);

  useEffect(() => {
    const id = setInterval(() => void refreshMetrics(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshMetrics]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-4">
        <StreamTile
          label="Pupil left"
          url={client.streamUrls.pupil_left}
          className="flex-1"
        />
        <StreamTile
          label="Pupil right"
          url={client.streamUrls.pupil_right}
          className="flex-1"
        />
      </div>

      {metricsError && (
        <div className="rounded-xl border border-err/40 bg-err/10 px-4 py-3 text-base text-err">
          {metricsError}
        </div>
      )}

      {!data && !metricsError && (
        <div className="py-3 text-base text-muted-foreground">
          Loading metrics…
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
}

export function MonitorView() {
  const [segment, setSegment] = useState("imaging");

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        segments={SEGMENTS}
        activeSegment={segment}
        onSegmentChange={setSegment}
      />

      {segment === "imaging" && <ImagingPanel />}
      {segment === "pupil" && <PupilPanel />}
    </div>
  );
}
