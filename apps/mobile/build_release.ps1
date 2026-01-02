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
Write-Host "      GERADOR DE APK - A PERSEVERANÇA v2.0" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Configuration
$appJsonPath = ".\app.json"
$versionJsonPath = ".\version.json"
$distDir = ".\dist"
$androidDir = ".\android"
$apkOutput = "$androidDir\app\build\outputs\apk\release\app-release.apk"
$finalApkName = "A_Perseveranca.apk"

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

    # Garantir local.properties APÓS o prebuild
    Write-Step "Configurando SDK Path..." -Color "Gray"
    $sdkPath = "C:/Users/natal/AppData/Local/Android/Sdk"
    $env:ANDROID_HOME = "C:/Users/natal/AppData/Local/Android/Sdk"
    
    $absAndroidDir = Resolve-Path $androidDir
    [System.IO.File]::WriteAllText("$absAndroidDir\local.properties", "sdk.dir=$sdkPath", [System.Text.Encoding]::ASCII)

    # PATCH: Corrigir settings.gradle para apontar para o autolinking correto no monorepo
    Write-Step "Aplicando patch no settings.gradle..." -Color "Cyan"
    $settingsPath = "$absAndroidDir\settings.gradle"
    $settingsContent = Get-Content $settingsPath -Raw
    # Substituir a lógica dinâmica (ou patch anterior incorreto) pelo caminho correto
    $settingsContent = $settingsContent -replace 'apply from: .*?autolinking\.gradle.*?;', 'apply from: "../../../node_modules/expo/scripts/autolinking.gradle";'
    [System.IO.File]::WriteAllText($settingsPath, $settingsContent, [System.Text.Encoding]::UTF8)

    # 5. Gradle Assembly
    Show-Progress -Activity "Gerando APK" -Status "Compilando com Gradle (Isso pode demorar)..." -PercentComplete 60
    Write-Step "4/5 Compilando APK (Gradle)..." -Color "Yellow"
    
    Set-Location $absAndroidDir
    $gradleArgs = "assembleRelease"
    
    # Otimização de Memória e Envs
    $env:GRADLE_OPTS = "-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dorg.gradle.daemon=true"
    
    # Executar com propriedades de SDK explícitas
    Write-Step "Iniciando compilação final..." -Color "Cyan"
    cmd /c "gradlew $gradleArgs -x lint -Pandroid.sdk.dir=$sdkPath"
    
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
