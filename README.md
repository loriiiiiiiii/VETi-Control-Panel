# Interaction Board

A web-based control panel for the **VETi CivetWeb backend**. Built with React + Vite + TypeScript and Tailwind CSS, deployable as either a desktop browser app or a native Android APK via Capacitor.

## Features

- **System controls** — Wake up / sleep the device
- **Script runner** — Browse and launch built-in Python scripts
- **Display source** — Switch the HMD scene (default, blank, active_eye, earth, slo, oct, file)
- **Pupil monitor** — Live MJPEG stream + on-demand `/api/pupil/info` metrics
- **Backend discovery** — Automatic mDNS/Bonjour discovery of `_veti._tcp` services on Android; manual IP entry on desktop browser

## How the backend is selected

The app picks its backend differently depending on where it's running:


| Platform            | Default backend         | Discovery                                                                                                                                                                                             | Manual override     |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **Desktop browser** | `http://localhost:8888` | Browsers cannot do mDNS, so there is no auto-discovery.                                                                                                                                               | IP entry in the UI. |
| **Android APK**     | None (waits for mDNS)   | Live `_veti._tcp.local` watch via `capacitor-zeroconf` → Android `NsdManager`. The first VETi backend that resolves is auto-selected; all are listed in the header dropdown for switching on the fly. | IP entry in the UI. |


The active backend is persisted to `localStorage` and restored on next launch.

## Requirements

- Node.js 18+ and npm
- The VETi CivetWeb backend running and announcing `_veti._tcp` on the LAN (mDNS / Bonjour)
- For Android packaging: JDK 17, Android SDK command-line tools, and `adb` (no Android Studio required)

## Windows / PowerShell note

If you see *"running scripts is disabled on this system"* when running `npm`, use `npm.cmd` instead — it invokes the `.cmd` wrapper, which PowerShell allows regardless of execution policy:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

## Development (browser)

```bash
npm install
npm run dev
```

Vite serves on `http://localhost:5173`. The dev server proxies `/api` and `/mjpg` to `http://localhost:8888`, so the backend must be running on the same machine.

To talk to a backend on a different machine, open the backend selector in the header (top right) and enter the IP manually.

## Production build (browser)

```bash
npm run build
npm run preview      # smoke-test the static bundle locally
```

The static site is emitted to `dist/`. Serve it with any static-file server (nginx, `python -m http.server`, etc.) on the machine that runs the backend.

## Android APK (Capacitor)

The Android project lives in `android/` and is committed to git. It was created with `npx cap add android` and includes the `capacitor-zeroconf` plugin for native mDNS discovery.

### One-time setup (CLI only, no Android Studio)

**1. Install JDK 17**

Download from [Adoptium](https://adoptium.net/) (Temurin 17) or any JDK 17 distribution.
Set `JAVA_HOME` to the JDK 17 root and add `%JAVA_HOME%\bin` to `PATH`.
Verify: `java -version` should report `17.x`.

> Gradle 8 supports up to Java 21; JDK 25+ will cause a "Unsupported class file major version" build error.

**2. Install Android SDK command-line tools**

Download the [Android command-line tools](https://developer.android.com/studio#command-line-tools-only) (zip, no Android Studio).
Extract so the directory structure is:

```
C:\Android\
  cmdline-tools\
    latest\
      bin\
        sdkmanager.bat
        ...
```

Set `ANDROID_HOME=C:\Android` and add `%ANDROID_HOME%\cmdline-tools\latest\bin` and `%ANDROID_HOME%\platform-tools` to `PATH`.

**3. Install required SDK packages**

```powershell
sdkmanager.bat "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

Accept the licences when prompted (`y`).

### Build flow

For every rebuild:

```powershell
npm.cmd run build        # compile the React app into dist/
npm.cmd run cap:sync     # copy dist/ + Capacitor plugins into android/
```

Then build the APK with Gradle (debug APK is auto-signed and can be sideloaded directly):

```powershell
cd android
.\gradlew assembleDebug
```

The APK is output to `android/app/build/outputs/apk/debug/app-debug.apk`.

Install onto a connected tablet (USB debugging enabled):

```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Check connected devices: `adb devices`. Launch remotely: `adb shell am start -n com.veti.interactionboard/.MainActivity`.

### mDNS / network permissions

The Android manifest at `[android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)` declares the permissions required by `NsdManager` (which `capacitor-zeroconf` wraps):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

These are already in place — no manual edits required.

### Backend requirements (mDNS)

For auto-discovery to work, the VETi backend must announce itself on the LAN as `_veti._tcp.local` on port 8888. Verify with the Python `zeroconf` package:

```python
from zeroconf import Zeroconf, ServiceBrowser

class L:
    def add_service(self, zc, type_, name):
        info = zc.get_service_info(type_, name)
        print(f"Found: {name}  ->  {info.parsed_addresses()}:{info.port}")
    def update_service(self, zc, type_, name): pass
    def remove_service(self, zc, type_, name): pass

zc = Zeroconf()
ServiceBrowser(zc, "_veti._tcp.local.", L())
```

If a backend isn't appearing on the tablet but does appear on a laptop on the same LAN, double-check that the WiFi network allows multicast traffic between clients (some "guest" or "isolation" modes block this).

## Project layout

```
src/
├── main.tsx                       entry point
├── App.tsx                        dashboard layout
├── index.css                      Tailwind v4 + theme tokens
├── lib/
│   ├── api.ts                     axios instance + typed API functions
│   ├── quickScripts.ts            resolves named hotkey scripts
│   └── utils.ts                   tailwind class merge helper
├── hooks/
│   └── usePupilInfo.ts            polling hook for /api/pupil/info
├── context/
│   └── BackendContext.tsx         platform-aware backend discovery + selection
└── components/
    ├── BackendSelector.tsx        header dropdown with discovered backends
    ├── PowerButtons.tsx           wake / sleep
    ├── PrimaryPadActions.tsx      large quick-action cards
    ├── ScriptRunner.tsx           full script list with category tabs
    ├── DisplaySource.tsx          HMD scene switcher
    ├── PupilMonitor.tsx           MJPEG stream + metrics
    └── ui/                        shadcn primitives (button, card, sheet, sonner)
```

