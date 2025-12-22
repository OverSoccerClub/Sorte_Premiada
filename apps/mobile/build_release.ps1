# Build Release Script - Optimized
# Usage: .\build_release.ps1 [-Clean]

param (
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   GERADOR DE APK - FEZINHA DO DIA" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Configuration
$appJsonPath = ".\app.json"
$versionJsonPath = ".\version.json"
$distDir = ".\dist"
$androidDir = ".\android"
$apkOutput = "$androidDir\app\build\outputs\apk\release\app-release.apk"
$finalApkName = "FezinhadeHoje.apk"

# 2. Sync Version
Write-Host "`n[1/5] Sincronizando versões..." -ForegroundColor Yellow

if (-not (Test-Path $appJsonPath)) {
    Write-Error "app.json não encontrado!"
}

$appConfig = Get-Content $appJsonPath -Raw | ConvertFrom-Json
$version = $appConfig.expo.version
$buildCode = $appConfig.expo.android.versionCode

Write-Host "   Versão App: $version"
Write-Host "   Build Code: $buildCode"

$versionData = @{
    version = $version
    build   = [string]$buildCode
    apkUrl  = $finalApkName
    force   = $true
}

$versionData | ConvertTo-Json -Depth 2 | Out-File $versionJsonPath -Encoding utf8
Write-Host "   version.json atualizado." -ForegroundColor Green

# 3. Prebuild
Write-Host "`n[2/5] executando Prebuild..." -ForegroundColor Yellow

if ($Clean) {
    Write-Host "   Modo Limpo ativado (--clean)..." -ForegroundColor Magenta
    cmd /c "npx expo prebuild --platform android --clean"
}
else {
    Write-Host "   Modo Incremental (Rápido)..." -ForegroundColor Cyan
    # Check if we need to install dependencies first or if prebuild handles it
    cmd /c "npx expo prebuild --platform android"
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha no Prebuild."
}

# 4. Gradle Assembly
Write-Host "`n[3/5] Compilando APK (Gradle)..." -ForegroundColor Yellow
Set-Location $androidDir

# Optimizations for Gradle
$gradleArgs = "assembleRelease"
if (-not $Clean) {
    $gradleArgs += " --build-cache --parallel"
}

Invoke-Expression "./gradlew $gradleArgs"

if ($LASTEXITCODE -ne 0) {
    Set-Location ..
    Write-Error "Falha na compilação do Gradle."
}

Set-Location ..

# 5. Artifact Management
Write-Host "`n[4/5] Processando artefatos..." -ForegroundColor Yellow

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (Test-Path $apkOutput) {
    $destinationApk = "$distDir\$finalApkName"
    $destinationJson = "$distDir\version.json"

    Copy-Item $apkOutput -Destination $destinationApk -Force
    Copy-Item $versionJsonPath -Destination $destinationJson -Force

    Write-Host "   APK: $destinationApk" -ForegroundColor Green
    Write-Host "   JSON: $destinationJson" -ForegroundColor Green
}
else {
    Write-Error "APK não foi gerado no caminho esperado: $apkOutput"
}

# Summary
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   SUCESSO! BUILD FINALIZADO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Tempo estimado economizado: Muito."
Get-Date
