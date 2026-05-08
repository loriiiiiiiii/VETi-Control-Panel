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
import { createApiClient, type ApiClient } from "@/lib/api";
import {
  vetiUrl,
  VETI_PORT,
  VETI_SERVICE_DOMAIN,
  VETI_SERVICE_TYPE,
} from "@/lib/veti";

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

export type BackendContextValue = {
  /** True if running inside the Capacitor APK (Android), false in a browser. */
  isNative: boolean;
  /** All currently known backends (discovered + active). */
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
  const [client, setClient] = useState<ApiClient>(() => createApiClient(""));
  const [scanning, setScanning] = useState(false);
  const autoSelectedRef = useRef(false);

  const setActive = useCallback((b: Backend) => {
    setActiveState(b);
    setClient(createApiClient(b.url));
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
        setClient(createApiClient(b.url));
        saveStored(b);
      }
    },
    [],
  );

  const removeBackend = useCallback((url: string) => {
    setBackends((prev) => prev.filter((b) => b.url !== url));
  }, []);

  /**
   * Android: open an mDNS watch for the VETi service. Returns a cleanup fn.
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
        const url = vetiUrl(ip, svc.port);
        const friendly = svc.name?.trim() || `VETi @ ${ip}`;
        addBackend({url, ip, label: `${friendly} [${ip}]`});
      } else if (result.action === "removed") {
        const ip = svc.ipv4Addresses?.[0];
        if (ip) removeBackend(vetiUrl(ip, svc.port));
      }
    };

    try {
      await ZeroConf.watch(
        { type: VETI_SERVICE_TYPE, domain: VETI_SERVICE_DOMAIN },
        handleResult,
      );
    } catch (err) {
      console.error("[BackendContext] ZeroConf.watch failed", err);
      setScanning(false);
      return () => {};
    }

    return () => {
      void ZeroConf.unwatch({
        type: VETI_SERVICE_TYPE,
        domain: VETI_SERVICE_DOMAIN,
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
      setClient(createApiClient(stored.url));
      autoSelectedRef.current = true;
      setBackends([stored]);
    } else if (!isNative) {
      // Web with no saved backend → default to localhost
      setActiveState(LOCALHOST_BACKEND);
      setClient(createApiClient(LOCALHOST_BACKEND.url));
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
        type: VETI_SERVICE_TYPE,
        domain: VETI_SERVICE_DOMAIN,
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
      client,
      setActive,
      scanning,
      rescan,
    }),
    [isNative, backends, active, client, setActive, scanning, rescan],
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
