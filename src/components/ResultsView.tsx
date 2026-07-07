import { Route, Routes, useNavigate, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/** Placeholder for the Results plan Stage 3 (SessionGallery). */
function SessionDetailPage() {
  const { session } = useParams<{ session: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="self-start"
      >
        <ChevronLeft />
        Sessions
      </Button>
      <div className="py-8 text-center text-base text-muted-foreground">
        Session {session} gallery coming soon.
      </div>
    </div>
  );
}
