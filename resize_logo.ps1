
Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Projetos\App\MegaSena\apps\mobile\assets\nova_logo.png"
$targetPath = "c:\Projetos\App\MegaSena\apps\mobile\assets\nova_logo_resized.png"

Write-Host "Resizing $sourcePath to $targetPath..."

try {
    $img = [System.Drawing.Image]::FromFile($sourcePath)
    $newWidth = 1024
    $newHeight = 1024
    
    $resized = new-object System.Drawing.Bitmap($newWidth, $newHeight)
    $graph = [System.Drawing.Graphics]::FromImage($resized)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
    
    $resized.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $img.Dispose()
    $resized.Dispose()
    $graph.Dispose()
    
    Write-Host "Resize success."
} catch {
    Write-Error "Failed to resize: $_"
    exit 1
}
