import { Route, Routes, useNavigate, useParams } from "react-router";
import { SessionGallery } from "@/components/SessionGallery";
import { SessionList } from "@/components/SessionList";
import { useSessions } from "@/hooks/useSessions";

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

  return (
    <SessionList
      sessions={sessions}
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
