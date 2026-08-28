import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "@/lib/api";
import { cn } from "@/lib/utils";

const RANGE_FILTERS = ["All", "Today", "Last week", "Last month"] as const;

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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            aria-label="Refresh sessions"
          >
            <RefreshCw />
          </Button>
          <RangeFilter />
        </div>
      </div>

      {sessions.map((s) => (
        <SessionRow key={s.session} session={s} onSelect={onSelect} />
      ))}
    </div>
  );
}

/**
 * Date-range picker for the session list. Presentational only for now: the
 * selection is not yet wired to any filtering of the list.
 */
function RangeFilter() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] =
    useState<(typeof RANGE_FILTERS)[number]>("All");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Styled directly rather than via `asChild` + `Button`: Button is not a
          forwardRef component, so Radix could not anchor the popover to it. */}
      <PopoverTrigger
        aria-label="Filter sessions by date"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        {selected}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={6} className="w-44 gap-0 p-1.5">
        <ul role="listbox" aria-label="Date range">
          {RANGE_FILTERS.map((range) => {
            const isSelected = range === selected;
            return (
              <li key={range} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(range);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="flex-1 truncate">{range}</span>
                  {isSelected && (
                    <Check aria-hidden className="size-3.5 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
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
