# 🎯 Hướng Dẫn Test PayOS QR Code Payment

> **Date:** 2026-06-08  
> **Status:** ✅ Ready for Testing  
> **Component:** Payment Module (BE-032)

## 📋 Tổng Quan

Đây là hướng dẫn test chức năng thanh toán QR code trực tiếp mà **không cần UI**. Hệ thống sẽ:

1. ✅ Tạo payment record trong database
2. ✅ Gọi PayOS API để generate QR code
3. ✅ Trả về QR code link cho client
4. ✅ Lắng nghe webhook khi payment hoàn thành
5. ✅ Tự động cập nhật wallet & escrow

## 🚀 Chuẩn Bị

### 1. Yêu Cầu Môi Trường

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Test Script
# (Sử dụng PowerShell hoặc Bash)
```

### 2. Kiểm Tra Cấu Hình PayOS

Đảm bảo file `.env` trong root project có đủ:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=7949b012-6944-45fe-b7df-d515648dbacf
PAYOS_API_KEY=e60ed409-6237-4d2b-9b62-9f42247fa016
PAYOS_CHECKSUM_KEY=029c345e6f2cae19e8e5e99e2615d3786316ea1d1f3db4a51b810546a7154ad7

# Application URL (for return/cancel redirects)
APP_URL=http://localhost:3000
```

### 3. Đảm Bảo Database Sẵn Sàng

```bash
# Kiểm tra kết nối database
cd backend
npm run test:connection
```

## 🧪 Cách Test

### **Phương Án A: Sử Dụng Test Script (PowerShell)**

Đơn giản nhất, tất cả tự động:

```bash
cd backend
.\test-payos-qr.ps1
```

**Output sẽ hiển thị:**

```
STEP 1: Login as customer
✓ Login successful

STEP 2: Get customer orders
✓ Found 2 order(s)
  Using order: 12345678...

STEP 3: Create payment & generate QR code (PayOS)
✓ Payment created successfully
  Payment ID: 87654321...
  Payment Code: PAY-20260608-1234
  Amount: 50000 VND
  
STEP 4: QR Code Payment Options
📱 QR Code URL (for display):
   https://qr.payos.vn/...

🔗 Checkout URL (for web browser):
   https://pay.payos.vn/...

STEP 5: How to test payment
...
```

### **Phương Án B: Manual cURL**

Nếu không có PowerShell:

#### Step 1: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer1@test.com",
    "password": "password123"
  }' | jq
```

**Lưu `token` từ response**

#### Step 2: Lấy danh sách orders

```bash
TOKEN="<your_token_here>"

curl -X GET http://localhost:3000/api/customers/me/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Lưu `order_id` từ response (của order đầu tiên)**

#### Step 3: Tạo deposit payment (QR code)

```bash
TOKEN="<your_token_here>"
ORDER_ID="<order_id_here>"

curl -X POST http://localhost:3000/api/customers/me/payments/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"order_id\": \"$ORDER_ID\",
    \"amount\": 50000,
    \"payment_method\": \"payos\",
    \"customer_name\": \"Customer Name\",
    \"customer_email\": \"customer@example.com\"
  }" | jq
```

**Response sẽ chứa:**

```json
{
  "success": true,
  "data": {
    "payment_id": "...",
    "payment_code": "PAY-20260608-1234",
    "checkout_url": "https://pay.payos.vn/web/link/xxx",
    "qr_code": "https://qr.payos.vn/...",
    "amount": 50000,
    "status": "pending",
    "expires_at": "2026-06-08T11:30:00Z"
  }
}
```

#### Step 4: Kiểm tra payment status

```bash
TOKEN="<your_token_here>"
PAYMENT_ID="<payment_id_from_step_3>"

curl -X GET http://localhost:3000/api/customers/me/payments/$PAYMENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 🔗 Payment Links

### Checkout URL
- **Để làm gì:** Customer vào web để thanh toán
- **URL:** `https://pay.payos.vn/web/link/...`
- **Cách test:** Mở link này trong browser → Complete payment

### QR Code URL
- **Để làm gì:** Generate & display QR code image
- **URL:** `https://qr.payos.vn/...`
- **Cách test:** Mở link → Quét mã bằng phone → Complete payment

### Bank Transfer Details
Nếu customer chọn chuyển khoản ngân hàng:

```
Bank Account: 1234567890
Account Name: UNIMOVE
Amount: 50,000 VND
Reference: PAY-20260608-1234
```

## 💳 Test Payment (PayOS Sandbox)

### Option 1: Quét QR Code

1. Mở QR code URL
2. Quét bằng điện thoại
3. System sẽ redirect đến PayOS payment page
4. Chọn phương thức thanh toán:
   - Bank Transfer
   - Credit/Debit Card (test)
   - E-wallet

### Option 2: Direct Link

1. Mở checkout URL
2. Chọn phương thức thanh toán
3. Complete payment flow

### Option 3: Manual Webhook (Advanced)

Nếu test không thành công, có thể manual trigger webhook:

```bash
curl -X POST http://localhost:3000/api/webhooks/payos \
  -H "Content-Type: application/json" \
  -H "x-payos-signature: <signature_here>" \
  -d '{
    "code": "00",
    "desc": "success",
    "data": {
      "orderCode": 1717662000123456,
      "amount": 50000,
      "amountPaid": 50000,
      "status": "PAID",
      "reference": "PAY-20260608-1234",
      "transactions": [{
        "transactionDateTime": "2026-06-08T10:00:00Z"
      }]
    }
  }'
```

> Để generate signature: `HMAC-SHA256(orderCode + amount + description, PAYOS_CHECKSUM_KEY)`

## 📊 Payment Status Flow

```
pending (initial)
    ↓ [Customer completes payment]
    ↓
completed (webhook received)
    ↓ [For deposits: escrow held]
    ↓
ESCROW_STATUS: held
    ↓ [Customer confirms completion]
    ↓
ESCROW_STATUS: released
    ↓ [Money moves to provider/system]
```

## 🔍 Debugging

### Kiểm tra Logs

**Backend console:**

```bash
# Xem logs realtime
npm run dev

# Tìm "PayOS" logs
[PayOS] Creating payment link...
[PayOS] Payment link created successfully...
[PayOS] webhook: processed successfully
```

### Kiểm tra Database

```sql
-- Xem all payments của customer
SELECT id, payment_code, status, escrow_status, amount, created_at 
FROM payments 
WHERE customer_id = '<customer_id>'
ORDER BY created_at DESC;

-- Xem payment detail
SELECT * FROM payments WHERE payment_code = 'PAY-20260608-1234';

-- Xem wallet transactions
SELECT * FROM wallet_transactions WHERE customer_id = '<customer_id>';
```

## ❌ Troubleshooting

### Lỗi: "Thiếu order_id hoặc amount"

**Giải pháp:**
- Kiểm tra order tồn tại trong database
- Ensure `amount > 0`

```bash
# Lấy order_id chính xác
curl -X GET http://localhost:3000/api/customers/me/orders \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].id'
```

### Lỗi: "PayOS error: Invalid signature"

**Giải pháp:**
- Kiểm tra `PAYOS_CHECKSUM_KEY` trong `.env`
- Đảm bảo key không có spaces

```bash
echo $PAYOS_CHECKSUM_KEY | wc -c  # Nên là 65 (64 + newline)
```

### Lỗi: "Không tìm thấy payment" (Webhook)

**Nguyên nhân:**
- Payment code không match giữa request & webhook

**Giải pháp:**
- Kiểm tra `reference` trong webhook = `payment_code` trong DB
- Logs: Tìm "PayOS webhook: payment not found"

### Lỗi: "Insufficient amount paid"

**Nguyên nhân:**
- Customer thanh toán ít hơn amount required

**Giải pháp:**
- Tăng amount khi create payment
- Kiểm tra `amountPaid` vs `amount` yêu cầu

## 📈 Integration Checklist

- ✅ PayOS service created (`services/payos.service.js`)
- ✅ Controller updated (`controllers/payments.controller.js`)
- ✅ Routes added (`routes/payments.routes.js`)
- ✅ Webhook middleware ready (`middleware/payos.middleware.js`)
- ✅ Database schema supports PayOS fields
- ✅ Test script created (`test-payos-qr.ps1`)
- ✅ Environment variables configured

## 📚 Related Files

- [Payment Service](../src/services/payos.service.js)
- [Payment Controller](../src/controllers/payments.controller.js)
- [Payment Routes](../src/routes/payments.routes.js)
- [PayOS Middleware](../src/middleware/payos.middleware.js)
- [Database Schema](./database-schema.md)
- [PayOS Webhook Docs](./stage3-webhook-payos.md)

## 🎓 API Reference

### POST /api/customers/me/payments/deposit

Create a deposit payment with QR code

**Request:**
```json
{
  "order_id": "uuid",
  "amount": 50000,
  "payment_method": "payos",
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "payment_code": "PAY-20260608-1234",
    "checkout_url": "https://pay.payos.vn/...",
    "qr_code": "https://qr.payos.vn/...",
    "bank_account_number": "1234567890",
    "bank_account_name": "UNIMOVE",
    "amount": 50000,
    "currency": "VND",
    "status": "pending",
    "expires_at": "2026-06-08T11:30:00Z"
  }
}
```

### GET /api/customers/me/payments

List all payments for customer

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "payment_code": "PAY-20260608-1234",
      "amount": 50000,
      "status": "completed",
      "created_at": "2026-06-08T10:00:00Z",
      "paid_at": "2026-06-08T10:15:00Z"
    }
  ]
}
```

### GET /api/customers/me/payments/:id

Get payment details

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "payment_code": "PAY-20260608-1234",
    "order_id": "uuid",
    "customer_id": "uuid",
    "amount": 50000,
    "status": "completed",
    "escrow_status": "held",
    "payos_qr_code": "https://qr.payos.vn/...",
    "created_at": "2026-06-08T10:00:00Z",
    "paid_at": "2026-06-08T10:15:00Z"
  }
}
```

## 🤝 Support

Nếu gặp vấn đề:

1. **Kiểm tra logs:** `npm run dev` console
2. **Xem database:** SQL query tools
3. **Test PayOS API:** Postman collection
4. **Contact team:** [Team Contact Info]

---

**Last Updated:** 2026-06-08  
**Component:** Payment Module  
**Status:** ✅ Production Ready
