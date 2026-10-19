/** Nhãn tiếng Việt cho báo cáo GA4 trong Admin */

const PAGE_LABELS: Record<string, string> = {
  "/": "Trang chủ (Landing)",
  "/dang-nhap": "Đăng nhập",
  "/login": "Đăng nhập",
  "/dang-ky": "Đăng ký",
  "/register": "Đăng ký",
  "/quen-mat-khau": "Quên mật khẩu",
  "/forgot-password": "Quên mật khẩu",
  "/trang-chu": "Trang chủ",
  "/dat-chuyen": "Đặt chuyến",
  "/hoat-dong": "Hoạt động / Đơn hàng",
  "/don-hang": "Danh sách đơn hàng",
  "/tin-nhan": "Tin nhắn",
  "/thong-bao": "Thông báo",
  "/tai-khoan": "Tài khoản",
  "/cho-sinh-vien": "Chợ sinh viên",
  "/reference-prices": "Bảng giá tham khảo",
  "/payment-success": "Thanh toán thành công",
  "/payment-cancel": "Hủy thanh toán",
  "/cho-duyet": "Chờ duyệt tài khoản",
  "/admin": "Admin · Trang chủ",
  "/admin/dashboard": "Admin · Tổng quan",
  "/admin/users": "Admin · Người dùng",
  "/admin/verifications": "Admin · Xác minh",
  "/admin/orders": "Admin · Đơn hàng",
  "/admin/disputes": "Admin · Khiếu nại",
  "/admin/refunds": "Admin · Hoàn tiền",
  "/admin/reviews": "Admin · Đánh giá",
  "/admin/pass-do": "Admin · Pass đồ",
  "/admin/analytics": "Admin · Thống kê",
  "/admin/user-behavior": "Admin · Hành vi GA4",
  "/admin/finance": "Admin · Tài chính",
  "/admin/notifications": "Admin · Thông báo",
  "/admin/activity-logs": "Admin · Nhật ký",
  "/admin/settings": "Admin · Cài đặt",
  "/admin/profile": "Admin · Hồ sơ",
  "/tai-xe/tong-quan": "Tài xế · Tổng quan",
  "/tai-xe/giay-to": "Tài xế · Giấy tờ",
  "/tai-xe/lich": "Tài xế · Lịch",
  "/tai-xe/thu-nhap": "Tài xế · Thu nhập",
};

const PAGE_PREFIX_LABELS: [string, string][] = [
  ["/admin/orders/", "Admin · Chi tiết đơn"],
  ["/don-hang/", "Chi tiết đơn hàng"],
  ["/dat-chuyen/", "Đặt chuyến · "],
  ["/cho-sinh-vien/", "Chợ SV · "],
  ["/nha-xe/", "Nhà xe · "],
  ["/marketplace/", "Marketplace · "],
  ["/orders/", "Đơn hàng · "],
];

const SOURCE_LABELS: Record<string, string> = {
  "(direct)": "Truy cập trực tiếp",
  "(not set)": "Không xác định",
  "(data not available)": "Chưa có dữ liệu",
  google: "Google",
  facebook: "Facebook",
  "l.facebook.com": "Facebook",
  "m.facebook.com": "Facebook",
  "vercel.com": "Vercel (deploy/preview)",
  instagram: "Instagram",
  zalo: "Zalo",
  tiktok: "TikTok",
  bing: "Bing",
  youtube: "YouTube",
};

const MEDIUM_LABELS: Record<string, string> = {
  "(none)": "Không qua kênh",
  "(not set)": "Không xác định",
  "(data not available)": "Chưa có dữ liệu",
  organic: "Tìm kiếm tự nhiên",
  referral: "Giới thiệu / Link ngoài",
  cpc: "Quảng cáo trả phí",
  social: "Mạng xã hội",
  email: "Email",
  display: "Hiển thị (banner)",
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Xem trang",
  admin_page_view: "Xem trang quản trị",
  session_start: "Bắt đầu phiên",
  first_visit: "Lần truy cập đầu",
  user_engagement: "Tương tác trang",
  scroll: "Cuộn trang",
  form_start: "Bắt đầu điền form",
  click: "Nhấp chuột",
  login: "Đăng nhập",
  sign_up: "Đăng ký",
};

function normalizePath(path?: string): string {
  if (!path) return "/";
  const base = path.split("?")[0].split("#")[0] || "/";
  return base.endsWith("/") && base.length > 1 ? base.slice(0, -1) : base;
}

export function getPageLabel(path?: string): string {
  const p = normalizePath(path);
  if (PAGE_LABELS[p]) return PAGE_LABELS[p];

  for (const [prefix, label] of PAGE_PREFIX_LABELS) {
    if (p.startsWith(prefix)) {
      const rest = p.slice(prefix.length);
      if (!rest) return label.replace(/ · $/, "");
      return `${label}${rest}`;
    }
  }

  if (p.startsWith("/admin/")) {
    const slug = p.replace("/admin/", "").replace(/-/g, " ");
    return `Admin · ${slug}`;
  }

  if (p === "/" || p === "") return "Trang chủ (Landing)";

  const slug = p.replace(/^\//, "").replace(/-/g, " ");
  return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : p;
}

export function getSourceLabel(source?: string): string {
  const s = (source || "").trim();
  if (!s) return "Không xác định";
  return SOURCE_LABELS[s] ?? SOURCE_LABELS[s.toLowerCase()] ?? s;
}

export function getMediumLabel(medium?: string): string {
  const m = (medium || "").trim();
  if (!m) return "Không xác định";
  return MEDIUM_LABELS[m] ?? MEDIUM_LABELS[m.toLowerCase()] ?? m;
}

export function getTrafficLabel(source?: string, medium?: string): string {
  const src = (source || "").trim();
  const med = (medium || "").trim();

  if (
    (src === "(direct)" && med === "(none)") ||
    (src === "(direct)" && !med)
  ) {
    return "Truy cập trực tiếp (gõ URL / bookmark)";
  }

  if (src === "(not set)" || med === "(not set)") {
    return "Nguồn chưa xác định";
  }

  if (src === "(data not available)" || med === "(data not available)") {
    return "Dữ liệu đang xử lý";
  }

  const srcLabel = getSourceLabel(src);
  const medLabel = getMediumLabel(med);

  if (srcLabel !== src && medLabel !== med) {
    return `${srcLabel} — ${medLabel}`;
  }

  return `${getSourceLabel(src)} / ${getMediumLabel(med)}`;
}

export function getEventLabel(eventName?: string): string {
  const e = (eventName || "").trim();
  if (!e) return "—";
  return EVENT_LABELS[e] ?? e.replace(/_/g, " ");
}

export function getTrafficCategory(source?: string, medium?: string): string {
  const src = (source || "").toLowerCase();
  const med = (medium || "").toLowerCase();

  if (src === "(direct)" && (med === "(none)" || !med)) return "Trực tiếp";
  if (med === "organic" || src === "google") return "Tìm kiếm";
  if (med === "referral" || src.includes("facebook") || src.includes("vercel")) return "Giới thiệu";
  if (med === "social") return "Mạng xã hội";
  if (med === "cpc" || med === "paid") return "Quảng cáo";
  if (med === "email") return "Email";
  if (src === "(not set)" || med === "(not set)") return "Khác";
  return "Khác";
}
