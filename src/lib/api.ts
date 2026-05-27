import axios, { AxiosError } from "axios";

export type ScriptInfo = {
  filename: string;
  name: string;
  category: string;
  hotkey?: string;
};

export type DisplayScene =
  | "default"
  | "blank"
  | "active_eye"
  | "earth"
  | "slo"
  | "oct"
  | "file";

export const DISPLAY_SCENES: DisplayScene[] = [
  "default",
  "blank",
  "active_eye",
  "earth",
  "slo",
  "oct",
  "file",
];

export type PupilInfo = {
  eye: "left" | "right" | string;
  status: string;
  detected: boolean;
  in_center: boolean;
  stable: boolean;
  stable_ms: number;
  pupil: {
    size_mm: { width: number; height: number };
    position_mm: { x: number; y: number; z: number };
    area_mm2: number;
    aspect: number;
    ellipticity: number;
  };
  tracking: {
    enabled: boolean;
    box_mm?: unknown;
    box_relative?: unknown;
    outside: boolean;
  };
  ipd_mm: number;
};

export type ApiResult<T = Record<string, unknown>> = {
  success: boolean;
  error?: string;
} & T;

export type RunScriptResponse = ApiResult<{ script?: string }>;
export type WakeupResponse = ApiResult;
export type SleepResponse = ApiResult;
export type DisplaySourceResponse = ApiResult<{ scene?: DisplayScene }>;

/**
 * Normalizes axios errors into a readable message. The backend returns
 * { success: false, error: "..." } for most failures, which we surface here.
 */
export function describeError(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (err.response?.status) {
      return `HTTP ${err.response.status} ${err.response.statusText ?? ""}`.trim();
    }
    if (err.code === "ECONNABORTED") return "Request timed out";
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Creates a backend-bound API client. Call once per active backend selection;
 * each returned object owns its own axios instance so switching backends is
 * instantaneous and callers never depend on implicit global state.
 */
export function createApiClient(baseURL: string) {
  const http = axios.create({
    baseURL,
    timeout: 15_000,
    headers: { "Content-Type": "application/json" },
  });

  return {
    getScripts: (): Promise<ScriptInfo[]> =>
      http.get<ScriptInfo[]>("/api/scripts").then((r) => r.data),

    runScript: (script: string): Promise<RunScriptResponse> =>
      http.post<RunScriptResponse>("/api/run", { script }).then((r) => r.data),

    wakeup: (blocking = true): Promise<WakeupResponse> =>
      http
        .post<WakeupResponse>("/api/wakeup", { blocking })
        .then((r) => r.data),

    sleep: (): Promise<SleepResponse> =>
      http.post<SleepResponse>("/api/sleep").then((r) => r.data),

    setDisplaySource: (scene: DisplayScene): Promise<DisplaySourceResponse> =>
      http
        .post<DisplaySourceResponse>("/api/display/source", { scene })
        .then((r) => r.data),

    getPupilInfo: (): Promise<PupilInfo> =>
      http.get<PupilInfo>("/api/pupil/info").then((r) => r.data),

    /**
     * WebSocket live stream URLs for this backend.
     * Scheme follows the base URL: https → wss (WebCodecs), http → ws (JPEG).
     */
    streamUrls: (() => {
      const wsBase = baseURL.replace(/^http/, "ws");
      return {
        slo: `${wsBase}/api/stream/slo`,
        oct: `${wsBase}/api/stream/oct`,
        pupil_left: `${wsBase}/api/stream/pupil_left`,
        pupil_right: `${wsBase}/api/stream/pupil_right`,
      };
    })(),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
