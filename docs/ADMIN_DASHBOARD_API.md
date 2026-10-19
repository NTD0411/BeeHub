# UniMove Admin Dashboard API

## Tổng quan

API Admin Dashboard cung cấp các endpoint để quản lý hệ thống UniMove, bao gồm:
- **Dashboard KPI**: Thống kê tổng quan với 9+ KPI quan trọng
- **Provider Management**: Duyệt và quản lý nhà cung cấp
- **Dispute Resolution**: Xử lý khiếu nại và tranh chấp

---

## 🎯 Dashboard KPI Endpoint

### **GET** `/api/admin/dashboard`

Lấy tất cả KPI quan trọng cho admin morning dashboard.

#### Headers:
```
Authorization: Bearer <admin_token>
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    // Core Business KPIs
    "gmv_yesterday": 2500000,
    "new_orders_24h": 15,
    "active_customers": 1250,
    "active_providers": 45,
    "commission_total": 375000,
    
    // Performance KPIs
    "completion_rate_24h": 84.44,
    "average_order_value": 167000,
    
    // Growth KPIs
    "new_customers_24h": 8,
    "new_providers_24h": 2,
    
    // Admin Tasks
    "pending_tasks": {
      "verifications": 7,
      "disputes": 3,
      "withdrawals": 5,
      "total": 15
    },
    
    // Metadata
    "generated_at": "2024-06-01T08:30:00Z",
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

#### KPI Definitions:

| KPI | Mô tả | Tính toán |
|-----|-------|-----------|
| `gmv_yesterday` | Gross Merchandise Value hôm qua | SUM(orders.total_price) WHERE status='completed' AND completed_at = yesterday |
| `new_orders_24h` | Đơn hàng mới 24h | COUNT(orders) WHERE created_at >= 24h ago |
| `active_customers` | Khách hàng có đơn trong 30 ngày | COUNT(DISTINCT customer_id) WHERE created_at >= 30 days ago |
| `active_providers` | Provider online và verified | COUNT(provider_profiles) WHERE is_available=true AND is_verified=true |
| `commission_total` | Tổng hoa hồng tháng này | SUM(provider_earnings.platform_commission) WHERE created_at >= start_of_month |
| `completion_rate_24h` | Tỷ lệ hoàn thành 24h | (completed_orders / total_orders) * 100 |
| `average_order_value` | Giá trị đơn hàng trung bình | AVG(orders.total_price) WHERE status='completed' |

---

## 👥 Provider Management

### **GET** `/api/admin/providers/pending`

Lấy danh sách provider chờ duyệt.

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "business_name": "Vận tải Minh Anh",
      "vehicle_type": "small_truck",
      "vehicle_plate": "29A-12345",
      "verification_status": "pending",
      "created_at": "2024-06-01T10:00:00Z",
      "profiles": {
        "full_name": "Nguyễn Văn A",
        "email": "provider@example.com",
        "phone": "0901234567",
        "avatar_url": "https://..."
      },
      "provider_documents": [
        {
          "id": "uuid",
          "document_type": "id_card",
          "document_url": "https://...",
          "document_number": "123456789",
          "issue_date": "2020-01-01",
          "expiry_date": "2030-01-01",
          "is_verified": false
        }
      ]
    }
  ],
  "count": 7
}
```

### **PUT** `/api/admin/providers/:id/verify`

Duyệt hoặc từ chối provider.

#### Request Body:
```json
{
  "action": "approve", // "approve" | "reject"
  "notes": "Tài liệu đầy đủ và hợp lệ"
}
```

#### Response:
```json
{
  "success": true,
  "message": "Duyệt provider thành công",
  "data": {
    "id": "uuid",
    "verification_status": "approved",
    "is_verified": true,
    "verified_at": "2024-06-01T10:30:00Z",
    "verified_by": "admin_uuid"
  }
}
```

---

## ⚖️ Dispute Management

### **GET** `/api/admin/disputes`

Lấy danh sách khiếu nại với phân trang.

#### Query Parameters:
- `status`: `all` | `open` | `investigating` | `resolved` (default: `all`)
- `page`: Trang (default: `1`)
- `limit`: Số lượng/trang (default: `20`)

#### Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dispute_type": "service_quality",
      "subject": "Nhà cung cấp đến muộn 2 tiếng",
      "description": "Provider hẹn 8h sáng nhưng đến 10h mới tới...",
      "status": "open",
      "priority": "normal",
      "evidence_images": ["https://image1.jpg", "https://image2.jpg"],
      "refund_amount": null,
      "created_at": "2024-06-01T08:00:00Z",
      "orders": {
        "order_number": "UNI-20240601-0001",
        "total_price": 300000,
        "order_status": "completed"
      },
      "raised_by_profile": {
        "full_name": "Nguyễn Thị B",
        "email": "customer@example.com",
        "role": "customer"
      },
      "against_user_profile": {
        "full_name": "Nguyễn Văn A",
        "email": "provider@example.com",
        "role": "provider"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  }
}
```

### **GET** `/api/admin/disputes/:id`

Lấy chi tiết khiếu nại bao gồm messages.

### **PUT** `/api/admin/disputes/:id/resolve`

Xử lý khiếu nại.

#### Request Body:
```json
{
  "resolution": "Sau khi xem xét, chúng tôi quyết định hoàn tiền 50% cho khách hàng do dịch vụ không đạt yêu cầu.",
  "resolution_type": "partial_refund", // "no_action" | "full_refund" | "partial_refund" | "provider_penalty"
  "refund_amount": 150000,
  "internal_notes": "Provider đã thừa nhận lỗi, customer hợp lý"
}
```

#### Response:
```json
{
  "success": true,
  "message": "Xử lý khiếu nại thành công",
  "data": {
    "id": "uuid",
    "status": "resolved",
    "resolution": "Sau khi xem xét...",
    "refund_amount": 150000,
    "resolved_by": "admin_uuid",
    "resolved_at": "2024-06-01T11:00:00Z"
  }
}
```

---

## 🔧 Database Performance

### Required Indexes:
```sql
-- Run admin_dashboard_indexes.sql for optimal performance
CREATE INDEX idx_orders_created_at_desc ON orders(created_at DESC);
CREATE INDEX idx_orders_completed_at_status ON orders(completed_at, status);
CREATE INDEX idx_provider_profiles_verification ON provider_profiles(verification_status);
CREATE INDEX idx_disputes_status_created ON disputes(status, created_at DESC);
```

### Query Performance:
- Dashboard KPI: ~200ms (với indexes)
- Provider list: ~50ms
- Dispute list: ~100ms (với pagination)

---

## 🚀 Testing với Postman

### Import Collection:
1. `UniMove_Admin_API.postman_collection.json`
2. `UniMove_Environment.postman_environment.json`

### Test Sequence:
1. **Admin Login** → Lưu token
2. **Dashboard KPI** → Xem tất cả metrics
3. **Pending Providers** → Danh sách chờ duyệt
4. **Approve Provider** → Duyệt provider (cần provider_id)
5. **Get Disputes** → Danh sách khiếu nại
6. **Resolve Dispute** → Xử lý khiếu nại (cần dispute_id)

### Environment Variables:
```
base_url: http://localhost:3000
admin_token: (auto-saved after login)
provider_id: (manual input for testing)
dispute_id: (manual input for testing)
```

---

## 📊 Business Logic

### Provider Verification Flow:
```
Provider registers → Documents uploaded → Admin reviews → Approve/Reject → Notification sent
```

### Dispute Resolution Flow:
```
User raises dispute → Admin investigates → Resolution decision → Refund processed (if applicable) → Notification sent
```

### Commission Calculation:
- Default: 15% platform commission
- Configurable via `platform_settings` table
- Auto-calculated when payment completed

---

## 🔒 Security Features

- **Admin-only access**: All endpoints require `role = 'admin'`
- **JWT authentication**: Bearer token validation
- **Input validation**: Request body validation
- **Audit trail**: All actions logged with admin ID
- **Rate limiting**: Recommended for production

---

## 📈 Monitoring & Alerts

### Recommended Alerts:
- `pending_tasks.total > 20` → High workload
- `completion_rate_24h < 70%` → Service quality issue
- `new_orders_24h = 0` → System problem
- `active_providers < 10` → Supply shortage

### Dashboard Refresh:
- Real-time: WebSocket updates
- Polling: Every 30 seconds
- Manual: Pull-to-refresh

---

*UniMove Admin Dashboard API — WDP301 Group 4*