# PROMPT — Build Admin Dashboard cho UniMove (copy vào Claude trong VS Code)

> Copy toàn bộ phần dưới đây (từ "Bạn là..." đến hết) và dán vào Claude trong VS Code.

---

Bạn là senior fullstack engineer. Hãy xây dựng **Admin Web Dashboard** cho dự án **UniMove** theo chuẩn **production-ready**.

## 1. Bối cảnh dự án
UniMove là một **marketplace kết nối sinh viên cần chuyển trọ với các đơn vị vận chuyển (provider)**. Có 3 actor: Customer (mobile app), Provider (mobile app), và **Admin (web dashboard — chính là cái cần build)**. Admin quản lý người dùng, xác minh provider, theo dõi đơn hàng, xử lý refund/khiếu nại, kiểm duyệt review, xem analytics doanh thu/GMV, gửi thông báo hệ thống và xem activity logs.

## 2. Tech stack (BẮT BUỘC)
- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS** (config sẵn dark mode bằng `class`)
- **shadcn/ui** cho component primitives (button, input, dialog, dropdown, table, badge, skeleton, toast...) — nếu không dùng shadcn thì tự build component tương đương bằng Tailwind thuần, KHÔNG dùng UI lib nặng khác
- **Recharts** cho biểu đồ
- **lucide-react** cho icon
- **Supabase** làm backend: dùng `@supabase/supabase-js` + `@supabase/ssr` (auth qua cookie/server). Đọc config từ env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Tạo file `.env.local.example`.
- State: ưu tiên React Server Components + server actions; client state nhẹ thì dùng `zustand` nếu cần.

## 3. Database (Supabase — ĐÃ TỒN TẠI, KHÔNG tạo mới)
> ⚠️ QUAN TRỌNG: Database đã được dựng sẵn bằng migrations trong thư mục `supabase/migrations/` (gồm: initial_schema, orders_and_bookings, payments, tracking_and_location, chat_and_notifications, reviews_and_ratings, rls_policies, seed_data, business_flow, mvp_cleanup, node_auth, + `admin_dashboard_indexes.sql`, auth trigger fix). **TUYỆT ĐỐI KHÔNG** tạo bảng mới, không viết schema mới, không sửa/đè migration, không chạy seed mới.

**Bước bắt buộc trước khi code (đọc schema thật):**
1. Liệt kê và đọc toàn bộ file trong `supabase/migrations/` để nắm tên bảng, tên cột, kiểu dữ liệu, enum status và quan hệ FK **thực tế**.
2. Nếu có thể, introspect trực tiếp Supabase (qua `supabase gen types typescript` hoặc query `information_schema`) để sinh **`lib/database.types.ts`** từ schema thật.
3. **Lập bảng mapping** "trang admin ↔ bảng/cột thật" rồi DỪNG LẠI, gửi tôi xác nhận trước khi code. Tên field/enum bên dưới chỉ là DỰ KIẾN — phải thay bằng tên thật trong migration.

Các thực thể dự kiến cần đọc (tên thật lấy từ migration): users/profiles, providers (verification), orders/bookings, payments, services/packages, reviews & ratings, disputes/refunds, notifications, activity/audit logs, tracking_locations.

`lib/supabase/` (client.ts cho browser dùng anon key, server.ts cho server dùng `@supabase/ssr`). `lib/queries/` chứa hàm fetch/mutation theo domain, **đặt tên cột đúng theo schema thật** (không bịa). RLS đã có sẵn trong `rls_policies` → chỉ cần đăng nhập đúng admin, không tự thêm policy. Nếu một bảng không trả data → **empty state**, không crash.

## 4. Layout tổng thể
- **Sidebar trái** (collapse được trên desktop, ẩn sau drawer/hamburger trên mobile/tablet), gồm các mục map đúng nghiệp vụ UniMove:
  - **Dashboard** — tổng quan
  - **Users** — quản lý customer + provider (tab hoặc 2 submenu Customers / Providers), search, ban/unban
  - **Verifications** — duyệt provider: approve/reject, xem ảnh CCCD/bằng lái/thông tin xe
  - **Orders** — xem tất cả đơn, filter theo status, force cancel
  - **Disputes & Refunds** — xử lý khiếu nại, xem bằng chứng, quyết định refund
  - **Reviews** — kiểm duyệt, ẩn/xóa review vi phạm
  - **Analytics** — revenue/GMV, provider performance, order statistics, biểu đồ
  - **Notifications** — soạn & broadcast thông báo hệ thống
  - **Activity Logs** — audit log hành động admin
  - **Settings** — cấu hình tài khoản admin, theme
- **Header trên cùng**: ô **search** (global), nút **notifications** (dropdown + badge số chưa đọc), nút **toggle dark/light mode**, **avatar** admin (dropdown: Profile, Settings, Logout).
- **Auth**: route `/login` cho admin (Supabase Auth, email/password), middleware bảo vệ toàn bộ `/dashboard/*` — chỉ cho `role = admin`, redirect về `/login` nếu chưa đăng nhập.

## 5. Trang Dashboard (overview)
- 4 **stat cards** ở đầu: **Tổng doanh thu**, **Tổng đơn hàng**, **Số người dùng**, **Tỷ lệ tăng trưởng** (mỗi card có icon, số liệu, delta % so kỳ trước với mũi tên lên/xuống màu xanh/đỏ).
- **Biểu đồ doanh thu theo tháng** (Recharts — area hoặc bar chart, responsive, có tooltip).
- Thêm 1 chart phụ hữu ích: **đơn hàng theo trạng thái** (donut/pie) hoặc **GMV theo tuần**.
- **Bảng "Đơn hàng mới nhất"**: cột (Mã đơn, Customer, Provider, Điểm đi → điểm đến, Số tiền, Trạng thái[badge màu theo status], Ngày tạo), có **phân trang** (server-side pagination), sort theo ngày, click row mở chi tiết.

## 6. UI states (BẮT BUỘC làm đầy đủ cho mọi trang/bảng)
- **Hover state** cho mọi interactive element (button, row, menu item).
- **Loading state**: skeleton loaders cho cards, charts, table (không dùng spinner toàn trang).
- **Empty state**: illustration/icon + dòng mô tả + CTA khi không có dữ liệu.
- **Error state**: thông báo lỗi gọn + nút retry.
- **Dark mode** hoàn chỉnh (toggle ở header, lưu preference vào localStorage, tôn trọng `prefers-color-scheme` lần đầu).

## 7. Responsive
- **Desktop**: sidebar cố định + main content.
- **Tablet**: sidebar thu gọn thành icon-only hoặc drawer.
- **Mobile**: sidebar ẩn sau hamburger (drawer overlay), cards xếp dọc, bảng cho phép scroll ngang hoặc chuyển sang card-list.

## 8. Design system — ĐỒNG BỘ với UniMove mobile app (BẮT BUỘC)
Admin web phải cùng ngôn ngữ thiết kế với app (tham khảo screenshot app: Home, Payment, Pricing). Tinh thần: **fintech/SaaS hiện đại, xanh dương chủ đạo, bo góc lớn, sạch sẽ, nhiều khoảng trắng** — KHÔNG tím/indigo, KHÔNG xám trung tính lạnh.

**Màu (định nghĩa làm CSS variable + Tailwind theme):**
- **Primary — Royal Blue** `#1A56DB` (chính xác hơn: dải `#2563EB → #1A56DB`), dùng cho logo, nút primary, link, icon active, menu active. Gradient xanh (`#2563EB → #1D4ED8`) cho header card/banner nổi bật.
- **Primary tint** `#EAF1FF`/`#DBEAFE` — nền icon-box, hover nhẹ, badge xanh.
- **Background sáng** `#F5F8FF` (xanh-trắng rất nhạt) cho app shell; **card trắng** `#FFFFFF`.
- **Success / Verified / "đang đến"** xanh lá `#16A34A`, badge nền `#DCFCE7`.
- **Warning / pending** vàng/amber `#D97706`, badge nền `#FEF3C7`.
- **Danger / cancelled / refund-out / badge số thông báo** đỏ `#DC2626`, badge nền `#FEE2E2`.
- **Text**: chính `#0F172A`, phụ/muted `#64748B`.
- **Dark mode** (xem app Pricing screen): nền near-black/navy `#0B1220`, surface `#111A2E`, card `#1A2540`, viền `#243049`; primary sáng lên `#3B82F6`; chữ `#E2E8F0`/muted `#94A3B8`. Badge giữ tông nhưng nền đậm trong suốt.

**Hình khối & hiệu ứng:**
- Bo góc lớn: card `rounded-2xl`, panel/nút pill `rounded-full` cho CTA chính, input `rounded-xl`.
- Shadow mềm, khuếch tán (`shadow-sm`/`shadow-md` tông xanh nhạt), KHÔNG viền cứng đậm.
- Icon đặt trong **rounded-square container** nền tint (xanh nhạt / xanh lá nhạt), giống các service card trong app.
- Status hiển thị dạng **pill badge** nền nhạt + chữ đậm cùng tông (vd "Đang đến" xanh lá, "Đã hoàn tiền" xanh dương nhạt).

**Typography:** font sans hiện đại, hơi tròn (Inter / Plus Jakarta Sans / Be Vietnam Pro). Heading **bold, cỡ lớn** (giống "Chào buổi sáng", "Thanh toán"). Số liệu lớn cho stat/balance.

**Quy ước hiển thị dữ liệu (đồng bộ app):**
- Tiền tệ: định dạng VND có chấm phân tách + hậu tố `đ`, ví dụ `450.000đ` (helper `formatVND`).
- Mã đơn: tiền tố `#UM-` + số (ví dụ `#UM-29304`).
- Map enum status DB → nhãn tiếng Việt + màu badge: completed→"Hoàn thành"(xanh lá), in_progress→"Đang vận chuyển/Đang đến"(xanh lá nhạt), accepted→"Đã nhận"(xanh dương), pending→"Chờ xử lý"(vàng), cancelled→"Đã hủy"(đỏ); payment paid→"Đã thanh toán", refunded→"Đã hoàn tiền", pending→"Đang chờ". (Tên enum thật lấy từ migration ở mục 3.)

## 9. Cấu trúc & chất lượng code
- Cấu trúc gợi ý:
  ```
  app/(auth)/login/
  app/(dashboard)/dashboard/
  app/(dashboard)/users/
  app/(dashboard)/verifications/
  app/(dashboard)/orders/
  app/(dashboard)/disputes/
  app/(dashboard)/reviews/
  app/(dashboard)/analytics/
  app/(dashboard)/notifications/
  app/(dashboard)/activity-logs/
  app/(dashboard)/settings/
  components/ui/        (primitives)
  components/dashboard/ (StatCard, RevenueChart, OrdersTable, Sidebar, Header...)
  lib/supabase/
  lib/queries/
  lib/types.ts
  middleware.ts
  ```
- Code **TypeScript chặt** (không `any` tùy tiện), tách component rõ ràng, đặt tên có nghĩa, comment ở các phần logic quan trọng.
- Reusable: `<StatCard>`, `<DataTable>` (generic, có pagination/sort/search), `<StatusBadge>`, `<PageHeader>`, `<EmptyState>`.
- Accessibility cơ bản: focus ring, aria-label cho icon button, contrast đạt chuẩn ở cả 2 theme.

## 10. Yêu cầu thực thi
- **TRƯỚC TIÊN (KIỂM TRA TRƯỚC KHI LÀM):** đọc `supabase/migrations/` + introspect schema thật → sinh `lib/database.types.ts` → trình bày bảng mapping "trang ↔ bảng/cột/enum thật" và **chờ tôi xác nhận**. Không code UI khi chưa chốt mapping (tránh bịa tên cột).
- Sau khi chốt: khởi tạo project chạy được ngay (`npm install && npm run dev`), cấu hình Tailwind theme theo đúng màu ở mục 8 + dark mode `class`, Supabase client + `.env.local.example`.
- Viết `README.md` ngắn: set env Supabase, cách login admin (DB + auth đã có sẵn, KHÔNG seed lại).
- Làm **theo từng bước**: dựng skeleton chạy được trước (layout Sidebar + Header + routing + trang Dashboard có data thật), rồi mở rộng dần các trang còn lại. Sau mỗi nhóm trang, báo đã xong gì + bước tiếp theo.

Bắt đầu bằng bước KIỂM TRA schema ở trên trước, không vẽ UI vội.
