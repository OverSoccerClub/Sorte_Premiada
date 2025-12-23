Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   BUILD PROFISSIONAL - FEZINHA DO DIA    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Limpeza de Processos
Write-Host "`n[1/4] Higienizando ambiente (Matando Java)..." -ForegroundColor Yellow
try {
    Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
    Write-Host "Processos Java finalizados." -ForegroundColor Green
}
catch {
    Write-Host "Nenhum processo Java travado encontrado." -ForegroundColor Gray
}

# 2. Limpeza de Diretórios
Write-Host "`n[2/4] Limpando diretórios de build antigos..." -ForegroundColor Yellow
$dirsToRemove = @(
    "android/app/build",
    "android/.gradle",
    "android/build"
)

foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Write-Host "Removendo $dir..." -ForegroundColor Gray
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Limpeza de disco concluída." -ForegroundColor Green

# 2.1 Configuração de Ambiente
Write-Host "`n[2.1/4] Configurando Variáveis de Ambiente..." -ForegroundColor Yellow
$sdkPath = "C:\Users\natal\AppData\Local\Android\Sdk"
if (Test-Path $sdkPath) {
    $env:ANDROID_HOME = $sdkPath
    Write-Host "ANDROID_HOME definido para: $env:ANDROID_HOME" -ForegroundColor Green
}
else {
    Write-Host "AVISO: SDK Path não encontrado em $sdkPath" -ForegroundColor Red
}

# 3. Execução do Build
Write-Host "`n[3/4] Iniciando Compilação (Gradle AssembleRelease)..." -ForegroundColor Yellow
Set-Location android

# Log file
$logFile = "build_log.txt"
if (Test-Path $logFile) { Remove-Item $logFile }

Write-Host "Executando Gradle... Log sendo salvo em: android/$logFile"
# Usando cmd para redirecionamento correto
cmd /c "gradlew clean assembleRelease --stacktrace --no-daemon > $logFile 2>&1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBUILD SUCESSO!" -ForegroundColor Green
    Set-Location ..
}
else {
    Write-Host "`nERRO FATAL NO BUILD." -ForegroundColor Red
    Write-Host "-------------------- LOG ERROR --------------------" -ForegroundColor Red
    Get-Content $logFile -Tail 100
    Write-Host "---------------------------------------------------" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 4. Instalação
Write-Host "`n[4/4] Instalando no Dispositivo USB..." -ForegroundColor Yellow
$apkPath = "android/app/build/outputs/apk/release/app-release.apk"

if (Test-Path $apkPath) {
    Write-Host "Buscando dispositivos..."
    adb devices
    Write-Host "Instalando $apkPath..."
    adb install -r $apkPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nINSTALAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
        Write-Host "Versão 1.1.42 deve estar disponível no aparelho." -ForegroundColor Cyan
    }
    else {
        Write-Host "`nFalha na instalação via ADB. Verifique a conexão USB." -ForegroundColor Red
    }
}
else {
    Write-Host "ERRO: Arquivo APK não encontrado em: $apkPath" -ForegroundColor Red
}
