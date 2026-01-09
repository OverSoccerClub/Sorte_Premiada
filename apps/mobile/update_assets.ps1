# Update Assets Script
# Automates icon resizing and color configuration

Add-Type -AssemblyName System.Drawing

$sourcePath = ".\assets\nova_logo-review.png"
$webFaviconPath = ".\assets\favicon.png"
$appIconPath = ".\assets\icon.png"
$adaptiveIconPath = ".\assets\adaptive-icon.png"
$splashPath = ".\assets\splash.png"
$appJsonPath = ".\app.json"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

Write-Host "Loading source image..."
$img = [System.Drawing.Image]::FromFile($sourcePath)
$bitmap = New-Object System.Drawing.Bitmap($img)

# 1. Detect Background Color (Pixel 0,0)
$pixel = $bitmap.GetPixel(0, 0)
$hexColor = "#{0:X2}{1:X2}{2:X2}" -f $pixel.R, $pixel.G, $pixel.B
Write-Host "Detected Background Color: $hexColor" -ForegroundColor Cyan

# Function to resize and save
function Resize-Image {
    param ($image, $path, $width, $height, $mode = "Stretch", $bgColorHex = "#FFFFFF")
    
    $resized = New-Object System.Drawing.Bitmap($width, $height)
    $graph = [System.Drawing.Graphics]::FromImage($resized)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if ($mode -eq "Contain") {
        # Fill background
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($bgColorHex))
        $graph.FillRectangle($brush, 0, 0, $width, $height)
        $brush.Dispose()

        # Calculate aspect ratio
        $ratioX = $width / $image.Width
        $ratioY = $height / $image.Height
        # Use smaller ratio to fit
        $ratio = [Math]::Min($ratioX, $ratioY) * 0.5 # Scale to 50% of available space for nice padding

        $newW = [int]($image.Width * $ratio)
        $newH = [int]($image.Height * $ratio)

        $posX = [int](($width - $newW) / 2)
        $posY = [int](($height - $newH) / 2)

        $graph.DrawImage($image, $posX, $posY, $newW, $newH)
    }
    else {
        # Stretch (Default)
        $graph.DrawImage($image, 0, 0, $width, $height)
    }
    
    $resized.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
    $graph.Dispose()
    Write-Host "Saved: $path ($width x $height) [$mode]"
}

# 2. Generate Images
Write-Host "Generating Assets..."
Resize-Image -image $img -path $appIconPath -width 1024 -height 1024
Resize-Image -image $img -path $adaptiveIconPath -width 1024 -height 1024
# Splash: Use Contain mode to avoid stretching, using detected bg color
Resize-Image -image $img -path $splashPath -width 1284 -height 2778 -mode "Contain" -bgColorHex $hexColor
Resize-Image -image $img -path $webFaviconPath -width 48 -height 48

$img.Dispose()
$bitmap.Dispose()

# 3. Update app.json
Write-Host "Updating app.json configuration..."
$jsonContent = Get-Content $appJsonPath -Raw
$jsonObj = $jsonContent | ConvertFrom-Json

# Update background colors
$jsonObj.expo.splash.backgroundColor = $hexColor
$jsonObj.expo.android.adaptiveIcon.backgroundColor = $hexColor

# Save back
$jsonObj | ConvertTo-Json -Depth 10 | Out-File $appJsonPath -Encoding utf8
Write-Host "Updated app.json with color $hexColor" -ForegroundColor Green
