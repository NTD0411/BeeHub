# UniMove — Screen Flow Diagrams

> Diagrams được tổ chức theo từng role. Mỗi section chứa Mermaid diagram có thể render trực tiếp trong GitHub, VS Code (Markdown Preview Mermaid) hoặc [mermaid.live](https://mermaid.live).

---

## Role 1 — GUEST (Khách chưa đăng nhập)

```mermaid
flowchart TD
    LP["🌐 Landing Page\n(/)"]

    LP --> REF["Reference Prices\n(/reference-prices)"]
    LP --> PUB["Provider Public Profile\n(/nha-xe/[id])"]
    LP --> FAQ["FAQ & Contact"]

    LP --> LG["Login\n(/dang-nhap)"]
    LP --> RG["Customer Register\n(/dang-ky)"]
    LP --> RP["Provider Register\n(/dang-ky-tai-xe)"]
    LP --> FP["Forgot Password\n(/quen-mat-khau)"]

    FP --> RST["Reset Password\n(nhập OTP + mật khẩu mới)"]
    RST -->|"✅ Thành công"| LG

    LG -->|"✅ Đăng nhập"| HOME_C["→ Customer App\n(Home Tab)"]
    LG -->|"✅ Provider"| HOME_P["→ Provider Dashboard"]
    LG -->|"✅ Admin"| HOME_A["→ Admin Dashboard"]

    RG -->|"✅ Tạo tài khoản"| HOME_C
    RP -->|"✅ Đăng ký"| CHO_DUYET["Pending Verification\n(/cho-duyet)"]

    style LP fill:#e8f4fd,stroke:#2196F3
    style LG fill:#fff3e0,stroke:#FF9800
    style RG fill:#fff3e0,stroke:#FF9800
    style RP fill:#fff3e0,stroke:#FF9800
    style FP fill:#fff3e0,stroke:#FF9800
    style RST fill:#fff3e0,stroke:#FF9800
    style CHO_DUYET fill:#fce4ec,stroke:#E91E63
```

---

## Role 2 — CUSTOMER (Sinh viên đặt dịch vụ)

### 2a. Authentication + App Shell

```mermaid
flowchart TD
    LOGIN["Login / Register"]
    LOGIN -->|"✅"| SHELL["📱 Customer App Shell\n(Bottom Navigation)"]

    SHELL --> HOME_TAB["🏠 Home Tab\n(/trang-chu)"]
    SHELL --> ACT_TAB["📋 Activity Tab\n(/hoat-dong)"]
    SHELL --> MSG_TAB["💬 Messages Tab\n(/tin-nhan)"]
    SHELL --> PRF_TAB["👤 Profile\n(/tai-khoan)"]
    SHELL --> MKT["🛒 Chợ Sinh Viên\n(/cho-sinh-vien)"]

    style SHELL fill:#e8f5e9,stroke:#4CAF50,stroke-width:2px
    style HOME_TAB fill:#e8f5e9,stroke:#4CAF50
    style ACT_TAB fill:#e8f5e9,stroke:#4CAF50
    style MSG_TAB fill:#e8f5e9,stroke:#4CAF50
    style PRF_TAB fill:#e8f5e9,stroke:#4CAF50
    style MKT fill:#e8f5e9,stroke:#4CAF50
```

### 2b. Booking Flow — Chuyển nhà Combo / Standard

```mermaid
flowchart TD
    HOME["Home Tab"]

    HOME --> LOC["Choose Location\n(/dat-chuyen/dia-diem)"]
    LOC --> DORM["Move Dorm Details\n(/dat-chuyen/phong-tro)\nSố tầng, thang máy, danh sách đồ"]
    DORM --> SCHED["Move Schedule\n(/dat-chuyen/lich-hen)\nChọn ngày giờ"]
    SCHED --> PKGS["Service Packages\n(/dat-chuyen/goi-dich-vu)\nEconomy / Standard / Premium"]

    PKGS -->|"Combo Package"| INS["Insurance Selection\nChọn gói bảo hiểm"]
    PKGS -->|"Standard"| PARTNER["Choose Partner\n(/dat-chuyen/doi-tac)\nLọc theo giá, đánh giá, khoảng cách"]

    PARTNER --> INS
    INS --> PAY["Payment / Checkout\n(/dat-chuyen/thanh-toan)\nTóm tắt đơn + mã KM + PayOS deposit"]

    PAY -->|"✅ Thanh toán"| SUCCESS["Payment Success\n(/payment-success)"]
    PAY -->|"❌ Huỷ"| CANCEL["Payment Cancel\n(/payment-cancel)"]
    SUCCESS --> TRACK["Order Tracking\n(/don-hang/[id])\nBản đồ live + ETA + Timeline"]

    style LOC fill:#e3f2fd,stroke:#1976D2
    style DORM fill:#e3f2fd,stroke:#1976D2
    style SCHED fill:#e3f2fd,stroke:#1976D2
    style PKGS fill:#e3f2fd,stroke:#1976D2
    style PARTNER fill:#e3f2fd,stroke:#1976D2
    style INS fill:#e3f2fd,stroke:#1976D2
    style PAY fill:#fff9c4,stroke:#F9A825
    style SUCCESS fill:#e8f5e9,stroke:#388E3C
    style CANCEL fill:#fce4ec,stroke:#C62828
    style TRACK fill:#e8f5e9,stroke:#388E3C
```

### 2c. Quotation Flow — Đặt theo báo giá

```mermaid
flowchart TD
    HOME["Home Tab"]
    HOME --> LOC2["Choose Location"]
    LOC2 --> DORM2["Move Dorm Details"]
    DORM2 -->|"Chọn Quotation"| SUBMIT["Submit Quote Request"]
    SUBMIT --> PROG["Quote Progress\n(/dat-chuyen/bao-gia/[orderId])\nChờ nhà xe phản hồi"]

    PROG -->|"Nhà xe gửi báo giá"| QD["Provider Quote Detail\n(/don-hang/[id]/bao-gia)\nXem giá + phân tích chi phí"]
    QD -->|"✅ Chấp nhận"| QS["Quote Move Schedule\nChọn lịch sau khi đồng ý"]
    QD -->|"❌ Từ chối"| PROG
    QS --> PAY2["Payment"]
    PAY2 --> TRACK2["Order Tracking"]

    style PROG fill:#f3e5f5,stroke:#7B1FA2
    style QD fill:#f3e5f5,stroke:#7B1FA2
    style QS fill:#f3e5f5,stroke:#7B1FA2
```

### 2d. Labor Service Flow — Khuân vác đơn lẻ

```mermaid
flowchart TD
    HOME["Home Tab"]
    HOME --> LABOR_ENTRY["Labor Service Entry\n(/dat-chuyen/khuan-vac)"]
    LABOR_ENTRY --> LABOR_ORDER["Labor Order Picker\nGắn vào đơn chuyển có sẵn"]
    LABOR_ORDER --> LABOR_CFG["Labor Configure\n(/dat-chuyen/khuan-vac/cau-hinh)\nSố người, số giờ, tầng"]
    LABOR_CFG --> LABOR_PROV["Labor Providers\nChọn nhóm khuân vác"]
    LABOR_PROV --> PAY3["Payment"]
    PAY3 --> TRACK3["Order Tracking"]

    style LABOR_ENTRY fill:#e0f7fa,stroke:#00838F
    style LABOR_ORDER fill:#e0f7fa,stroke:#00838F
    style LABOR_CFG fill:#e0f7fa,stroke:#00838F
    style LABOR_PROV fill:#e0f7fa,stroke:#00838F
```

### 2e. Order Management + After-Order

```mermaid
flowchart TD
    ACT["Activity Tab\n(/hoat-dong)"]
    ACT --> ORD_DETAIL["Order Detail\n(/don-hang/[id])"]

    ORD_DETAIL --> TRACKING["Order Tracking\nBản đồ live + vị trí nhà xe"]
    ORD_DETAIL --> ORD_CHAT["Order Chat"]
    ORD_DETAIL --> REPORT["Report Incident\n(/don-hang/[id]/bao-cao-su-co)"]
    ORD_DETAIL -->|"Hoàn thành"| REVIEW["Review Trip\n(/don-hang/[id]/danh-gia)\nĐánh giá sao + nhận xét"]

    style ORD_DETAIL fill:#e8f5e9,stroke:#2E7D32
    style TRACKING fill:#e8f5e9,stroke:#2E7D32
    style REVIEW fill:#fff9c4,stroke:#F57F17
    style REPORT fill:#fce4ec,stroke:#B71C1C
```

### 2f. Profile + Payment Management

```mermaid
flowchart TD
    PRF["Profile\n(/tai-khoan)"]

    PRF --> EDIT_PRF["Edit Profile\n(/tai-khoan/chinh-sua)"]
    PRF --> CHG_PWD["Change Password\n(/tai-khoan/doi-mat-khau)"]
    PRF --> ORD_HIST["Order History\n(/don-hang)"]
    PRF --> PAY_SETTINGS["Payment Settings\n(/tai-khoan/thanh-toan)"]
    PRF --> NOTIF["Notifications\n(/thong-bao)"]

    ORD_HIST --> ORD_DETAIL["Order Detail"]

    PAY_SETTINGS --> PAY_METHODS["Payment Methods\nDanh sách thẻ / ví"]
    PAY_METHODS --> ADD_CARD["Add Card"]
    PAY_METHODS --> LINK_PAY["Link Payment Method\n(MoMo, PayOS)"]
    PAY_SETTINGS --> PAY_HIST["Payment History"]
    PAY_HIST --> PAY_DETAIL["Payment Detail\nSố tiền + trạng thái + mã PayOS"]

    NOTIF --> NOTIF_DETAIL["Notification Detail"]

    style PRF fill:#e8f5e9,stroke:#4CAF50
```

### 2g. Marketplace — Chợ Sinh Viên (Pass đồ)

```mermaid
flowchart TD
    MKT["🛒 Marketplace Home\n(/cho-sinh-vien)"]

    MKT --> TAB_SALE["TAB: Items for Sale\n(/cho-sinh-vien/dang-ban)"]
    MKT --> TAB_FAV["TAB: Favorites\n(/cho-sinh-vien/yeu-thich)"]
    MKT --> TAB_MINE["TAB: My Listings\n(/cho-sinh-vien/tin-cua-toi)"]

    TAB_SALE --> LST_DETAIL["Listing Detail\n(/cho-sinh-vien/[id])"]
    TAB_FAV --> LST_DETAIL
    LST_DETAIL --> LST_CHAT["Listing Chat\n(/cho-sinh-vien/[id]/chat)\nThương lượng + đề xuất giá"]
    LST_DETAIL --> SELLER_PRF["Seller Profile\nUy tín + danh sách bán"]
    LST_CHAT -->|"✅ Chốt deal"| TRANSPORT_OPT["Pass Item Transport Options\nChọn địa chỉ & phương thức vận chuyển"]
    TRANSPORT_OPT --> BOOKING["→ Move Booking Flow"]

    TAB_MINE --> CREATE["Create Listing\n(/cho-sinh-vien/dang-tin)\nẢnh + mô tả + giá + khu vực"]
    CREATE -->|"Cần phí đăng"| LST_FEE["Listing Fee Payment\nPayOS"]
    LST_FEE -->|"✅"| PUBLISHED["Tin đã đăng"]
    CREATE -->|"Miễn phí"| PUBLISHED
    TAB_MINE --> LST_DETAIL

    style MKT fill:#fff3e0,stroke:#E65100
    style LST_CHAT fill:#fff3e0,stroke:#E65100
    style CREATE fill:#fff3e0,stroke:#E65100
```

---

## Role 3 — PROVIDER (Nhà xe / Tài xế)

### 3a. Authentication + Onboarding

```mermaid
flowchart TD
    LP["Landing Page"] --> LG_P["Login\n(/dang-nhap)"]
    LP --> REG_P["Provider Register\n(/dang-ky-tai-xe)"]

    REG_P -->|"✅"| CHO_DUYET["⏳ Pending Verification\n(/cho-duyet)"]
    CHO_DUYET --> DOCS["Documents Upload\n(/tai-xe/giay-to)\nCMND, GPLX, Đăng kiểm, Bảo hiểm"]
    DOCS --> WAIT["Chờ Admin duyệt"]
    WAIT -->|"✅ Approved"| P_SHELL["Provider App Shell"]
    WAIT -->|"❌ Rejected"| DOCS

    LG_P -->|"✅ Verified"| P_SHELL
    LG_P -->|"✅ Pending"| CHO_DUYET

    style CHO_DUYET fill:#fce4ec,stroke:#C62828
    style DOCS fill:#fce4ec,stroke:#C62828
    style P_SHELL fill:#e8eaf6,stroke:#3F51B5,stroke-width:2px
```

### 3b. Provider App Shell + Orders

```mermaid
flowchart TD
    P_SHELL["📱 Provider App Shell\n(Dashboard / Orders / Earnings / Messages / Profile)"]

    P_SHELL --> DASH["📊 Dashboard Tab\n(/tai-xe/tong-quan)\nDoanh thu hôm nay, Đơn chờ, Shortcuts"]
    P_SHELL --> ORDERS["📦 Orders Tab\n(/orders)\nIncoming / Active / History"]
    P_SHELL --> EARN["💰 Earnings Tab\n(/tai-xe/thu-nhap)"]
    P_SHELL --> MSG_P["💬 Messages Tab\n(/tai-xe/tin-nhan)"]
    P_SHELL --> PRF_P["👤 Profile Tab"]

    ORDERS --> ORD_D["Order Detail\n(/orders/[id])\nThông tin KH, địa chỉ, giá, trạng thái"]
    ORD_D -->|"✅ Chấp nhận"| TRACKING_P["Order Tracking (Provider)\nBản đồ + cập nhật vị trí real-time"]
    ORD_D -->|"❌ Từ chối"| ORDERS
    ORD_D --> CHAT_P["Order Chat"]
    TRACKING_P -->|"✅ Hoàn thành"| DONE["Chờ KH đánh giá"]

    ORDERS -->|"Báo giá"| QUOTE_P["Provider Quote Detail\n(/don-hang/[id]/bao-gia)\nGửi báo giá với giá + mô tả"]
    QUOTE_P -->|"KH chấp nhận"| ORD_D

    style P_SHELL fill:#e8eaf6,stroke:#3F51B5,stroke-width:2px
    style TRACKING_P fill:#e8eaf6,stroke:#3F51B5
    style QUOTE_P fill:#f3e5f5,stroke:#7B1FA2
```

### 3c. Provider Profile + Earnings

```mermaid
flowchart TD
    PRF_P["Profile Tab"]

    PRF_P --> EDIT_P["Edit Profile\n(/profile/edit)"]
    PRF_P --> CHG_P["Change Password"]
    PRF_P --> DOCS_P["Documents / Verification\n(/tai-xe/giay-to)"]
    PRF_P --> SCHED_P["Schedule Management\n(/tai-xe/lich)\nLịch nhận đơn theo ngày"]
    PRF_P --> REVIEWS_P["Reviews Received\nĐánh giá từ khách + phản hồi"]
    PRF_P --> PUB_P["Public Profile\nXem như khách hàng nhìn"]
    PRF_P --> NOTIF_P["Notifications\n(/tai-xe/thong-bao)"]

    EARN_TAB["Earnings Tab"] --> EARN_HIST["Earnings History\nLịch sử giao dịch"]
    EARN_TAB --> PAYOUT["Payout Settings\nSố tài khoản rút tiền"]

    NOTIF_P --> NOTIF_D_P["Notification Detail"]

    style PRF_P fill:#e8eaf6,stroke:#3F51B5
    style EARN_TAB fill:#e8eaf6,stroke:#3F51B5
```

---

## Role 4 — ADMIN (Quản trị viên)

```mermaid
flowchart TD
    ADMIN_LOGIN["🔐 Admin Login\n(/admin)"]
    ADMIN_LOGIN -->|"✅"| DASH_A["📊 Dashboard Overview\n(/admin/dashboard)\nKPI + Revenue Charts + Latest Orders"]

    DASH_A --> USER_MGMT["👥 User Management\n(/admin/users)\nSearch, Suspend, Activate"]
    DASH_A --> VERIF["✅ Provider Verification\n(/admin/verifications)\nReview documents queue"]
    DASH_A --> ORD_MGMT["📦 Order Management\n(/admin/orders)\nAll orders, filters by status/date"]
    DASH_A --> DISPUTES["⚖️ Disputes & Refunds\n(/admin/disputes)\nCustomer complaints + evidence"]
    DASH_A --> REVIEWS_A["📝 Review Management\n(/admin/reviews)\nHide / Unhide / Flag"]
    DASH_A --> ANALYTICS["📈 Analytics\n(/admin/analytics)\nRevenue, GMV, Provider performance"]
    DASH_A --> NOTIF_A["🔔 Notification Management\n(/admin/notifications)\nBroadcast announcements"]
    DASH_A --> LOGS["📋 Activity Logs\n(/admin/activity-logs)\nAudit trail mọi hành động"]
    DASH_A --> SETTINGS["⚙️ Platform Settings\n(/admin/settings)\nCommission, theme, config"]
    DASH_A --> FINANCE["💳 Finance Overview\n(/admin/finance)"]
    DASH_A --> PASS_DO["🛒 Marketplace Moderation\n(/admin/pass-do)"]
    DASH_A --> ADMIN_PRF["👤 Admin Profile\n(/admin/profile)"]

    USER_MGMT -->|"Click user"| USER_D["User Detail\nXem đơn hàng, lịch sử"]
    USER_D --> SUSPEND["Suspend Account"]
    USER_D --> ACTIVATE["Activate Account"]

    VERIF --> DOC_REVIEW["Review Documents\nCMND, GPLX, Đăng kiểm"]
    DOC_REVIEW -->|"✅ Approve"| PROVIDER_ACTIVE["Provider → Active"]
    DOC_REVIEW -->|"❌ Reject + lý do"| PROVIDER_RESUBMIT["Provider re-upload"]

    ORD_MGMT --> ORD_D_A["Order Detail\n(/admin/orders/[id])"]
    ORD_D_A --> FORCE_CANCEL["Force Cancel Order"]
    ORD_D_A --> REFUND_CTX["Initiate Refund"]

    DISPUTES --> DISPUTE_D["Dispute Detail\nEvidence + chat logs"]
    DISPUTE_D -->|"✅ Favor customer"| REFUND_A["Process Refund\n(PayOS)"]
    DISPUTE_D -->|"✅ Favor provider"| CLOSE_D["Close Dispute"]

    REVIEWS_A --> REVIEW_D["Review Detail"]
    REVIEW_D --> HIDE_R["Hide Review"]
    REVIEW_D --> FLAG_R["Flag for investigation"]

    PASS_DO --> LISTING_MOD["Listing Moderation"]
    LISTING_MOD --> HIDE_L["Hide Listing"]
    LISTING_MOD --> APPROVE_L["Approve Listing"]

    style ADMIN_LOGIN fill:#ffebee,stroke:#B71C1C
    style DASH_A fill:#ffebee,stroke:#B71C1C,stroke-width:2px
    style VERIF fill:#fce4ec,stroke:#880E4F
    style DISPUTES fill:#fce4ec,stroke:#880E4F
    style ANALYTICS fill:#f3e5f5,stroke:#4A148C
```

---

## Tóm tắt Screen Authorization

| Screen | Guest | Customer | Provider | Admin |
|--------|-------|----------|----------|-------|
| Landing Page | ✅ | ✅ | ✅ | ✅ |
| Login / Register / Forgot | ✅ | redirect | redirect | ✅ |
| Reset Password | ✅ | ✅ | ✅ | — |
| Home Tab | — | ✅ | — | — |
| Booking Flows | — | ✅ | — | — |
| Order Tracking | — | ✅ | ✅ | — |
| Order Detail | — | ✅ | ✅ | ✅ |
| Marketplace (browse) | ✅ | ✅ | — | — |
| Marketplace (create/fav) | — | ✅ | — | — |
| Provider Dashboard | — | — | ✅ | — |
| Provider Earnings | — | — | ✅ | — |
| Provider Documents | — | — | ✅ | ✅ |
| Admin Dashboard | — | — | — | ✅ |
| Admin Verifications | — | — | — | ✅ |
| Admin Analytics | — | — | — | ✅ |
| Provider Public Profile | ✅ | ✅ | ✅ | ✅ |
| Reference Prices | ✅ | ✅ | — | — |
