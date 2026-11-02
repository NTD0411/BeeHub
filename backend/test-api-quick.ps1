# Quick Payment API Test
$base = "http://localhost:3000/api"

# Test 1: Health check
Write-Host "🔍 Test 1: Health Check" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$base/health" -Method GET -TimeoutSec 5
    Write-Host "✅ API Running: $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ API Not Running" -ForegroundColor Red
    exit 1
}

# Test 2: Try login with test account
Write-Host ""
Write-Host "🔍 Test 2: Try Login" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$base/auth/login" -Method POST -TimeoutSec 5 `
        -ContentType "application/json" `
        -Body '{"email":"test@example.com","password":"test123"}'
    $json = $r.Content | ConvertFrom-Json
    Write-Host "Response: $($json | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $body = $_.Exception.Response.GetResponseStream() | { $_.ReadToEnd() }
    Write-Host "Status: $status" -ForegroundColor Yellow
    Write-Host "Response: $body" -ForegroundColor Gray
}

# Test 3: Check if payment endpoint exists
Write-Host ""
Write-Host "🔍 Test 3: Check Payment Endpoint" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "$base/customers/me/payments" -Method GET -TimeoutSec 5 `
        -Headers @{"Authorization" = "Bearer test"}
    Write-Host "Response: $($r.StatusCode)" -ForegroundColor Gray
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $status (Expected 401 - needs auth)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ API Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Next: Create a customer account then test payment" -ForegroundColor Cyan
