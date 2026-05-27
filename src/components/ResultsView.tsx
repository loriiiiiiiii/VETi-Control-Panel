import { ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function ResultsView() {
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
        <Button variant="outline">
          <RefreshCw />
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  );
}
