import { useEffect, useMemo, useRef } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { SessionGallery } from "@/components/SessionGallery";
import { SessionList } from "@/components/SessionList";
import { SessionLiveView } from "@/components/SessionLiveView";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionRun } from "@/hooks/useSessionRun";
import { useSessions } from "@/hooks/useSessions";
import { hasFrames } from "@/lib/api";

export function ResultsView() {
  return (
    <Routes>
      <Route index element={<SessionListPage />} />
      <Route path=":session" element={<SessionPage />} />
    </Routes>
  );
}

function SessionListPage() {
  const { sessions, loading, error, refresh } = useSessions();
  const navigate = useNavigate();

  // Results browse imagery, so runs that produced no frames — or whose frames
  // the device has already evicted — have nothing to show here. The current
  // run is the exception: it stays listed while its first frames arrive.
  const visible = useMemo(
    () => sessions.filter((s) => s.current || hasFrames(s)),
    [sessions],
  );

  return (
    <SessionList
      sessions={visible}
      loading={loading}
      error={error}
      onRefresh={refresh}
      onSelect={(session) => navigate(String(session))}
    />
  );
}

/**
 * The session page: renders one session across its whole lifecycle. While the
 * run is current it shows the live view (spinner + pupil streams) driven by a
 * 1-second status poll; once the run reaches a terminal status it swaps, in
 * place, to the frame gallery with the run's outcome.
 */
function SessionPage() {
  const { session } = useParams<{ session: string }>();
  const sessionNum = Number(session);
  const navigate = useNavigate();

  const { run, notFound, unreachable } = useSessionRun(sessionNum);

  // Device doesn't know this session (e.g. it restarted): the device state
  // changed under us, so say so and return to a fresh session list.
  useEffect(() => {
    if (!notFound) return;
    toast.error(`Session ${sessionNum} no longer exists on the device.`);
    navigate("/results", { replace: true });
  }, [notFound, sessionNum, navigate]);

  // Announce the live-to-terminal transition we observed on this page. Runs
  // that were already finished when the page opened stay silent, and failures
  // speak through the gallery's error banner instead of a toast.
  const wasCurrent = useRef(false);
  useEffect(() => {
    if (!run) return;
    if (wasCurrent.current && !run.current && run.status === "succeeded") {
      toast.success(`${run.script} finished`);
    }
    wasCurrent.current = run.current;
  }, [run]);

  if (notFound) return null;

  if (!run) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full max-w-xs rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (run.current) {
    return <SessionLiveView run={run} unreachable={unreachable} />;
  }

  return <SessionGallery session={sessionNum} run={run} />;
}
