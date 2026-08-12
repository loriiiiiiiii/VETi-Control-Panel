import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useBackend } from "@/context/BackendContext";
import {
  asBusyError,
  describeError,
  type RunAccepted,
  type ScriptInfo,
} from "@/lib/api";

export type RunOptions = {
  /** Overrides the toast label; falls back to `script.name` then `.filename`. */
  displayName?: string;
  /**
   * Suppress the success toast — for callers that navigate to the session
   * page on acceptance, where the page itself is the feedback. Failure
   * toasts always show.
   */
  notify?: boolean;
};

export type UseScriptsResult = {
  scripts: ScriptInfo[];
  loading: boolean;
  /** Non-null when the script list failed to load. */
  error: string | null;
  /** Filename of the script currently being launched, or null. */
  runningFile: string | null;
  /**
   * Launch a script. Resolves with the accepted launch (session number,
   * status_url) or null when the launch was rejected — rejections have
   * already been surfaced as toasts.
   */
  run: (script: ScriptInfo, opts?: RunOptions) => Promise<RunAccepted | null>;
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
    async (
      script: ScriptInfo,
      opts?: RunOptions,
    ): Promise<RunAccepted | null> => {
      const label = opts?.displayName ?? script.name ?? script.filename;
      setRunningFile(script.filename);
      try {
        const res = await client.runScript(script.name || script.filename);
        if (opts?.notify !== false) {
          toast.success(`Started: ${res.script || label}`);
        }
        return res;
      } catch (err) {
        const busy = asBusyError(err);
        if (busy) {
          const running = busy.session?.script;
          toast.error(
            running
              ? `Busy: ${running} is still running`
              : "Busy: another script is already running",
          );
        } else {
          toast.error(describeError(err));
        }
        return null;
      } finally {
        setRunningFile(null);
      }
    },
    [client],
  );

  return { scripts, loading, error, runningFile, run };
}
