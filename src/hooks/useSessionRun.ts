import { useEffect, useState } from "react";
import { useBackend } from "@/context/BackendContext";
import { isNotFoundError, type SessionDetail } from "@/lib/api";

const POLL_INTERVAL_MS = 1_000;

/** Consecutive poll failures before the device is reported unreachable. */
const UNREACHABLE_AFTER = 3;

export type UseSessionRunResult = {
  /** Latest run record, or null until the first fetch resolves. */
  run: SessionDetail | null;
  /** True when the device does not know this session number (HTTP 404). */
  notFound: boolean;
  /** True after several consecutive failed polls; polling continues. */
  unreachable: boolean;
};

/**
 * Owns the run-record fetch lifecycle for one session page. Polls every
 * second while the run is `current` and stops permanently once it reaches a
 * terminal status (or 404s). Transient failures keep the poll alive — a
 * device busy acquiring frames may drop a request without the run being over.
 * Polls are chained (next scheduled after the previous settles) so slow
 * responses never overlap.
 */
export function useSessionRun(session: number): UseSessionRunResult {
  const { activeUrl, client } = useBackend();
  const [run, setRun] = useState<SessionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failures, setFailures] = useState(0);

  useEffect(() => {
    if (!activeUrl) return;
    setRun(null);
    setNotFound(false);
    setFailures(0);

    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const data = await client.getSession(session);
        if (cancelled) return;
        setRun(data);
        setFailures(0);
        if (data.current) timer = window.setTimeout(tick, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        if (isNotFoundError(err)) {
          setNotFound(true);
          return;
        }
        setFailures((f) => f + 1);
        timer = window.setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [activeUrl, client, session]);

  return { run, notFound, unreachable: failures >= UNREACHABLE_AFTER };
}
