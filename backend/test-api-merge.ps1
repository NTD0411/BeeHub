$base = "http://localhost:3000/api"
$results = @()

function Test-Api($name, $method, $path, $body, $headers, $expectStatus) {
    try {
        $params = @{
            Uri = "$base$path"
            Method = $method
            TimeoutSec = 15
            ErrorAction = "Stop"
        }
        if ($body) { $params.Body = ($body | ConvertTo-Json); $params.ContentType = "application/json" }
        if ($headers) { $params.Headers = $headers }
        $r = Invoke-WebRequest @params
        $status = $r.StatusCode
        $json = $r.Content | ConvertFrom-Json
        $ok = if ($expectStatus) { $status -eq $expectStatus } else { $status -ge 200 -and $status -lt 300 }
        $results += [pscustomobject]@{ Test = $name; Status = $status; OK = $ok; Note = if ($json.success) { "success=true" } else { $json.message } }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        $reader.Close()
        try { $json = $errBody | ConvertFrom-Json; $msg = $json.message } catch { $msg = $errBody.Substring(0, [Math]::Min(80, $errBody.Length)) }
        $ok = if ($expectStatus) { $status -eq $expectStatus } else { $false }
        $results += [pscustomobject]@{ Test = $name; Status = $status; OK = $ok; Note = $msg }
    }
}

Test-Api "health" GET "/health" $null $null 200
Test-Api "login-no-body" POST "/auth/login" @{} $null 400
Test-Api "admin-login-no-body" POST "/admin/auth/login" @{} $null 400
Test-Api "admin-dashboard-no-auth" GET "/admin/dashboard" $null $null 401
Test-Api "admin-providers-no-auth" GET "/admin/providers/pending" $null $null 401
Test-Api "auth-me-no-auth" GET "/auth/me" $null $null 401
Test-Api "forgot-password" POST "/auth/forgot-password" @{ email = "test@fpt.edu.vn" } $null $null
Test-Api "login-fake" POST "/auth/login" @{ email = "nonexistent@test.com"; password = "wrongpass12" } $null 401

$results | Format-Table -AutoSize
