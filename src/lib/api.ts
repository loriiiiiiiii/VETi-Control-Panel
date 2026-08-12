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
  | "file"
  | "vision_test"
  | "mujoco";

export const DISPLAY_SCENES: DisplayScene[] = [
  "default",
  "blank",
  "active_eye",
  "earth",
  "slo",
  "oct",
  "file",
  "vision_test",
  "mujoco",
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

/** Who launched a run — the X-VETi-Source audit tag recorded on the session. */
export type RunSource = "voice" | "mcp" | "hotkey" | "http" | "internal";

export type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "timed_out";

export type RunErrorType =
  | "none"
  | "script_exception"
  | "script_not_found"
  | "killed"
  | "timeout"
  | "system_error"
  | "client_timeout";

/**
 * One script run: the device's run record (status, script, timings) merged
 * with live frame counts from the reels. A session is listed from the moment
 * its script launches — before it has frames, and after they are evicted.
 */
export type Session = {
  session: number;
  script: string;
  script_path: string;
  source: RunSource;
  request_id: string;
  status: RunStatus;
  error_type: RunErrorType;
  /** Truncated exception message; empty on success. */
  error_message: string;
  /** UTC ISO 8601 wall clock at launch. */
  started_at: string;
  /** UTC ISO 8601 wall clock at terminal state; null while active. */
  ended_at: string | null;
  duration_ms: number;
  /** True while the run is queued/running. */
  current: boolean;
  /** Sub-sessions with frames still in memory. */
  subsession_count: number;
  /** Eye sides present among this session's in-memory frames. */
  sides: Side[];
  frame_counts: FrameCounts;
};

export type SubsessionInfo = {
  sub_session: number;
  side: Side;
  frame_counts: FrameCounts;
};

export type SessionDetail = Session & {
  subsessions: SubsessionInfo[];
};

/**
 * True when the session still has frames in device memory. The device lists
 * every run it has ever registered, including runs that produced no frames
 * and runs whose frames have since been evicted.
 */
export function hasFrames(session: Session): boolean {
  return session.frame_counts.slo + session.frame_counts.oct > 0;
}

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

/**
 * 202 body of a script launch. The run is only *queued* at this point; its
 * progress is observed through the session identified by `session`.
 */
export type RunAccepted = {
  success: true;
  session: number;
  /** Resolved script filename. */
  script: string;
  /** Relative URL of the run's session resource, e.g. /api/v1/sessions/42. */
  status_url: string;
  request_id: string;
};

/** 409 body of a launch rejected because another run is already in flight. */
export type BusyError = {
  success: false;
  error_type: "busy";
  error_message: string;
  /** The script that was rejected. */
  script?: string;
  /** The run already executing, or null if it ended in the meantime. */
  session: Session | null;
};

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
 * True when an error is an HTTP 404 — for the v1 Sessions API this means the
 * session number was never registered on this device (e.g. it restarted).
 */
export function isNotFoundError(err: unknown): boolean {
  return err instanceof AxiosError && err.response?.status === 404;
}

/**
 * The 409 payload when a launch is rejected because the device is already
 * running a script, or null for any other failure. The device runs one script
 * at a time and answers rejections with HTTP 409, which axios throws.
 */
export function asBusyError(err: unknown): BusyError | null {
  if (!(err instanceof AxiosError) || err.response?.status !== 409) return null;
  const data = err.response.data as Partial<BusyError> | undefined;
  return {
    success: false,
    error_type: "busy",
    error_message: data?.error_message ?? "another script is already running",
    script: data?.script,
    session: data?.session ?? null,
  };
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

    /**
     * Launch a builtin script. Resolves with the opened session as soon as the
     * device accepts the launch (202) — the run itself outlives this call.
     * Rejects with 404 when the script is unknown and 409 when busy; use
     * `asBusyError` to read the run that blocked it.
     */
    runScript: (script: string): Promise<RunAccepted> =>
      http.post<RunAccepted>("/api/run", { script }).then((r) => r.data),

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
     * Every session the device has registered, newest first — including runs
     * with no frames. Callers that browse imagery filter with `hasFrames`.
     */
    listSessions: (): Promise<Session[]> =>
      http
        .get<{ sessions: Session[] }>("/api/v1/sessions")
        .then((r) => r.data.sessions),

    /**
     * Run record + subsession breakdown for one session. The session page
     * polls this while the run is `current`. 404 when the session number was
     * never registered on this device.
     */
    getSession: (session: number): Promise<SessionDetail> =>
      http
        .get<SessionDetail>(`/api/v1/sessions/${session}`)
        .then((r) => r.data),

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
