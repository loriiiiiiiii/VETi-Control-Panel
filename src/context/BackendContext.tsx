import { Capacitor } from "@capacitor/core";
import {
  ZeroConf,
  type ZeroConfWatchResult,
} from "capacitor-zeroconf";
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
import { http } from "@/lib/api";

const STORAGE_KEY = "interaction-board:active-backend";

const SERVICE_TYPE = "_veti._tcp.";
const SERVICE_DOMAIN = "local.";

const LOCALHOST_BACKEND: Backend = {
  url: "http://localhost:8888",
  ip: "localhost",
  label: "localhost:8888",
};

export type Backend = {
  /** Full base URL, e.g. "http://172.16.9.152:8888" */
  url: string;
  /** Bare host or IP, e.g. "172.16.9.152" */
  ip: string;
  /** Human-readable label shown in the selector (mDNS service name on Android) */
  label: string;
};

export type BackendContextValue = {
  /** True if running inside the Capacitor APK (Android), false in a browser. */
  isNative: boolean;
  /** All currently known backends (discovered + active). */
  backends: Backend[];
  /** Currently selected backend, or null while we wait for one. */
  active: Backend | null;
  /** Convenience shorthand: active?.url ?? '' */
  activeUrl: string;
  /** Switch to a different backend. Updates the shared axios instance + storage. */
  setActive: (b: Backend) => void;
  /** True while actively listening for backends (Android only). */
  scanning: boolean;
  /** Restart mDNS discovery (Android) or reset to localhost (web). */
  rescan: () => void;
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

  const [backends, setBackends] = useState<Backend[]>([]);
  const [active, setActiveState] = useState<Backend | null>(null);
  const [scanning, setScanning] = useState(false);
  const autoSelectedRef = useRef(false);

  const setActive = useCallback((b: Backend) => {
    setActiveState(b);
    http.defaults.baseURL = b.url;
    saveStored(b);
    autoSelectedRef.current = true;
    // Make sure the chosen backend is in the list (e.g. manual IP)
    setBackends((prev) =>
      prev.some((x) => x.url === b.url) ? prev : [...prev, b],
    );
  }, []);

  /** Add a backend to the list and auto-select it if nothing is active yet. */
  const addBackend = useCallback(
    (b: Backend) => {
      setBackends((prev) => {
        if (prev.some((x) => x.url === b.url)) return prev;
        return [...prev, b];
      });
      if (!autoSelectedRef.current) {
        autoSelectedRef.current = true;
        setActiveState(b);
        http.defaults.baseURL = b.url;
        saveStored(b);
      }
    },
    [],
  );

  const removeBackend = useCallback((url: string) => {
    setBackends((prev) => prev.filter((b) => b.url !== url));
  }, []);

  /**
   * Android: open an mDNS watch for _veti._tcp.local. Returns a cleanup fn.
   * Web: no-op. Returns a cleanup fn.
   */
  const startDiscovery = useCallback(async (): Promise<() => void> => {
    if (!isNative) return () => {};

    setScanning(true);

    const handleResult = (result: ZeroConfWatchResult) => {
      const svc = result.service;
      // 'resolved' is the only action that includes valid IP addresses.
      // 'added' fires before resolution and may have empty ipv4Addresses.
      if (result.action === "resolved") {
        const ip = svc.ipv4Addresses?.[0];
        if (!ip) return;
        const url = `http://${ip}:${svc.port}`;
        const friendly = svc.name?.trim() || `VETi @ ${ip}`;
        addBackend({
          url,
          ip,
          label: `${friendly} (${ip}:${svc.port})`,
        });
      } else if (result.action === "removed") {
        const ip = svc.ipv4Addresses?.[0];
        if (ip) removeBackend(`http://${ip}:${svc.port}`);
      }
    };

    try {
      await ZeroConf.watch(
        { type: SERVICE_TYPE, domain: SERVICE_DOMAIN },
        handleResult,
      );
    } catch (err) {
      console.error("[BackendContext] ZeroConf.watch failed", err);
      setScanning(false);
      return () => {};
    }

    return () => {
      void ZeroConf.unwatch({
        type: SERVICE_TYPE,
        domain: SERVICE_DOMAIN,
      }).catch(() => {
        /* ignore — plugin may already be torn down */
      });
      setScanning(false);
    };
  }, [isNative, addBackend, removeBackend]);

  // Mount: restore stored backend immediately, then start discovery.
  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setActiveState(stored);
      http.defaults.baseURL = stored.url;
      autoSelectedRef.current = true;
      setBackends([stored]);
    } else if (!isNative) {
      // Web with no saved backend → default to localhost
      setActiveState(LOCALHOST_BACKEND);
      http.defaults.baseURL = LOCALHOST_BACKEND.url;
      autoSelectedRef.current = true;
      setBackends([LOCALHOST_BACKEND]);
    }

    let stop: (() => void) | null = null;
    let cancelled = false;
    void startDiscovery().then((cleanup) => {
      if (cancelled) {
        cleanup();
      } else {
        stop = cleanup;
      }
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [isNative, startDiscovery]);

  const rescan = useCallback(() => {
    if (isNative) {
      // Restart the watcher: unwatch then watch again
      void ZeroConf.unwatch({
        type: SERVICE_TYPE,
        domain: SERVICE_DOMAIN,
      }).catch(() => {
        /* ignore */
      });
      autoSelectedRef.current = active !== null;
      // Clear non-active discovered entries so the list reflects fresh state
      setBackends(active ? [active] : []);
      void startDiscovery();
    } else {
      // Web: reset to localhost
      setActive(LOCALHOST_BACKEND);
      setBackends([LOCALHOST_BACKEND]);
    }
  }, [isNative, active, setActive, startDiscovery]);

  const value = useMemo<BackendContextValue>(
    () => ({
      isNative,
      backends,
      active,
      activeUrl: active?.url ?? "",
      setActive,
      scanning,
      rescan,
    }),
    [isNative, backends, active, setActive, scanning, rescan],
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
