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

export type Side = "OD" | "OS" | "OU";
export type Modality = "slo" | "oct";

export type FrameCounts = {
  slo: number;
  oct: number;
};

export type SessionSummary = {
  session: number;
  current: boolean;
  subsession_count: number;
  sides: Side[];
  frame_counts: FrameCounts;
};

export type SubsessionInfo = {
  sub_session: number;
  side: Side;
  frame_counts: FrameCounts;
};

export type SessionDetail = {
  session: number;
  current: boolean;
  subsessions: SubsessionInfo[];
};

export type Frame = {
  id: number;
  session: number;
  sub_session: number;
  side: Side;
  modality: Modality | "unknown";
  kind: "result";
  seq_cur: number;
  seq_total: number;
  /** ISO 8601 acquisition timestamp, or null if unavailable. */
  timestamp: string | null;
  width: number;
  height: number;
  channels: number;
  depth: 0 | 8 | 16;
  aspect: number;
  score?: number;
  pos_mm?: number;
  description?: string;
  /** Relative URL to fetch the frame image, e.g. /api/v1/frames/42/image */
  image_url: string;
};

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
    // Legacy endpoints return { error }; the v1 Sessions API returns
    // { error_type, error_message }. Surface whichever is present.
    const data = err.response?.data as
      | { error?: string; error_message?: string }
      | undefined;
    if (data?.error_message) return data.error_message;
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
 * True when an error is an HTTP 410 Gone — the v1 Sessions API returns this
 * once a frame's image data has been evicted from the device's memory.
 */
export function isGoneError(err: unknown): boolean {
  return err instanceof AxiosError && err.response?.status === 410;
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

    /** Sessions that contain at least one RESULT frame, newest first. */
    listSessions: (): Promise<SessionSummary[]> =>
      http
        .get<{ sessions: SessionSummary[] }>("/api/v1/sessions")
        .then((r) => r.data.sessions),

    /**
     * RESULT frames for a session. `modality` is sent only when set, so the
     * request stays minimal and forward-compatible if the API options change.
     */
    listSessionFrames: (
      session: number,
      opts?: { modality?: Modality },
    ): Promise<Frame[]> =>
      http
        .get<{ session: number; frames: Frame[] }>(
          `/api/v1/sessions/${session}/frames`,
          opts?.modality ? { params: { modality: opts.modality } } : undefined,
        )
        .then((r) => r.data.frames),

    /** Absolute URL for a compressed WebP preview thumbnail of a frame. */
    frameThumbUrl: (frame: Frame): string =>
      `${baseURL}${frame.image_url}?format=webp`,

    /** Absolute URL for the full-resolution frame image (server-default PNG). */
    frameImageUrl: (frame: Frame): string => `${baseURL}${frame.image_url}`,

    /**
     * WebSocket live stream URLs for this backend.
     * Scheme follows the base URL: https → wss (WebCodecs), http → ws (JPEG).
     */
    streamUrls: (() => {
      const wsBase = baseURL.replace(/^http/, "ws");
      return {
        slo: `${wsBase}/api/v1/stream/slo`,
        oct: `${wsBase}/api/v1/stream/oct`,
        pupil_left: `${wsBase}/api/v1/stream/pupil_left`,
        pupil_right: `${wsBase}/api/v1/stream/pupil_right`,
      };
    })(),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
