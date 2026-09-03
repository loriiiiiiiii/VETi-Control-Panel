import { Capacitor } from "@capacitor/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createApiClient, type ApiClient } from "@/lib/api";
import { discovery, type DiscoveredInstance } from "@/lib/discovery";
import { vetiUrl, VETI_PORT } from "@/lib/veti";

const STORAGE_KEY = "interaction-board:active-backend";

const LOCALHOST_BACKEND: Backend = {
  url: vetiUrl("localhost"),
  ip: "localhost",
  label: `localhost:${VETI_PORT}`,
};

export type Backend = {
  /** Full base URL, e.g. "http://172.16.9.152:8888" */
  url: string;
  /** Bare host or IP, e.g. "172.16.9.152" */
  ip: string;
  /** Human-readable label shown in the selector (mDNS service name on Android) */
  label: string;
};

/** Two-state presence model for a backend entry. */
export type Presence = "confirmed" | "unknown";

export type BackendContextValue = {
  /** True if running inside the Capacitor APK (Android), false in a browser. */
  isNative: boolean;
  /** All currently known backends (discovered + selected). */
  backends: Backend[];
  /** Currently selected backend, or null while we wait for one. */
  active: Backend | null;
  /** Convenience shorthand: active?.url ?? '' */
  activeUrl: string;
  /**
   * API client bound to the active backend. Use this for all API calls instead
   * of importing shared axios instances — keeps backend dependency explicit.
   */
  client: ApiClient;
  /** Switch to a different backend. Updates the bound API client + storage. */
  setActive: (b: Backend) => void;
  /** True while a scan (startup or poll) is in progress. */
  scanning: boolean;
  /** Last scan error, or null. Cleared when a scan starts or succeeds. */
  scanError: string | null;
  /** Start continuous polling (dropdown open). */
  startScan: () => void;
  /** Stop continuous polling (dropdown closed). */
  stopScan: () => void;
  /** Presence state for a backend: "confirmed" if in the latest scan, else "unknown". */
  presence: (b: Backend) => Presence;
};

const BackendContext = createContext<BackendContextValue | null>(null);

function loadStored(): Backend | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Backend;
  } catch {
    return null;
  }
}

function saveStored(backend: Backend): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backend));
  } catch {
    /* storage unavailable */
  }
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const isNative = Capacitor.isNativePlatform();

  // --- Core state ---

  /** The selected (active) backend. Persisted to localStorage. */
  const [active, setActiveState] = useState<Backend | null>(null);
  /** API client bound to the active backend. */
  const [client, setClient] = useState<ApiClient>(() => createApiClient(""));
  /**
   * The latest completed discovery scan results, or null if no scan has
   * completed yet this session.
   */
  const [discovered, setDiscovered] = useState<Backend[] | null>(null);
  /** True while any scan (startup or poll) is in flight. */
  const [scanning, setScanning] = useState(false);
  /** Last scan error message, or null. */
  const [scanError, setScanError] = useState<string | null>(null);

  // Refs for stable callbacks that don't re-create on every state change.
  const activeRef = useRef<Backend | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const autoSelectedRef = useRef(false);

  // --- Derived state ---

  /**
   * Set of discovered URLs for O(1) presence lookups. Null means "no scan
   * completed yet" — everything is unknown.
   */
  const discoveredUrls = useMemo(
    () => (discovered ? new Set(discovered.map((b) => b.url)) : null),
    [discovered],
  );

  /**
   * The full backend list shown in the dropdown:
   * latest discovered set ∪ {selected instance} (if not already in set).
   */
  const backends = useMemo(() => {
    const base = discovered ?? [];
    const a = activeRef.current;
    if (a && !base.some((b) => b.url === a.url)) {
      return [a, ...base];
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discovered, active]);

  /** Presence derivation: green (confirmed) or grey (unknown). */
  const presence = useCallback(
    (b: Backend): Presence => {
      if (!discoveredUrls) return "unknown";
      return discoveredUrls.has(b.url) ? "confirmed" : "unknown";
    },
    [discoveredUrls],
  );

  // --- Selection ---

  const setActive = useCallback((b: Backend) => {
    setActiveState(b);
    setClient(createApiClient(b.url));
    saveStored(b);
    autoSelectedRef.current = true;
  }, []);

  // --- Scanning ---

  /** Generation counter to discard stale scan results. */
  const scanGenRef = useRef(0);
  /** Whether the poll loop should keep running. */
  const pollingRef = useRef(false);

  /**
   * Apply the result of a single scanOnce() call: replace the discovered set,
   * and auto-select the first instance if nothing is active yet.
   */
  const applyScanResult = useCallback(
    (instances: DiscoveredInstance[]) => {
      const backends: Backend[] = instances.map((i) => ({
        url: i.url,
        ip: i.ip,
        label: i.label,
      }));
      setDiscovered(backends);

      if (!autoSelectedRef.current && backends.length > 0) {
        autoSelectedRef.current = true;
        const first = backends[0];
        setActiveState(first);
        setClient(createApiClient(first.url));
        saveStored(first);
      }
    },
    [],
  );

  /**
   * Run one scan and apply the result. Returns silently on error (sets
   * scanError state). Used by both startup and the poll loop.
   */
  const runOneScan = useCallback(
    async (gen: number): Promise<boolean> => {
      try {
        const instances = await discovery.scanOnce();
        if (scanGenRef.current !== gen) return false;
        applyScanResult(instances);
        setScanError(null);
        return true;
      } catch (err) {
        if (scanGenRef.current !== gen) return false;
        console.error("[BackendContext] scanOnce failed", err);
        setScanError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [applyScanResult],
  );

  /** Start continuous polling (called when dropdown opens). */
  const startScan = useCallback(() => {
    if (!discovery.supported || pollingRef.current) return;
    pollingRef.current = true;
    setScanning(true);
    setScanError(null);

    const gen = ++scanGenRef.current;
    const loop = async () => {
      while (pollingRef.current && scanGenRef.current === gen) {
        const ok = await runOneScan(gen);
        if (!pollingRef.current || scanGenRef.current !== gen) return;
        // On failure, pause before retrying to avoid tight error loops.
        if (!ok) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    };
    void loop();
  }, [runOneScan]);

  /** Stop continuous polling (called when dropdown closes). */
  const stopScan = useCallback(() => {
    if (!pollingRef.current) return;
    pollingRef.current = false;
    setScanning(false);
  }, []);

  // --- Mount: restore persisted backend + startup scan ---

  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setActiveState(stored);
      setClient(createApiClient(stored.url));
      autoSelectedRef.current = true;
    } else if (!isNative) {
      setActiveState(LOCALHOST_BACKEND);
      setClient(createApiClient(LOCALHOST_BACKEND.url));
      autoSelectedRef.current = true;
    }

    // Fire a single startup scan (Android only).
    if (discovery.supported) {
      setScanning(true);
      const gen = ++scanGenRef.current;
      void runOneScan(gen).then(() => {
        // Only clear scanning if the poll loop hasn't started since.
        if (scanGenRef.current === gen) {
          setScanning(false);
        }
      });
    }

    return () => {
      // Teardown: stop any active polling.
      pollingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Context value ---

  const value = useMemo<BackendContextValue>(
    () => ({
      isNative,
      backends,
      active,
      activeUrl: active?.url ?? "",
      client,
      setActive,
      scanning,
      scanError,
      startScan,
      stopScan,
      presence,
    }),
    [
      isNative,
      backends,
      active,
      client,
      setActive,
      scanning,
      scanError,
      startScan,
      stopScan,
      presence,
    ],
  );

  return (
    <BackendContext.Provider value={value}>{children}</BackendContext.Provider>
  );
}

export function useBackend(): BackendContextValue {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error("useBackend must be used inside <BackendProvider>");
  return ctx;
}
