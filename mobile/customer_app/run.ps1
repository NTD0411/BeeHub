# Wrapper → npm run dev:customer (backend cửa sổ riêng, Ctrl+C an toàn).
Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))
if (-not (Test-Path "node_modules\concurrently")) { npm install }
npm run dev:customer @args
