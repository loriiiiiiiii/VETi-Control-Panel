import { useCallback, useEffect, useState } from "react";
import { useBackend } from "@/context/BackendContext";
import { describeError, type SessionSummary } from "@/lib/api";

export type UseSessionsResult = {
  sessions: SessionSummary[];
  loading: boolean;
  /** Non-null when the session list failed to load. */
  error: string | null;
  /** Re-fetch the session list for the active backend. */
  refresh: () => void;
};

/**
 * Owns the session-list fetch lifecycle for the active backend. Re-fetches on
 * backend change and on demand via `refresh`; cancels in-flight fetches when
 * the backend changes so a stale response never overwrites fresh state.
 */
export function useSessions(): UseSessionsResult {
  const { activeUrl, client } = useBackend();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
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
        const data = await client.listSessions();
        if (!cancelled) {
          setSessions(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSessions([]);
          setError(describeError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeUrl, client, reloadKey]);

  return { sessions, loading, error, refresh };
}
