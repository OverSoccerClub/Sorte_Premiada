
$ErrorActionPreference = "Stop"
$AdbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$ApkPath = "deploy-update\InnoBet.apk"

if (-not (Test-Path $AdbPath)) {
    Write-Host "ADB not found at $AdbPath. Trying global adb..."
    $AdbPath = "adb"
}

Write-Host "Waiting for APK at $ApkPath..."
# Wait up to 20 minutes for the APK to appear or update (checking if it was modified recently?)
# For now, just check if it exists. Ideally we wait for the BUILD process to release the file lock or finish.
# But since we are running this separately, we might just run it manually after build.

if (Test-Path $ApkPath) {
    Write-Host "Installing $ApkPath to device..."
    & $AdbPath install -r $ApkPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Installation SUCCESS!" -ForegroundColor Green
    }
    else {
        Write-Host "Installation FAILED with code $LASTEXITCODE" -ForegroundColor Red
        & $AdbPath devices
    }
}
else {
    Write-Host "APK not found at $ApkPath. Build might still be running or failed." -ForegroundColor Red
}
