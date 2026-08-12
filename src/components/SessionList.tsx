import { ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "@/lib/api";

type SessionListProps = {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelect: (session: number) => void;
};

/**
 * Presentational session browser: renders loading, error, empty, and populated
 * states. Drill-down and data fetching are owned by the parent.
 */
export function SessionList({
  sessions,
  loading,
  error,
  onRefresh,
  onSelect,
}: SessionListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-err/40 bg-err/10 px-4 py-3 text-base text-err">
          Failed to load sessions: {error}
        </div>
        <Button variant="outline" onClick={onRefresh} className="self-start">
          <RefreshCw />
          Retry
        </Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>No results yet</EmptyTitle>
          <EmptyDescription className="max-w-xs text-pretty">
            Run a scan or vision test to see results here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw />
            Refresh
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          aria-label="Refresh sessions"
        >
          <RefreshCw />
        </Button>
      </div>

      {sessions.map((s) => (
        <SessionRow key={s.session} session={s} onSelect={onSelect} />
      ))}
    </div>
  );
}

function SessionRow({
  session,
  onSelect,
}: {
  session: Session;
  onSelect: (session: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(session.session)}
      className="touch-manipulation w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        size="sm"
        className="transition-colors hover:bg-muted/40 active:bg-muted/60"
      >
        <CardContent className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-medium text-foreground">
                Session {session.session}
              </span>
              {session.current && (
                <Badge className="border-ok/40 bg-ok/15 text-ok" variant="outline">
                  Current
                </Badge>
              )}
              {session.sides.map((side) => (
                <Badge key={side} variant="outline">
                  {side}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {session.subsession_count} subsession
                {session.subsession_count === 1 ? "" : "s"}
              </span>
              <span aria-hidden>·</span>
              <Badge variant="secondary">SLO {session.frame_counts.slo}</Badge>
              <Badge variant="secondary">OCT {session.frame_counts.oct}</Badge>
            </div>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </CardContent>
      </Card>
    </button>
  );
}
