# Test PayOS QR Code Payment Integration
# This script tests the complete payment flow: create order -> generate QR code -> simulate payment

$base = "http://localhost:3000/api"
$logFile = ".\test-payos-qr.log"

function Log {
    param([string]$msg)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $log = "[$timestamp] $msg"
    Write-Host $log
    Add-Content -Path $logFile -Value $log
}

function Test-Api($name, $method, $path, $body, $headers, $expectStatus) {
    try {
        $params = @{
            Uri = "$base$path"
            Method = $method
            TimeoutSec = 15
            ErrorAction = "Stop"
        }
        if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 10); $params.ContentType = "application/json" }
        if ($headers) { $params.Headers = $headers }
        
        Log "→ $method $path"
        if ($body) { Log "  Body: $(($body | ConvertTo-Json -Compress -Depth 5))" }
        
        $r = Invoke-WebRequest @params
        $status = $r.StatusCode
        $json = $r.Content | ConvertFrom-Json
        
        Log "← Status: $status"
        Log "← Response: $(($json | ConvertTo-Json -Compress -Depth 5))"
        
        return @{
            success = $true
            status = $status
            data = $json
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        $reader.Close()
        
        Log "✗ Error Status: $status"
        Log "✗ Error Body: $errBody"
        
        return @{
            success = $false
            status = $status
            error = $errBody
        }
    }
}

# Clear log file
"" | Set-Content -Path $logFile

Log "=========================================="
Log "TEST: PayOS QR Code Payment Integration"
Log "=========================================="

# Step 1: Login as customer
Log ""
Log "STEP 1: Login as customer"
Log "---"

$loginResult = Test-Api "login" "POST" "/auth/login" @{
    email = "customer1@test.com"
    password = "password123"
} $null 200

if (!$loginResult.success) {
    Log "✗ Login failed"
    exit 1
}

$token = $loginResult.data.data.token
$customerId = $loginResult.data.data.id
$headers = @{ "Authorization" = "Bearer $token" }

Log "✓ Login successful"
Log "  Token: $($token.Substring(0, 30))..."
Log "  Customer ID: $customerId"

# Step 2: Get or create an order
Log ""
Log "STEP 2: Get customer orders"
Log "---"

$ordersResult = Test-Api "get-orders" "GET" "/customers/me/orders" $null $headers 200

if (!$ordersResult.success) {
    Log "✗ Failed to fetch orders"
    exit 1
}

$orders = $ordersResult.data.data
Log "✓ Found $($orders.Count) order(s)"

if ($orders.Count -eq 0) {
    Log "ℹ No orders found. You need to create an order first."
    Log "  Create a moving order via the app/UI first, then run this script again."
    exit 0
}

$order = $orders[0]
$orderId = $order.id
Log "  Using order: $($order.id.Substring(0, 8))..."
Log "  Status: $($order.status)"
Log "  From: $($order.pickup_location)"
Log "  To: $($order.delivery_location)"

# Step 3: Create payment (generate QR code)
Log ""
Log "STEP 3: Create payment & generate QR code (PayOS)"
Log "---"

$depositResult = Test-Api "create-deposit" "POST" "/customers/me/payments/deposit" @{
    order_id = $orderId
    amount = 50000  # 50,000 VND deposit
    payment_method = "payos"
    customer_name = $loginResult.data.data.name
    customer_email = $loginResult.data.data.email
} $headers 201

if (!$depositResult.success) {
    Log "✗ Failed to create payment"
    exit 1
}

$payment = $depositResult.data.data
$paymentId = $payment.payment_id
$paymentCode = $payment.payment_code
$qrCodeUrl = $payment.qr_code
$checkoutUrl = $payment.checkout_url

Log "✓ Payment created successfully"
Log "  Payment ID: $paymentId"
Log "  Payment Code: $paymentCode"
Log "  Amount: $($payment.amount) VND"
Log "  Status: $($payment.status)"
Log "  Expires: $($payment.expires_at)"

# Step 4: Display QR Code options
Log ""
Log "STEP 4: QR Code Payment Options"
Log "---"

Log "📱 QR Code URL (for display):"
Log "   $qrCodeUrl"
Log ""
Log "🔗 Checkout URL (for web browser):"
Log "   $checkoutUrl"
Log ""

# Display QR code using Windows PowerShell
Log ""
Log "📲 QR CODE IMAGE:"
Log "---"
Log "Open this URL in your browser to see/scan the QR code:"
Log "$qrCodeUrl"
Log ""

# Step 5: Instructions for payment
Log ""
Log "STEP 5: How to test payment"
Log "---"
Log ""
Log "Option A: Scan QR Code"
Log "  1. Open the QR code URL above in a browser"
Log "  2. Scan with mobile device"
Log "  3. Complete payment on PayOS platform"
Log ""
Log "Option B: Direct Link"
Log "  1. Open checkout URL: $checkoutUrl"
Log "  2. Complete payment"
Log ""
Log "Option C: Manual Bank Transfer (if available)"
Log "  Bank Account: $($payment.bank_account_number)"
Log "  Name: $($payment.bank_account_name)"
Log "  Amount: $($payment.amount) VND"
Log ""

Log "⏱️  Payment expires at: $($payment.expires_at)"
Log ""
Log "✓ After payment, the webhook will automatically:"
Log "  - Update payment status to 'completed'"
Log "  - Create wallet transaction"
Log "  - Update order status"
Log ""

# Step 6: Wait and check payment status (optional)
Log ""
Log "STEP 6: Check payment status (optional)"
Log "---"

$checkPaymentResult = Test-Api "get-payment" "GET" "/customers/me/payments/$paymentId" $null $headers 200

if ($checkPaymentResult.success) {
    $paymentStatus = $checkPaymentResult.data.data
    Log "✓ Payment status:"
    Log "  Status: $($paymentStatus.status)"
    Log "  Escrow: $($paymentStatus.escrow_status)"
    Log "  Created: $($paymentStatus.created_at)"
}

Log ""
Log "=========================================="
Log "✓ TEST COMPLETE"
Log "=========================================="
Log ""
Log "Next steps:"
Log "1. Open the QR code link above"
Log "2. Scan the QR code or click checkout link"
Log "3. Complete payment on PayOS"
Log "4. The webhook will automatically update the payment status"
Log "5. Check the logs here: $logFile"
Log ""
