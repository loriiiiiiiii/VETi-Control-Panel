import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { usePupilInfo } from "@/hooks/usePupilInfo";
import type { PupilInfo } from "@/lib/api";
import { cn } from "@/lib/cn";

const POLL_INTERVAL_MS = 500;

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
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums text-slate-100">
        {value}
        {hint && (
          <span className="ml-1 text-xs font-normal text-slate-400">
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
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
        on
          ? "border-ok/40 bg-ok/10 text-ok"
          : "border-border bg-bg-subtle text-slate-400",
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          on ? "bg-ok" : "bg-slate-500",
        )}
      />
      {label}
    </span>
  );
}

export function PupilMonitor() {
  const [paused, setPaused] = useState(false);
  const { data, error, loading, lastUpdated } = usePupilInfo({
    intervalMs: POLL_INTERVAL_MS,
    paused,
  });

  return (
    <Card
      title="Pupil monitor"
      description={
        paused
          ? "Polling paused"
          : `Polling every ${POLL_INTERVAL_MS} ms`
      }
      actions={
        <Button
          size="sm"
          variant={paused ? "primary" : "ghost"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "Resume" : "Pause"}
        </Button>
      }
    >
      {loading && !data && (
        <div className="py-6 text-sm text-slate-400">
          Waiting for pupil data…
        </div>
      )}

      {!loading && !data && error && (
        <div className="rounded-md border border-err/40 bg-err/10 px-3 py-2 text-sm text-err">
          {error}
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-slate-300">
              Active eye:{" "}
              <span className="font-semibold capitalize text-slate-100">
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

          <div className="rounded-lg border border-border bg-bg/50 px-4 py-2">
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

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {error ? (
                <span className="text-err">Last error: {error}</span>
              ) : (
                "Live"
              )}
            </span>
            <span>
              {lastUpdated
                ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
                : ""}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
