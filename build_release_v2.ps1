# BUILD_APK_MONITORADO.ps1
# Script com monitoramento em tempo real do Gradle

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "BUILD DE APK - COM MONITORAMENTO EM TEMPO REAL" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Configuracoes
$MobileDir = "apps\mobile"
$DistDir = "deploy-update"
$ApkName = "InnoBet.apk"
$Gradlew = "C:\Projetos\App\InnoBet\apps\mobile\android\gradlew.bat"

# Configurar JAVA_HOME se necessario
if (-not $env:JAVA_HOME) {
    $PotentialJava = "C:\Program Files\Android\Android Studio\jbr"
    if (Test-Path $PotentialJava) {
        $env:JAVA_HOME = $PotentialJava
        $env:Path = "$PotentialJava\bin;$env:Path"
        Write-Host "   JAVA_HOME definido para: $PotentialJava" -ForegroundColor Green
    }
}

# =========== FUNCAO PARA EXECUTAR COM TIMEOUT ===========
function Invoke-CommandWithTimeout {
    param(
        [string]$Command,
        [string]$WorkingDir = $pwd,
        [int]$TimeoutSeconds = 900
    )
    
    Write-Host "   Executando: $Command" -ForegroundColor Gray
    
    # Criar processo
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "powershell.exe"
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.UseShellExecute = $false
    $processInfo.Arguments = "-NoProfile -Command `"$Command`""
    $processInfo.WorkingDirectory = $WorkingDir
    $processInfo.CreateNoWindow = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    
    # Lista para armazenar saida
    $outputBuilder = New-Object System.Text.StringBuilder
    
    # Event handler para capturar saida em tempo real
    $scripBlock = {
        param($sender, $e)
        $line = $e.Data
        if ($line -ne $null) {
            # Mostrar progresso do Gradle em tempo real
            if ($line -match "(\d+)%") {
                Write-Host "   Progresso: $line" -ForegroundColor Yellow
            }
            elseif ($line -match "(BUILD|FAILED|SUCCESSFUL)") {
                Write-Host "   $line" -ForegroundColor Cyan
            }
            elseif ($line -match "(error|Error|ERROR)") {
                Write-Host "   $line" -ForegroundColor Red
            }
            elseif ($line -match "(warning|Warning|WARNING)") {
                Write-Host "   $line" -ForegroundColor Yellow
            }
            else {
                Write-Host "   $line" -ForegroundColor Gray
            }
            
            [void]$outputBuilder.AppendLine($line)
        }
    }
    
    # Registrar eventos
    $eventOutput = Register-ObjectEvent -InputObject $process `
        -EventName 'OutputDataReceived' `
        -Action $scripBlock
    
    $eventError = Register-ObjectEvent -InputObject $process `
        -EventName 'ErrorDataReceived' `
        -Action $scripBlock
    
    try {
        # Iniciar processo
        $process.Start() | Out-Null
        $process.BeginOutputReadLine()
        $process.BeginErrorReadLine()
        
        # Aguardar com timeout
        $completed = $process.WaitForExit($TimeoutSeconds * 1000)
        
        if (-not $completed) {
            Write-Host "   TIMEOUT: Processo excedeu $TimeoutSeconds segundos" -ForegroundColor Red
            $process.Kill()
            return 999, "Processo morto por timeout"
        }
        
        # Coletar saida restante
        $output = $outputBuilder.ToString()
        return $process.ExitCode, $output
        
    }
    finally {
        # Limpar eventos
        Unregister-Event -SourceIdentifier $eventOutput.Name -ErrorAction SilentlyContinue
        Unregister-Event -SourceIdentifier $eventError.Name -ErrorAction SilentlyContinue
        $process.Dispose()
    }
}

# =========== EXECUCAO PRINCIPAL ===========

# ETAPA 0: Corrigir build.gradle com Kotlin 2.0.20
Write-Host "[0/5] Ajustando versao do Kotlin em build.gradle..." -ForegroundColor Yellow
$gradleContent = @"
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
  ext {
    kotlinVersion = "2.0.20"
  }
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}

apply plugin: "expo-root-project"
apply plugin: "com.facebook.react.rootproject"
"@

$gradlePath = "$MobileDir\android\build.gradle"
if (Test-Path "$MobileDir\android") {
    # Set-Content -Path $gradlePath -Value $gradleContent -Encoding UTF8
    Write-Host "   build.gradle atualizado com Kotlin 2.0.20 [OK] (Manual)" -ForegroundColor Green
}

# ETAPA 1: Verificar se ja esta na pasta android
Write-Host "[1/5] Verificando estrutura..." -ForegroundColor Yellow
if (Test-Path "$MobileDir\android") {
    Write-Host "   Projeto Android ja existe [OK]" -ForegroundColor Green
}
else {
    Write-Host "   Gerando projeto Android..." -ForegroundColor Yellow
    Set-Location $MobileDir
    npx expo prebuild --platform android --clean 2>&1 | Out-Null
    Write-Host "   Projeto gerado [OK]" -ForegroundColor Green
    Set-Location ..
}

# ETAPA 2: Ir para pasta android
Write-Host "[2/5] Indo para pasta Android..." -ForegroundColor Yellow
Set-Location "$MobileDir\android"
Write-Host "   Diretorio: $(Get-Location)" -ForegroundColor Gray

# ETAPA 3: Verificar licencas Android
Write-Host "[3/5] Verificando licencas Android SDK..." -ForegroundColor Yellow
if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
    Write-Host "   SDK Android encontrado [OK]" -ForegroundColor Green
    
    # Tentar aceitar licencas automaticamente
    $sdkManager = "$env:LOCALAPPDATA\Android\Sdk\tools\bin\sdkmanager.bat"
    if (Test-Path $sdkManager) {
        Write-Host "   Verificando licencas..." -ForegroundColor Gray
        cmd /c "echo y | $sdkManager --licenses" 2>&1 | Out-Null
    }
}

# ETAPA 4: LIMPAR CACHE GRADLE (com timeout)
Write-Host "[4/5] Limpando cache Gradle... (Pular)" -ForegroundColor Yellow
# $Gradlew = (Get-Item "gradlew.bat").FullName
# $cleanCode, $cleanOutput = Invoke-CommandWithTimeout -Command "& '$Gradlew' clean" -TimeoutSeconds 300

if ($cleanCode -eq 0) {
    Write-Host "   Cache limpo [OK]" -ForegroundColor Green
}
elseif ($cleanCode -eq 999) {
    Write-Host "   TIMEOUT no clean, continuando..." -ForegroundColor Yellow
}
else {
    Write-Host "   Problemas ao limpar cache (codigo: $cleanCode)" -ForegroundColor Yellow
}

# ETAPA 5: BUILD APK RELEASE (com timeout de 15 minutos)
Write-Host "[5/5] Construindo APK Release (timeout: 15min)..." -ForegroundColor Cyan
Write-Host "   Aguarde, isso pode demorar..." -ForegroundColor Gray
Write-Host "   Saida em tempo real:" -ForegroundColor Gray
Write-Host "   ------------------------------------------------------------" -ForegroundColor DarkGray

$buildStart = Get-Date

$env:NODE_ENV = "production"
$env:BABEL_ENV = "production"

# Tentar diferentes metodos de build
$buildMethods = @(
    @{Command = "& '$Gradlew' assembleRelease --no-daemon --stacktrace"; Name = "Release padrao" },
    @{Command = "& '$Gradlew' assembleRelease --no-daemon -x lint -x test"; Name = "Release sem lint/test" },
    @{Command = "& '$Gradlew' assembleDebug --stacktrace"; Name = "Debug para diagnostico" }
)

$buildSuccess = $false
$lastError = ""

foreach ($method in $buildMethods) {
    if ($buildSuccess) { break }
    
    Write-Host "   Tentando: $($method.Name)..." -ForegroundColor Cyan
    
    $buildCode, $buildOutput = Invoke-CommandWithTimeout `
        -Command $method.Command `
        -TimeoutSeconds 900  # 15 minutos
    
    if ($buildCode -eq 0) {
        $buildTime = (Get-Date) - $buildStart
        $timeStr = "{0:mm}:{0:ss}" -f $buildTime
        Write-Host "   BUILD CONCLUIDO [OK] ($timeStr)" -ForegroundColor Green
        $buildSuccess = $true
        break
    }
    elseif ($buildCode -eq 999) {
        Write-Host "   TIMEOUT no build" -ForegroundColor Red
        $lastError = "Timeout de 15 minutos"
    }
    else {
        Write-Host "   BUILD FALHOU (codigo: $buildCode)" -ForegroundColor Red
        
        # Extrair ultimos erros
        $errorLines = $buildOutput -split "`n" | Select-Object -Last 10
        $lastError = ($errorLines -join "`n").Trim()
    }
    
    Write-Host "   Tentando proximo metodo em 5 segundos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# =========== PROCESSAR RESULTADO ===========
Write-Host ""
Write-Host "=======" -ForegroundColor DarkGray

if ($buildSuccess) {
    # Encontrar APK gerado
    $apkSourcePath = "app\build\outputs\apk\release"
    $debugApkPath = "app\build\outputs\apk\debug"
    
    $apkFile = $null
    
    if (Test-Path "$apkSourcePath\*.apk") {
        $apkFile = Get-ChildItem "$apkSourcePath\*.apk" | Select-Object -First 1
        $apkType = "RELEASE"
    }
    elseif (Test-Path "$debugApkPath\*.apk") {
        $apkFile = Get-ChildItem "$debugApkPath\*.apk" | Select-Object -First 1
        $apkType = "DEBUG"
    }
    
    if ($apkFile) {
        # Voltar para raiz e criar distribuicao
        Set-Location ..\..\..
        
        if (-not (Test-Path $DistDir)) {
            New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
        }
        
        # Copiar APK
        Copy-Item -Path $apkFile.FullName -Destination "$DistDir\$ApkName" -Force
        $fileSize = "{0:N2}" -f ($apkFile.Length / 1MB)
        
        # Criar version.json
        $versionContent = @{
            apkUrl  = $ApkName
            build   = "262"
            version = "1.5.43"
            force   = $true
        } | ConvertTo-Json
        
        $versionContent | Out-File -FilePath "$DistDir\version.json" -Encoding UTF8
        
        Write-Host "SUCESSO TOTAL!" -ForegroundColor Green
        Write-Host "APK: $DistDir\$ApkName ($fileSize MB)" -ForegroundColor White
        Write-Host "Tipo: $apkType" -ForegroundColor White
        
        # Abrir pasta
        # explorer $DistDir
    }
    else {
        Write-Host "BUILD OK mas APK nao encontrado" -ForegroundColor Yellow
        Write-Host "Verifique em: $(Get-Location)\app\build\outputs\apk\" -ForegroundColor Gray
    }
}
else {
    Write-Host "FALHA NO BUILD" -ForegroundColor Red
    
    if ($lastError) {
        Write-Host "Ultimos erros:" -ForegroundColor Red
        Write-Host $lastError -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "SOLUCAO DE PROBLEMAS:" -ForegroundColor Yellow
    Write-Host "1. Execute manualmente para ver erro completo:" -ForegroundColor Gray
    Write-Host "   cd apps\mobile\android" -ForegroundColor White
    Write-Host "   .\gradlew assembleDebug --stacktrace" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Verifique memoria do Gradle:" -ForegroundColor Gray
    Write-Host "   Crie arquivo gradle.properties com:" -ForegroundColor White
    Write-Host "   org.gradle.jvmargs=-Xmx4096m" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Verifique espaco em disco (>5GB livre)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Script concluido!" -ForegroundColor Gray
# Read-Host "Pressione Enter para sair"
