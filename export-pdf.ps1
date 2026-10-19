# Xuất unimove-flow-doc.html → unimove-flow.pdf
# Chạy: .\export-pdf.ps1

$html = (Resolve-Path ".\unimove-flow-doc.html").Path
$pdf  = (Join-Path (Get-Location) "unimove-flow.pdf")

# Thử Edge trước, rồi Chrome
$edge   = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

if (Test-Path $edge) {
    $browser = $edge
} elseif (Test-Path $chrome) {
    $browser = $chrome
} else {
    Write-Error "Không tìm thấy Edge hoặc Chrome. Hãy mở unimove-flow-doc.html thủ công rồi Ctrl+P."
    exit 1
}

Write-Host "Đang xuất PDF..." -ForegroundColor Cyan
& $browser --headless=new "--print-to-pdf=$pdf" "file:///$html" 2>$null

if (Test-Path $pdf) {
    Write-Host "Xong! File: $pdf" -ForegroundColor Green
} else {
    Write-Error "Xuất thất bại. Thử mở file HTML thủ công rồi Ctrl+P."
}
