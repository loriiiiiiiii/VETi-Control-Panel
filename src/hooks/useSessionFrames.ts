import { useCallback, useEffect, useState } from "react";
import { useBackend } from "@/context/BackendContext";
import { describeError, type Frame, type Modality } from "@/lib/api";

export type UseSessionFramesResult = {
  frames: Frame[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * Fetches RESULT frames for a given session, with an optional modality filter.
 * Re-fetches when session, modality, or active backend changes.
 */
export function useSessionFrames(
  session: number,
  modality?: Modality,
): UseSessionFramesResult {
  const { activeUrl, client } = useBackend();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!activeUrl) return;
    setLoading(true);
    setError(null);
    let cancelled = false;
    (async () => {
      try {
        const data = await client.listSessionFrames(
          session,
          modality ? { modality } : undefined,
        );
        if (!cancelled) {
          setFrames(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setFrames([]);
          setError(describeError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeUrl, client, session, modality, reloadKey]);

  return { frames, loading, error, refresh };
}
