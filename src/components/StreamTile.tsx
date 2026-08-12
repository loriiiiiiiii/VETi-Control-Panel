import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WsStreamImg } from "@/components/WsStreamImg";
import { cn } from "@/lib/utils";

/**
 * A labelled live WebSocket video tile with a skeleton until the first frame
 * arrives. Shared by the Monitor tab and the session page's live run view.
 */
export function StreamTile({
  label,
  url,
  className,
}: {
  label: string;
  url: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        {!loaded && <Skeleton className="absolute inset-0 z-10 rounded-none" />}
        <WsStreamImg
          url={url}
          alt={`${label} live stream`}
          className="block aspect-video w-full"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
