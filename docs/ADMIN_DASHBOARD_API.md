# BeeHub – Admin Dashboard API Documentation

## 1. Overview

The **BeeHub Admin Dashboard API** provides endpoints for administrators to monitor and manage the BeeHub platform, including business performance, provider verification, and dispute resolution.

### Main Modules

| Module | Description |
|---|---|
| **Dashboard KPI** | Provides 9+ key performance indicators for monitoring business operations. |
| **Provider Management** | Manages provider verification, approval, and rejection. |
| **Dispute Management** | Handles customer complaints, investigates disputes, and processes resolutions. |

**Base URL:** `http://localhost:3000`

**Authentication:** JWT Bearer Token

All endpoints require an authenticated administrator account unless otherwise specified.

---

## 2. Dashboard KPI

### GET `/api/admin/dashboard`

Retrieves key performance indicators (KPIs) for the administrator dashboard.

**Headers**

```http
Authorization: Bearer <admin_token>
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "gmv_yesterday": 2500000,
    "new_orders_24h": 15,
    "active_customers": 1250,
    "active_providers": 45,
    "commission_total": 375000,
    "completion_rate_24h": 84.44,
    "average_order_value": 167000,
    "new_customers_24h": 8,
    "new_providers_24h": 2,
    "pending_tasks": {
      "verifications": 7,
      "disputes": 3,
      "withdrawals": 5,
      "total": 15
    },
    "generated_at": "2024-06-01T08:30:00Z",
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

### KPI Definitions

| KPI | Description | Calculation |
|---|---|---|
| `gmv_yesterday` | Total transaction value yesterday | SUM of completed order values yesterday |
| `new_orders_24h` | New orders within 24 hours | COUNT of orders created within the last 24 hours |
| `active_customers` | Customers active within 30 days | COUNT DISTINCT customer IDs with orders in the last 30 days |
| `active_providers` | Available and verified providers | COUNT of providers where `is_available = true` and `is_verified = true` |
| `commission_total` | Total platform commission this month | SUM of platform commissions since the beginning of the month |
| `completion_rate_24h` | Order completion rate | (Completed orders / Total orders) × 100 |
| `average_order_value` | Average completed order value | AVG of completed order values |
| `new_customers_24h` | Newly registered customers | COUNT of customers registered within 24 hours |
| `new_providers_24h` | Newly registered providers | COUNT of providers registered within 24 hours |

---

## 3. Provider Management

This module allows administrators to review provider registration information and verify submitted documents before approving or rejecting provider accounts.

### 3.1. Get Pending Providers

**GET** `/api/admin/providers/pending`

Retrieves the list of providers awaiting verification.

**Headers**

```http
Authorization: Bearer <admin_token>
```

### Success Response (200 OK)

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

### 3.2. Verify Provider

**PUT** `/api/admin/providers/:id/verify`

Allows administrators to approve or reject a provider's verification request.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Provider ID |

**Request Body**

```json
{
  "action": "approve",
  "notes": "All submitted documents are complete and valid."
}
```

**Supported Actions**

| Action | Description |
|---|---|
| `approve` | Approves the provider's verification request. |
| `reject` | Rejects the provider's verification request. |

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Provider verified successfully",
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

## 4. Dispute Management

This module enables administrators to review customer complaints, investigate service-related issues, and make appropriate resolution decisions.

### 4.1. Get Dispute List

**GET** `/api/admin/disputes`

Retrieves a paginated list of customer disputes.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `status` | String | `all` | Filter disputes by status. |
| `page` | Integer | `1` | Current page number. |
| `limit` | Integer | `20` | Number of records per page. |

**Supported Statuses**

- `all`
- `open`
- `investigating`
- `resolved`

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dispute_type": "service_quality",
      "subject": "Provider arrived two hours late",
      "description": "The provider was scheduled to arrive at 8 AM but arrived at 10 AM.",
      "status": "open",
      "priority": "normal",
      "evidence_images": [
        "https://image1.jpg",
        "https://image2.jpg"
      ],
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

### 4.2. Get Dispute Details

**GET** `/api/admin/disputes/:id`

Retrieves detailed information about a specific dispute, including:

- Dispute information and current status.
- Related order details.
- Customer and provider information.
- Submitted evidence and images.
- Dispute conversation messages.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Dispute ID |

### 4.3. Resolve Dispute

**PUT** `/api/admin/disputes/:id/resolve`

Allows administrators to resolve a dispute and determine the appropriate action.

**Request Body**

```json
{
  "resolution": "After reviewing the evidence, we have decided to issue a 50% refund because the service did not meet the agreed requirements.",
  "resolution_type": "partial_refund",
  "refund_amount": 150000,
  "internal_notes": "The provider acknowledged the issue, and the customer's complaint is justified."
}
```

**Supported Resolution Types**

| Resolution Type | Description |
|---|---|
| `no_action` | No further action is required. |
| `full_refund` | Issues a full refund to the customer. |
| `partial_refund` | Issues a partial refund to the customer. |
| `provider_penalty` | Applies a penalty to the provider. |

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Dispute resolved successfully",
  "data": {
    "id": "uuid",
    "status": "resolved",
    "resolution": "After reviewing the evidence...",
    "refund_amount": 150000,
    "resolved_by": "admin_uuid",
    "resolved_at": "2024-06-01T11:00:00Z"
  }
}
```

---

## 5. Database Performance Optimization

### 5.1. Required Database Indexes

Execute the SQL script `admin_dashboard_indexes.sql` to improve query performance.

```sql
CREATE INDEX idx_orders_created_at_desc
ON orders(created_at DESC);

CREATE INDEX idx_orders_completed_at_status
ON orders(completed_at, status);

CREATE INDEX idx_provider_profiles_verification
ON provider_profiles(verification_status);

CREATE INDEX idx_disputes_status_created
ON disputes(status, created_at DESC);
```

### 5.2. Expected Query Performance

| Endpoint / Operation | Expected Response Time |
|---|---:|
| Dashboard KPI | ~200 ms |
| Pending Provider List | ~50 ms |
| Dispute List | ~100 ms |

*Note: These are estimated performance targets under suitable database indexing and normal workloads, not guaranteed measurements.*

---

## 6. API Testing with Postman

### 6.1. Import Postman Collection

Import the following files into Postman:

1. `BeeHub_Admin_API.postman_collection.json`
2. `BeeHub_Environment.postman_environment.json`

### 6.2. Recommended Testing Sequence

| Step | Test Case | Description |
|---|---|---|
| 1 | Admin Login | Authenticate as an administrator and save the JWT token. |
| 2 | Dashboard KPI | Retrieve dashboard statistics and business metrics. |
| 3 | Pending Providers | Retrieve providers awaiting verification. |
| 4 | Approve Provider | Approve or reject a provider using `provider_id`. |
| 5 | Get Disputes | Retrieve the dispute list. |
| 6 | Resolve Dispute | Resolve a dispute using `dispute_id`. |

### 6.3. Environment Variables

| Variable | Value | Description |
|---|---|---|
| `base_url` | `http://localhost:3000` | Backend API URL |
| `admin_token` | Auto-saved after login | Administrator JWT token |
| `provider_id` | Manual input | Provider ID for verification |
| `dispute_id` | Manual input | Dispute ID for resolution |

---

## 7. Business Logic and Workflows

### 7.1. Provider Verification Workflow

```text
Provider Registration
        |
        v
Document Upload
        |
        v
Admin Reviews Documents
        |
        v
Approve / Reject
        |
        v
Update Verification Status
        |
        v
Send Notification to Provider
```

### 7.2. Dispute Resolution Workflow

```text
Customer Raises a Dispute
        |
        v
Admin Receives Dispute
        |
        v
Admin Investigates the Case
        |
        v
Resolution Decision
        |
        v
Refund / Penalty / No Action
        |
        v
Update Dispute Status
        |
        v
Notify Relevant Parties
```

### 7.3. Platform Commission Calculation

- **Default Platform Commission:** 15%.
- **Configuration:** Managed through the `platform_settings` table.
- **Calculation:** Automatically calculated when payment is completed.

Example:

```text
Order Total:       1,000,000 VND
Commission Rate:   15%
Platform Revenue:    150,000 VND
Provider Earnings:  850,000 VND
```

---

## 8. Security Features

All administrative endpoints should implement the following security mechanisms:

| Security Feature | Description |
|---|---|
| Admin-only Access | Restricts access to users with the `admin` role. |
| JWT Authentication | Validates access tokens through Bearer authentication. |
| Input Validation | Validates request parameters and body data. |
| Audit Trail | Records administrative actions together with the administrator's ID. |
| Rate Limiting | Limits excessive API requests to protect the system. |

---

## 9. Monitoring and Alerts

### 9.1. Recommended Monitoring Rules

| Condition | Alert | Description |
|---|---|---|
| `pending_tasks.total > 20` | High Workload | Too many pending administrative tasks. |
| `completion_rate_24h < 70%` | Service Quality Warning | Order completion rate is below the expected threshold. |
| `new_orders_24h = 0` | No New Orders | No new orders have been created within 24 hours. |
| `active_providers < 10` | Supply Shortage | Insufficient active providers on the platform. |

### 9.2. Dashboard Refresh Mechanisms

| Method | Description |
|---|---|
| Real-time Updates | WebSocket-based updates when dashboard data changes. |
| Automatic Polling | Refreshes dashboard data every 30 seconds. |
| Manual Refresh | Allows administrators to manually refresh dashboard statistics. |

---

## 10. API Summary

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Retrieve dashboard KPIs. |
| GET | `/api/admin/providers/pending` | Get providers awaiting verification. |
| PUT | `/api/admin/providers/:id/verify` | Approve or reject a provider. |
| GET | `/api/admin/disputes` | Get paginated dispute list. |
| GET | `/api/admin/disputes/:id` | Get dispute details and messages. |
| PUT | `/api/admin/disputes/:id/resolve` | Resolve a dispute. |

---

**BeeHub Admin Dashboard API**  
*WDP301 – Group 4*  
*Admin Dashboard | Provider Management | Dispute Resolution*