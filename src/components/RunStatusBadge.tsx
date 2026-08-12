import { Badge } from "@/components/ui/badge";
import type { RunStatus } from "@/lib/api";

const STATUS_STYLE: Record<RunStatus, { label: string; className: string }> = {
  queued: { label: "Queued", className: "border-border bg-muted text-muted-foreground" },
  running: { label: "Running", className: "border-ok/40 bg-ok/15 text-ok" },
  succeeded: { label: "Succeeded", className: "border-ok/40 bg-ok/15 text-ok" },
  failed: { label: "Failed", className: "border-err/40 bg-err/15 text-err" },
  cancelled: { label: "Cancelled", className: "border-warn/40 bg-warn/15 text-warn" },
  timed_out: { label: "Timed out", className: "border-err/40 bg-err/15 text-err" },
};

/** Colored outcome/lifecycle badge for a session's run status. */
export function RunStatusBadge({ status }: { status: RunStatus }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.queued;
  return (
    <Badge variant="outline" className={style.className}>
      {style.label}
    </Badge>
  );
}
