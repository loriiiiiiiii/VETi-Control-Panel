# Interaction Board — Domain Context

Shared vocabulary for this codebase. Use these terms in code, comments, PRs, and architectural discussion.

## Purpose

Web/Android control panel for a **VETi** device (ophthalmic HMD). Wraps the VETi CivetWeb backend's HTTP API in a touch-friendly UI.

## Terms

**Backend**
A reachable VETi device: a base URL (`http://<ip>:8888`), bare IP, and human-readable label. Discovered via mDNS on Android or configured manually. Stored in `localStorage` across sessions.

**Active backend**
The backend currently selected for API calls. Exposed by `BackendContext` as `active`, `activeUrl`, and `client`. Switching the active backend creates a new `ApiClient` bound to the new URL.

**ApiClient**
A set of backend-bound API functions created by `createApiClient(baseURL)`. Each active backend gets exactly one client. Callers must obtain the client from `useBackend()` — never import a shared axios instance. This makes backend dependency explicit at every call site.

**Script**
A Python script registered on the VETi backend. Has a `filename`, display `name`, `category`, and optional `hotkey`. Retrieved via `GET /api/scripts`, run via `POST /api/run`.

**Quick script**
One of the two primary-pad actions (Scan, Vision Test) resolved from the full script list by name/hotkey heuristics in `resolveQuickScripts`. Shown as large action cards on the home screen.

**Display scene**
A named HMD rendering mode (`default`, `blank`, `active_eye`, `earth`, `slo`, `oct`, `file`). Set via `POST /api/display/source`. Managed in `DisplaySource`.

**Pupil stream**
Live WebSocket binary (JPEG) feed from the pupil camera, rendered via `WsStreamImg`. The active eye is auto-selected from pupil metrics. Metrics auto-refresh every 3 seconds via `setInterval`.

**Tab**
A full-screen view rendered inside `AppShell`, selected via the floating tab bar. Four tabs: Home (actions + display scene buttons), Scripts (`ScriptRunner`), Results (`ResultsView` — session browser), Monitor (cameras + pupil, switchable via segmented control).

**Session**
A diagnostic acquisition run on the VETi device, identified by a monotonic integer. Contains one or more sub-sessions. Only sessions with at least one RESULT frame are exposed. Retrieved via `GET /api/v1/sessions`. Marked `current` while it is the active acquisition.

**Sub-session**
A grouping within a session, keyed by `(sub_session, side)`. Each carries its own SLO/OCT frame counts.

**Side**
The eye a frame or sub-session belongs to: `OD` (right), `OS` (left), or `OU` (both).

**Modality**
The imaging source of a frame: `SLO` or `OCT`. (The API may report `unknown`.)

**Frame**
A single captured image plus metadata, identified by a stable web-layer id. Only RESULT-kind frames are exposed in v1. Rendered as a compressed WebP thumbnail in the gallery and as a PNG in the full viewer, both via `GET /api/v1/frames/{id}/image`.

**Eviction (Gone)**
Sessions and frames are ephemeral — they live only while their in-memory image data survives. An evicted frame's image returns `410 Gone`. When the UI hits an eviction it tells the user the device state changed and returns them to a freshly-loaded session list.

## Invariants

- `BackendContext` is the only place that creates `ApiClient` instances. All other modules read `client` from `useBackend()`.
- VETi device port (`8888`) and mDNS service type (`_veti._tcp.`) are defined once in `lib/veti.ts`.
- The pupil monitor uses 3-second auto-polling (`setInterval`) for metrics — no manual refresh button.
