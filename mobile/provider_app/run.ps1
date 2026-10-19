# Wrapper → npm run dev:provider ở thư mục gốc repo.
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
if (-not (Test-Path "node_modules\concurrently")) { npm install }
npm run dev:provider @args
