import { useEffect, useRef, useState } from "react";
import { describeError, getPupilInfo, type PupilInfo } from "@/lib/api";

export type UsePupilInfoOptions = {
  /** Poll interval in milliseconds. Defaults to 500ms. */
  intervalMs?: number;
  /** Pause polling without unmounting the hook. */
  paused?: boolean;
};

export type UsePupilInfoResult = {
  data: PupilInfo | null;
  error: string | null;
  /** True until the first request settles (success OR error). */
  loading: boolean;
  /** ISO timestamp of the last successful response. */
  lastUpdated: string | null;
};

/**
 * Polls GET /api/pupil/info on a fixed interval. Skips overlapping requests so
 * a slow backend doesn't queue up a backlog. Cleans up on unmount.
 */
export function usePupilInfo(
  options: UsePupilInfoOptions = {},
): UsePupilInfoResult {
  const { intervalMs = 500, paused = false } = options;

  const [data, setData] = useState<PupilInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (paused) return;

    cancelledRef.current = false;

    const tick = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const next = await getPupilInfo();
        if (cancelledRef.current) return;
        setData(next);
        setError(null);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        if (cancelledRef.current) return;
        setError(describeError(err));
      } finally {
        inFlightRef.current = false;
        if (!cancelledRef.current) setLoading(false);
      }
    };

    void tick();
    const id = window.setInterval(tick, intervalMs);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(id);
    };
  }, [intervalMs, paused]);

  return { data, error, loading, lastUpdated };
}
