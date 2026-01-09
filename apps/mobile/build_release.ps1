# Build Release Script - Professional Edition
# Usage: .\build_release.ps1 [-Clean]

param (
    [switch]$Clean = $false,
    [string]$Arch = ""
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
Write-Host "      GERADOR DE APK - INNOBET " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 1. Configuration
$appJsonPath = ".\app.json"
$versionJsonPath = ".\version.json"
$distDir = ".\dist"
$androidDir = ".\android"
$apkOutput = "$androidDir\app\build\outputs\apk\release\app-release.apk"
$finalApkName = "InnoBet.apk"

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

    # PATCH: Restore Display Name in strings.xml using Node for safety
    Write-Step "Restaurando nome de exibição..." -Color "Cyan"
    if (Test-Path ".\android\app\src\main\res\values\strings.xml") {
        node -e "const fs = require('fs'); const path = 'android/app/src/main/res/values/strings.xml'; if (fs.existsSync(path)) { let c = fs.readFileSync(path, 'utf8'); c = c.replace(/>APerseveranca</, '>A Perseverança<'); fs.writeFileSync(path, c, {encoding: 'utf8'}); }"
    }

    # Garantir local.properties APÓS o prebuild
    # Garantir local.properties APÓS o prebuild
    Write-Step "Configurando SDK Path..." -Color "Gray"
    
    $possibleSdkPaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "C:\Users\Personal Computer\AppData\Local\Android\Sdk",
        "C:\Android\Sdk"
    )
    
    $sdkPath = ""
    foreach ($path in $possibleSdkPaths) {
        if (Test-Path $path) {
            $sdkPath = $path
            break
        }
    }

    if ([string]::IsNullOrEmpty($sdkPath)) {
        Write-Warning "Android SDK não encontrado automaticamente via script."
        # Fallback to env var if set, otherwise fail
        if ($env:ANDROID_HOME) { $sdkPath = $env:ANDROID_HOME }
    }

    $env:ANDROID_HOME = $sdkPath
    Write-Host "   -> SDK Path: $sdkPath" -ForegroundColor Gray

    # NDK Detection
    $ndkPath = $null
    $ndkBase = Join-Path $sdkPath "ndk"
    if (Test-Path $ndkBase) {
        $ndkVersions = Get-ChildItem $ndkBase | Sort-Object Name -Descending
        if ($ndkVersions.Count -gt 0) {
           $ndkPath = $ndkVersions[0].FullName
           $env:ANDROID_NDK_HOME = $ndkPath
           Write-Host "   -> NDK Encontrado: $ndkPath" -ForegroundColor Gray
        }
    }
    
    $absAndroidDir = Resolve-Path $androidDir
    $localPropsContent = "sdk.dir=$($sdkPath.Replace('\', '/'))"
    if ($ndkPath) {
        $localPropsContent += "`nndk.dir=$($ndkPath.Replace('\', '/'))"
    }
    
    [System.IO.File]::WriteAllText("$absAndroidDir\local.properties", $localPropsContent, [System.Text.Encoding]::ASCII)

    # PATCH: Corrigir settings.gradle para apontar para o autolinking correto no monorepo
    Write-Step "Aplicando patch no settings.gradle..." -Color "Cyan"
    $settingsPath = "$absAndroidDir\settings.gradle"
    $settingsContent = Get-Content $settingsPath -Raw
    # Substituir a lógica dinâmica (ou patch anterior incorreto) pelo caminho correto
    $settingsContent = $settingsContent -replace 'apply from: .*?autolinking\.gradle.*?;', 'apply from: "../../../node_modules/expo/scripts/autolinking.gradle";'
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($settingsPath, $settingsContent, $utf8NoBom)

    # 5. Gradle Assembly
    Show-Progress -Activity "Gerando APK" -Status "Compilando com Gradle (Isso pode demorar)..." -PercentComplete 60
    Write-Step "4/5 Compilando APK (Gradle)..." -Color "Yellow"
    
    Set-Location $absAndroidDir
    $gradleArgs = "assembleRelease"
    
    # Otimização de Memória e Envs
    $env:GRADLE_OPTS = "-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dorg.gradle.daemon=true"
    
    # Propriedades de arquitetura
    if ($Arch) {
        $gradleArgs += " -PreactNativeArchitectures=$Arch"
        Write-Step "Building only for architecture: $Arch" -Color "Gray"
    }

    # Executar com propriedades de SDK explícitas
    # Executar com propriedades de SDK explícitas
    # Local properties já foi configurado acima
    
    Write-Step "Iniciando compilação final..." -Color "Cyan"
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
