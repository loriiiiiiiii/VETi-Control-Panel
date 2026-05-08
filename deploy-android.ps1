# deploy-android.ps1
# Builds the React app, syncs to Capacitor, compiles the debug APK, and installs it
# onto the first ADB-connected device.
#
# Usage:
#   .\deploy-android.ps1               # build + install
#   .\deploy-android.ps1 -SkipBuild    # skip npm build + cap sync (re-use last dist/)
#   .\deploy-android.ps1 -Device <id>  # target a specific ADB device serial

param(
    [switch]$SkipBuild,
    [string]$Device = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Invoke-Checked([string]$desc, [scriptblock]$cmd) {
    Write-Step $desc
    & $cmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $desc (exit $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# ---------------------------------------------------------------------------
# 1. Check prerequisites
# ---------------------------------------------------------------------------
Write-Step "Checking prerequisites"

foreach ($tool in @("adb", "npm.cmd")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: '$tool' not found in PATH." -ForegroundColor Red
        exit 1
    }
}

# ---------------------------------------------------------------------------
# 2. Check ADB device
# ---------------------------------------------------------------------------
Write-Step "Checking ADB device"

$adbArgs = @()
if ($Device) { $adbArgs = @("-s", $Device) }

$devices = & adb devices | Select-String "device$"
if (-not $devices) {
    Write-Host "ERROR: No ADB device connected. Connect a device and enable USB debugging." -ForegroundColor Red
    exit 1
}

if ($Device) {
    Write-Host "Targeting device: $Device"
} else {
    $firstDevice = ($devices | Select-Object -First 1) -replace "\s+device$", ""
    Write-Host "Targeting device: $firstDevice"
}

# ---------------------------------------------------------------------------
# 3. Build web assets + Capacitor sync
# ---------------------------------------------------------------------------
if (-not $SkipBuild) {
    Invoke-Checked "Building React app (npm run build)" {
        npm.cmd run build
    }

    Invoke-Checked "Syncing Capacitor (cap sync android)" {
        npm.cmd run cap:sync
    }
} else {
    Write-Host "`n  Skipping web build (--SkipBuild)" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# 4. Gradle assembleDebug
# ---------------------------------------------------------------------------
Invoke-Checked "Compiling debug APK (gradlew assembleDebug)" {
    Push-Location android
    .\gradlew assembleDebug
    Pop-Location
}

$apk = "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apk)) {
    Write-Host "ERROR: APK not found at $apk" -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# 5. Install APK via ADB
# ---------------------------------------------------------------------------
Write-Step "Installing APK onto device"

$installArgs = $adbArgs + @("install", "-r", $apk)
& adb @installArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: adb install (exit $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

# ---------------------------------------------------------------------------
# 6. Launch the app
# ---------------------------------------------------------------------------
Write-Step "Launching app"

$launchArgs = $adbArgs + @("shell", "am", "start", "-n", "com.veti.interactionboard/.MainActivity")
& adb @launchArgs | Out-Null

Write-Host "`nDone. App is running on the device." -ForegroundColor Green
