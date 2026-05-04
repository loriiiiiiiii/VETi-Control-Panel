import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useBackend } from "@/context/BackendContext";
import { describeError, type ScriptInfo } from "@/lib/api";

export type UseScriptsResult = {
  scripts: ScriptInfo[];
  loading: boolean;
  /** Non-null when the script list failed to load. */
  error: string | null;
  /** Filename of the script currently running, or null. */
  runningFile: string | null;
  /**
   * Run a script. `displayName` overrides the toast label; falls back to
   * `script.name` then `script.filename`.
   */
  run: (script: ScriptInfo, displayName?: string) => Promise<void>;
};

/**
 * Owns the full script fetch + run lifecycle for the active backend.
 * Cancels in-flight fetches when the backend changes and prevents concurrent runs.
 */
export function useScripts(): UseScriptsResult {
  const { activeUrl, client } = useBackend();
  const [scripts, setScripts] = useState<ScriptInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningFile, setRunningFile] = useState<string | null>(null);

  useEffect(() => {
    if (!activeUrl) return;
    setScripts([]);
    setLoading(true);
    setError(null);
    let cancelled = false;
    (async () => {
      try {
        const data = await client.getScripts();
        if (!cancelled) {
          setScripts(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeUrl, client]);

  const run = useCallback(
    async (script: ScriptInfo, displayName?: string): Promise<void> => {
      const label = displayName ?? script.name ?? script.filename;
      setRunningFile(script.filename);
      try {
        const res = await client.runScript(script.name || script.filename);
        if (res.success) {
          toast.success(`Started: ${res.script ?? label}`);
        } else if (res.error === "busy") {
          toast.error(`Busy: ${label}`);
        } else {
          toast.error(res.error ?? `Failed: ${label}`);
        }
      } catch (err) {
        toast.error(describeError(err));
      } finally {
        setRunningFile(null);
      }
    },
    [client],
  );

  return { scripts, loading, error, runningFile, run };
}
