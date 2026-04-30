# Interaction Board

A web-based control panel for the **VETi CivetWeb backend** (REST API on `localhost:8888`). Built with React + Vite + TypeScript and Tailwind CSS, deployable as either a desktop browser app on the local network or a native Android APK via Capacitor.

## Features

- **System controls** — Wake up / sleep the device
- **Script runner** — Browse and launch built-in Python scripts grouped by category, with hotkey badges
- **Display source** — Switch the HMD scene (default, blank, active_eye, earth, slo, oct, file)
- **Pupil monitor** — Live polling of `/api/pupil/info` showing eye, status, position, size, and IPD

## Requirements

- Node.js 18+ and npm
- The VETi CivetWeb backend running on `localhost:8888`
- For Android packaging: Android Studio (Hedgehog or newer) and a JDK 17+

## Windows / PowerShell note

If you see _"running scripts is disabled on this system"_ when running `npm`, use `npm.cmd` instead in PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

This invokes the `.cmd` wrapper, which PowerShell allows regardless of execution policy.

## Development

```bash
npm.cmd install
npm.cmd run dev
```

Vite serves on `http://localhost:5173` (and on your LAN IP, since `--host` is set). Open it in any browser on the same machine — the UI talks to the backend at `http://localhost:8888`.

## Production build

```bash
npm run build
npm run preview      # smoke-test the static bundle locally
```

The static site is emitted to `dist/`. Serve it with anything (nginx, `python -m http.server`, etc.) on the machine that runs the backend so `localhost:8888` resolves correctly.

## Backend URL

The backend host is hardcoded in [`src/lib/api.ts`](src/lib/api.ts) as:

```ts
export const API_BASE_URL = "http://localhost:8888";
```

Two situations require changing it:

1. **Hosting the static build on a different machine than the backend.** Replace `localhost` with the backend machine's LAN IP before `npm run build`.
2. **Building the Android APK.** The tablet cannot reach `localhost` on the host PC, so set this to the backend machine's LAN IP (e.g. `http://192.168.1.42:8888`) before `npm run build`, then sync into Capacitor.

## Android APK (Capacitor)

The first time only:

```bash
npm install
npm run build
npx cap add android      # creates the android/ project (one-time)
```

For each subsequent rebuild:

```bash
npm run build
npm run cap:sync         # copies dist/ into android/
npm run cap:open         # opens Android Studio
```

In Android Studio: **Build → Build Bundle(s)/APK(s) → Build APK(s)**, then sideload the resulting `app-debug.apk` (or a signed release APK) onto the tablet.

The frontend is bundled inside the APK — no local web server is required to serve the UI. REST calls still go out to the backend over the LAN, so the tablet must be on the same network as the backend machine.

## Project layout

```
src/
├── main.tsx                 entry point
├── App.tsx                  dashboard layout
├── index.css                Tailwind + base styles
├── lib/
│   ├── api.ts               axios instance + typed API functions
│   └── cn.ts                tailwind class merge helper
├── hooks/
│   └── usePupilInfo.ts      polling hook for /api/pupil/info
└── components/
    ├── Card.tsx
    ├── Button.tsx
    ├── Toast.tsx
    ├── SystemControls.tsx
    ├── ScriptRunner.tsx
    ├── DisplaySource.tsx
    └── PupilMonitor.tsx
```
