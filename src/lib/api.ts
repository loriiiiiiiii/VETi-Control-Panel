import axios, { AxiosError, type AxiosInstance } from "axios";

export const API_BASE_URL = "http://localhost:8888";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export async function getScripts(): Promise<ScriptInfo[]> {
  const { data } = await http.get<ScriptInfo[]>("/api/scripts");
  return data;
}

export type RunScriptResponse = ApiResult<{ script?: string }>;

export async function runScript(script: string): Promise<RunScriptResponse> {
  const { data } = await http.post<RunScriptResponse>("/api/run", { script });
  return data;
}

export type WakeupResponse = ApiResult;

export async function wakeup(blocking = true): Promise<WakeupResponse> {
  const { data } = await http.post<WakeupResponse>("/api/wakeup", { blocking });
  return data;
}

export type SleepResponse = ApiResult;

export async function sleep(): Promise<SleepResponse> {
  const { data } = await http.post<SleepResponse>("/api/sleep");
  return data;
}

export type DisplaySourceResponse = ApiResult<{ scene?: DisplayScene }>;

export async function setDisplaySource(
  scene: DisplayScene,
): Promise<DisplaySourceResponse> {
  const { data } = await http.post<DisplaySourceResponse>(
    "/api/display/source",
    { scene },
  );
  return data;
}

export async function getPupilInfo(): Promise<PupilInfo> {
  const { data } = await http.get<PupilInfo>("/api/pupil/info");
  return data;
}
