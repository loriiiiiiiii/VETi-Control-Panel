import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionList } from "@/components/SessionList";
import { useSessions } from "@/hooks/useSessions";

export function ResultsView() {
  const { sessions, loading, error, refresh } = useSessions();
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  if (selectedSession !== null) {
    // Stage 3 replaces this placeholder with the frame gallery.
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedSession(null)}
          className="self-start"
        >
          <ChevronLeft />
          Sessions
        </Button>
        <div className="py-8 text-center text-base text-muted-foreground">
          Session {selectedSession} gallery coming soon.
        </div>
      </div>
    );
  }

  return (
    <SessionList
      sessions={sessions}
      loading={loading}
      error={error}
      onRefresh={refresh}
      onSelect={setSelectedSession}
    />
  );
}
