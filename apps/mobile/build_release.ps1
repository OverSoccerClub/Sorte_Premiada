# Build Release Script - Professional Edition
# Usage: .\build_release.ps1 [-Clean]

param (
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"
$Script:ValidationFailed = $false

function Write-Step {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host "`n[$([DateTime]::Now.ToString('HH:mm:ss'))] $Message" -ForegroundColor $Color
}

function Show-Progress {
    param([string]$Activity, [string]$Status, [int]$Percent)
    Write-Progress -Activity $Activity -Status $Status -PercentComplete $Percent
}

Clear-Host
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "      GERADOR DE APK - FEZINHA DO DIA v2.0" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Configuration
$appJsonPath = ".\app.json"
$versionJsonPath = ".\version.json"
$distDir = ".\dist"
$androidDir = ".\android"
$apkOutput = "$androidDir\app\build\outputs\apk\release\app-release.apk"
$finalApkName = "FezinhadeHoje.apk"

try {
    # 2. Sync Version
    Show-Progress -Activity "Gerando APK" -Status "Sincronizando Versões..." -PercentComplete 10
    Write-Step "1/5 Sincronizando versões..." -Color "Yellow"

    if (-not (Test-Path $appJsonPath)) { throw "app.json não encontrado!" }

    $appConfig = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    $version = $appConfig.expo.version
    $buildCode = $appConfig.expo.android.versionCode

    Write-Host "   -> Versão: $version (Build $buildCode)" -ForegroundColor Gray

    $versionData = @{
        version = $version
        build   = [string]$buildCode
        apkUrl  = $finalApkName
        force   = $true
    }
    $versionData | ConvertTo-Json -Depth 2 | Out-File $versionJsonPath -Encoding utf8
    
    # 3. Environment Check
    Show-Progress -Activity "Gerando APK" -Status "Verificando Ambiente..." -PercentComplete 20
    Write-Step "2/5 Verificando Ambiente..." -Color "Yellow"
    
    # Prebuild
    Show-Progress -Activity "Gerando APK" -Status "Executando Expo Prebuild..." -PercentComplete 30
    Write-Step "3/5 Executando Prebuild..." -Color "Yellow"

    $prebuildCmd = "npx expo prebuild --platform android"
    if ($Clean) { 
        $prebuildCmd += " --clean" 
        Write-Host "   -> Modo Limpo (Clean) Ativado" -ForegroundColor Magenta
    }
    
    cmd /c $prebuildCmd
    if ($LASTEXITCODE -ne 0) { throw "Falha no Prebuild." }

    # Garantir local.properties APÓS o prebuild (que limpa a pasta)
    if (-not (Test-Path "$androidDir\local.properties")) {
        Write-Warning "local.properties não encontrado após prebuild. Criando..."
        "sdk.dir=C:\\Users\\natal\\AppData\\Local\\Android\\Sdk" | Out-File -Encoding ascii "$androidDir\local.properties"
    }

    # 5. Gradle Assembly
    Show-Progress -Activity "Gerando APK" -Status "Compilando com Gradle (Isso pode demorar)..." -PercentComplete 60
    Write-Step "4/5 Compilando APK (Gradle)..." -Color "Yellow"
    
    Set-Location $androidDir
    $gradleArgs = "assembleRelease"
    if (-not $Clean) { $gradleArgs += " --parallel" } # Removed --build-cache to be safer
    
    # Capture output to show only if error, but stream basic info? 
    # For now, let it flow but user asked for progress bar. Gradle has its own bar usually.
    # We will trust Gradle's output but keep our main progress bar active ?
    # Actually, PowerShell pauses Write-Progress when external command runs.
    
    cmd /c "gradlew $gradleArgs -x lint"
    
    if ($LASTEXITCODE -ne 0) { 
        Set-Location ..
        throw "Falha na compilação do Gradle." 
    }
    Set-Location ..

    # 6. Artifact Management
    Show-Progress -Activity "Gerando APK" -Status "Finalizando Artefatos..." -PercentComplete 90
    Write-Step "5/5 Processando artefatos..." -Color "Yellow"

    if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir | Out-Null }

    if (Test-Path $apkOutput) {
        Copy-Item $apkOutput -Destination "$distDir\$finalApkName" -Force
        Copy-Item $versionJsonPath -Destination "$distDir\version.json" -Force
        
        Show-Progress -Activity "Gerando APK" -Status "Concluído" -PercentComplete 100
        Write-Step "SUCESSO! APK Gerado:" -Color "Green"
        Write-Host "   -> $(Resolve-Path "$distDir\$finalApkName")" -ForegroundColor White
    }
    else {
        throw "APK não encontrado em $apkOutput"
    }

}
catch {
    Write-Progress -Activity "Gerando APK" -Completed
    Write-Host "`n[ERRO CRÍTICO] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Progress -Activity "Gerando APK" -Completed
