# Start Android emulator with software GPU (fixes black screen on Windows x86).
# Usage: .\scripts\emulator-fix.ps1
param([string]$AvdName = "Pixel_9_Pro_XL")

$emulator = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
if (-not (Test-Path $emulator)) {
    Write-Error "emulator.exe not found. Install Android Studio SDK."
    exit 1
}

Write-Host "Stopping old emulator..."
adb emu kill 2>$null

Write-Host "Starting $AvdName with -gpu swiftshader_indirect ..."
Start-Process -FilePath $emulator -ArgumentList @(
    "-avd", $AvdName,
    "-gpu", "swiftshader_indirect",
    "-no-snapshot-load"
)

Write-Host "Wait for boot (~60s), then run: .\run.ps1"
