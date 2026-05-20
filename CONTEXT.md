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
A full-screen view rendered inside `AppShell`, selected via the floating tab bar. Three tabs: Home (actions + display scene buttons), Scripts (`ScriptRunner`), Monitor (cameras + pupil, switchable via segmented control).

## Invariants

- `BackendContext` is the only place that creates `ApiClient` instances. All other modules read `client` from `useBackend()`.
- VETi device port (`8888`) and mDNS service type (`_veti._tcp.`) are defined once in `lib/veti.ts`.
- The pupil monitor uses 3-second auto-polling (`setInterval`) for metrics — no manual refresh button.
