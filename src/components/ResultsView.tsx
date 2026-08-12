import { useMemo } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router";
import { SessionGallery } from "@/components/SessionGallery";
import { SessionList } from "@/components/SessionList";
import { useSessions } from "@/hooks/useSessions";
import { hasFrames } from "@/lib/api";

export function ResultsView() {
  return (
    <Routes>
      <Route index element={<SessionListPage />} />
      <Route path=":session" element={<SessionDetailPage />} />
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

function SessionDetailPage() {
  const { session } = useParams<{ session: string }>();
  const sessionNum = Number(session);

  return <SessionGallery session={sessionNum} />;
}
