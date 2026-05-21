import { Tabs } from "radix-ui";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabBarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const TabBarRoot = Tabs.Root;

function TabBarList({
  items,
  className,
}: {
  items: TabBarItem[];
  className?: string;
}) {
  return (
    <Tabs.List
      data-slot="tab-bar"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30 flex justify-center",
        "px-4 pb-[max(0.5rem,var(--inset-bottom))]",
        className,
      )}
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "flex w-full max-w-sm items-stretch gap-1 rounded-2xl",
          "border border-border/60 bg-card/80 p-1.5 shadow-lg backdrop-blur-xl",
        )}
      >
        {items.map(({ id, label, icon: Icon }) => (
          <Tabs.Trigger
            key={id}
            value={id}
            className={cn(
              "touch-manipulation flex min-h-11 flex-1 select-none flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span>{label}</span>
          </Tabs.Trigger>
        ))}
      </div>
    </Tabs.List>
  );
}

const TabBarContent = Tabs.Content;

export { TabBarRoot, TabBarList, TabBarContent };
