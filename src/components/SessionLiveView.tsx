import { useNavigate } from "react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { StreamTile } from "@/components/StreamTile";
import { useBackend } from "@/context/BackendContext";
import type { Session } from "@/lib/api";

function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type SessionLiveViewProps = {
  /** The current (queued/running) run this page is tracking. */
  run: Session;
  /** True when recent status polls have failed; shows a warning banner. */
  unreachable: boolean;
};

/**
 * Live run state of the session page: shown while the session is `current`.
 * The 1-second status poll drives the elapsed time; the pupil streams let the
 * operator watch the acquisition as it happens.
 */
export function SessionLiveView({ run, unreachable }: SessionLiveViewProps) {
  const navigate = useNavigate();
  const { client } = useBackend();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ChevronLeft />
          Sessions
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-foreground">
            Session {run.session}
          </span>
          <RunStatusBadge status={run.status} />
        </div>
        {/* Spacer balancing the back button so the title stays centered. */}
        <div className="w-24 shrink-0" aria-hidden />
      </div>

      <Card size="sm">
        <CardContent className="flex items-center gap-4">
          <Loader2
            className="size-8 shrink-0 animate-spin text-muted-foreground"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-base font-medium text-foreground">
              {run.script}
            </span>
            <span className="text-sm text-muted-foreground">
              {run.status === "queued" ? "Waiting to start" : "Scan in progress"}
              {" · "}
              <span className="tabular-nums">
                {formatElapsed(run.duration_ms)}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {unreachable && (
        <div className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-base text-warn">
          Can't reach the device — retrying…
        </div>
      )}

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
    </div>
  );
}
