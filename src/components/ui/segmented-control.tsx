import { Tabs } from "radix-ui";
import { cn } from "@/lib/utils";

export interface Segment {
  id: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeSegment: string;
  onSegmentChange: (id: string) => void;
  /** When true, triggers wrap and size to content instead of stretching equally. */
  wrap?: boolean;
}

export function SegmentedControl({
  segments,
  activeSegment,
  onSegmentChange,
  wrap = false,
}: SegmentedControlProps) {
  return (
    <Tabs.Root
      data-slot="segmented-control"
      value={activeSegment}
      onValueChange={onSegmentChange}
    >
      <Tabs.List
        className={cn(
          "inline-flex rounded-xl bg-muted p-1",
          wrap ? "flex-wrap gap-1" : "w-full",
        )}
      >
        {segments.map(({ id, label }) => (
          <Tabs.Trigger
            key={id}
            value={id}
            className={cn(
              "touch-manipulation select-none rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !wrap && "flex-1",
            )}
          >
            {label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
