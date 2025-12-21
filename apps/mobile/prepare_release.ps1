$releaseDir = "android\app\build\outputs\apk\release"
$targetApkName = "FezinhadoDia.apk" 

# Verifica se o APK original existe
if (Test-Path "$releaseDir\app-release.apk") {
    # Copia e renomeia o APK
    Copy-Item "$releaseDir\app-release.apk" -Destination "$releaseDir\$targetApkName" -Force
    Write-Host "APK copiado para $releaseDir\$targetApkName"
} else {
    Write-Error "Arquivo app-release.apk não encontrado em $releaseDir"
}

# Copia o version.json
if (Test-Path "version.json") {
    Copy-Item "version.json" -Destination "$releaseDir\version.json" -Force
    Write-Host "version.json copiado para $releaseDir\version.json"
} else {
    Write-Error "Arquivo version.json não encontrado na raiz de mobile"
}
