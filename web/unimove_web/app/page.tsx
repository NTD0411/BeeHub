"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Truck, ShoppingBag, Shield, CheckCircle, MapPin, Clock,
  DollarSign, Users, ArrowRight, ChevronRight, Star, Menu, X, Zap,
} from "lucide-react";
import { isAuthenticated, getStoredUser, getRoleHome, clearAuth } from "@/lib/auth";
import { fadeInUp, stagger, viewport } from "@/components/landing/motion";
import { cn } from "@/lib/utils";

/* ─── Brand tokens ────────────────────────────────────────── */
const Y  = "#FFCC00";   // brand yellow
const YD = "#E6B800";   // yellow dark
const YL = "#FFFBEB";   // yellow light
const B  = "#2563EB";   // brand blue
const BD = "#1D4ED8";   // blue dark
const BL = "#EFF6FF";   // blue light
const G  = "#6B7280";   // text gray
const D  = "#111827";   // text dark

/* Local hero video — cinematic advertisement truck */
const VIDEO_URL = "/hero.mp4";

/* ─── Data ────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Tính năng", href: "#tinh-nang" },
  { label: "Dịch vụ",   href: "#dich-vu"   },
  { label: "Nhà xe",    href: "/nha-xe"    },
  { label: "Đối tác",   href: "#doi-tac"   },
  { label: "Liên hệ",   href: "#lien-he"   },
];

const STATS = [
  { value: "90+",  label: "Người sử dụng" },
  { value: "2+",    label: "Tài xế trên nền tảng" },
  { value: "4.9★", label: "Điểm đánh giá TB" },
  { value: "< 30'", label: "Nhận báo giá" },
];

const FEATURES = [
  { icon: DollarSign, title: "Báo giá minh bạch",  desc: "Nhận báo giá chi tiết từ nhiều nhà xe trong 30 phút. Không phụ phí ẩn.",          color: B  },
  { icon: Shield,     title: "Thanh toán an toàn", desc: "Tiền đặt cọc qua thanh toán ngân hàng. Hoàn tiền 100% nếu có sự cố.",                       color: "#16A34A" },
  { icon: Clock,      title: "Đặt lịch linh hoạt", desc: "Đặt trước hoặc đặt ngay. Đội xe sẵn sàng 7 ngày / tuần.",                           color: "#F59E0B" },
  { icon: MapPin,     title: "Không cần bản đồ",   desc: "Chỉ mô tả địa chỉ bằng chữ. Hệ thống tính giá ngay lập tức.",                       color: "#EF4444" },
  { icon: Users,      title: "Nhà xe đã kiểm tra", desc: "Xác minh CMND, bằng lái và đăng ký xe trước khi lên sàn.",                          color: B        },
  { icon: ShoppingBag,title: "Chợ sinh viên",       desc: "Mua bán đồ cũ miễn phí trong cộng đồng. Vừa chuyển xong vừa giải phóng đồ thừa.", color: "#9333EA" },
];

const STEPS = [
  { step: "01", title: "Nhập địa chỉ",     desc: "Điền điểm đón, điểm đến và mô tả ngắn về đồ đạc cần chuyển."                         },
  { step: "02", title: "Nhận báo giá",     desc: "Các nhà xe phù hợp gửi báo giá chi tiết trong vòng 30 phút."                          },
  { step: "03", title: "Chọn & Đặt cọc",  desc: "Chọn nhà xe ưng ý, đặt cọc 30% an toàn qua cổng thanh toán ngân hàng."                    },
  { step: "04", title: "Chuyển & Thanh toán", desc: "Hoàn tất chuyến chuyển, thanh toán phần còn lại. Đơn giản vậy thôi!" },
];

const PROVIDER_BENEFITS = [
  "Nhận đơn phù hợp với loại xe và tuyến đường của bạn",
  "Giữ lại 90% doanh thu — không cắt xén",
  "Quản lý lịch trình theo ý muốn, nhận đơn khi rảnh",
  "Hỗ trợ kỹ thuật 24/7 từ đội ngũ UniMove",
];

/* ─── Logo component ─────────────────────────────────────── */
function UniMoveLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" };
  return (
    <span className={cn("font-extrabold tracking-tight", sizes[size])}>
      <span
        className="rounded-md px-1.5 py-0.5 text-white"
        style={{ backgroundColor: Y, color: "#FFFFFF", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
      >
        Uni
      </span>
      <span style={{ color: B }}>Move</span>
    </span>
  );
}

/* ─── Video with fade-loop ───────────────────────────────── */
function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const FADE = 0.5;
    let raf: number;

    const tick = () => {
      if (v.duration) {
        const t = v.currentTime, d = v.duration;
        if (t < FADE)        v.style.opacity = String(t / FADE);
        else if (t > d - FADE) v.style.opacity = String((d - t) / FADE);
        else                 v.style.opacity = "1";
      }
      raf = requestAnimationFrame(tick);
    };

    const onEnded = () => {
      v.style.opacity = "0";
      setTimeout(() => { v.currentTime = 0; v.play().catch(() => {}); }, 100);
    };

    v.play().catch(() => {});
    raf = requestAnimationFrame(tick);
    v.addEventListener("ended", onEnded);
    return () => { cancelAnimationFrame(raf); v.removeEventListener("ended", onEnded); };
  }, []);

  return (
    <video
      ref={ref}
      src={VIDEO_URL}
      muted
      playsInline
      preload="auto"
      style={{
        position: "absolute",
        inset: "auto 0 0 0",
        top: "260px",
        width: "100%",
        height: "calc(100% - 260px)",
        objectFit: "cover",
        objectPosition: "85% center",
        opacity: 0,
        zIndex: 0,
      }}
    />
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function LandingPage() {
  const router  = useRouter();
  const [ready, setReady]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const u = getStoredUser();
      if (u) { router.replace(getRoleHome(u.role)); return; }
    } else {
      clearAuth(); // xóa cookie cũ để middleware không chặn /dang-nhap, /dang-ky
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-gray-900">

      {/* ══════════ NAVBAR ══════════ */}
      <header
        className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md"
        style={{ borderColor: "#FFF0A0" }}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          {/* Logo — left */}
          <Link href="/" className="shrink-0">
            <UniMoveLogo size="lg" />
          </Link>

          {/* Desktop nav — center */}
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href}
                className="text-sm font-semibold whitespace-nowrap transition-colors"
                style={{ color: G }}
                onMouseEnter={e => (e.currentTarget.style.color = B)}
                onMouseLeave={e => (e.currentTarget.style.color = G)}>
                {label}
              </a>
            ))}
          </nav>

          {/* Desktop actions — right */}
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <Link href="/dang-nhap"
              className="rounded-full border px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ borderColor: B, color: B }}>
              Đăng nhập
            </Link>
            <Link href="/dang-ky"
              className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.03]"
              style={{ backgroundColor: B }}>
              Đăng ký miễn phí <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="ml-auto flex md:hidden">
            <button onClick={() => setMenuOpen(o => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: YL }}>
              {menuOpen ? <X size={18} style={{ color: D }} /> : <Menu size={18} style={{ color: D }} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t px-6 py-4 md:hidden" style={{ backgroundColor: "#FAFAFA", borderColor: "#FFF0A0" }}>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <a key={href} href={href} onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium"
                  style={{ color: G }}>
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/dang-nhap" onClick={() => setMenuOpen(false)}
                className="rounded-full border py-3 text-center text-sm font-semibold"
                style={{ borderColor: B, color: B }}>
                Đăng nhập
              </Link>
              <Link href="/dang-ky" onClick={() => setMenuOpen(false)}
                className="rounded-full py-3 text-center text-sm font-semibold text-white"
                style={{ backgroundColor: B }}>
                Đăng ký miễn phí
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Gradient background (shows under/around video) */}
        <div className="absolute inset-0 z-0" style={{
          background: `radial-gradient(ellipse 80% 60% at 70% 80%, ${Y}22 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 20% 30%, ${BL} 0%, transparent 55%),
                       #FFFFFF`
        }} />

        {/* Video background */}
        <HeroVideo />

        {/* Gradient overlays on video */}
        <div className="pointer-events-none absolute inset-0 z-[1]" style={{
          background: `linear-gradient(to bottom, #FFFFFF 0%, #FFFFFF 18%, transparent 40%, transparent 60%, #FFFFFF 85%, #FFFFFF 100%),
                       linear-gradient(to right, #FFFFFF 0%, rgba(255,255,255,0.88) 28%, rgba(255,255,255,0.3) 50%, transparent 62%)`
        }} />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8"
          style={{ paddingTop: "calc(8rem - 75px)", paddingBottom: "10rem" }}>
          <motion.div
            initial="hidden" animate="visible" variants={stagger}
            className="flex max-w-3xl flex-col">

            {/* Badge */}
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ backgroundColor: YL, color: YD, border: `1.5px solid ${Y}` }}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: Y }} />
                Nền tảng chuyển trọ #1 dành cho sinh viên Đà Nẵng
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeInUp}
              className="mt-8 text-5xl font-extrabold leading-[1.0] tracking-tight sm:text-6xl lg:text-[5.25rem]"
              style={{ color: D, letterSpacing: "-2px" }}>
              Chuyển trọ{" "}
              <span className="relative inline-block">
                <span style={{ color: B }}>thông minh</span>
                <span aria-hidden className="absolute -bottom-2 left-0 h-3 w-full rounded-sm opacity-60"
                  style={{ background: `linear-gradient(to right, ${Y}, ${Y}88)` }} />
              </span>
              <br />
              <span style={{ color: G, fontStyle: "italic", fontWeight: 600 }}>cho sinh viên.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeInUp}
              className="mt-8 max-w-xl text-lg leading-relaxed"
              style={{ color: G }}>
              Kết nối sinh viên với nhà vận chuyển uy tín. Báo giá minh bạch, không phụ phí ẩn.
              Đặt dịch vụ trong 2 phút — từ điện thoại hay máy tính.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/dang-ky"
                className="flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-bold text-white transition-all hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]"
                style={{ backgroundColor: B, boxShadow: `0 8px 24px ${B}44` }}>
                Bắt đầu ngay — Miễn phí <ArrowRight size={18} />
              </Link>
              <Link href="/dang-nhap"
                className="flex items-center justify-center gap-2 rounded-full border-2 px-10 py-4 text-base font-semibold transition-all hover:scale-[1.03] hover:brightness-95 active:scale-[0.98]"
                style={{ borderColor: Y, color: D, backgroundColor: "white" }}>
                Đã có tài khoản
              </Link>
            </motion.div>

            {/* Trust signal */}
            <motion.div variants={fadeInUp} className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-2">
                {["#2563EB", "#FFCC00", "#16A34A", "#EF4444"].map((c, i) => (
                  <div key={i} className="h-9 w-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: c }}>
                    {["A", "B", "C", "D"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={Y} style={{ color: Y }} />)}
                </div>
                <p className="text-sm font-medium" style={{ color: G }}>
                  <strong style={{ color: D }}>90+ người dùng</strong> và{" "}
                  <strong style={{ color: D }}>1 tài xế</strong> đang dùng UniMove
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ STATS STRIP ══════════ */}
      <section style={{ backgroundColor: Y }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport} variants={stagger}
          className="mx-auto grid max-w-7xl grid-cols-2 gap-0 px-6 py-12 md:grid-cols-4 lg:px-8">
          {STATS.map(({ value, label }, i) => (
            <motion.div key={label} variants={fadeInUp}
              className={cn("flex flex-col items-center py-4 text-center",
                i < STATS.length - 1 && "md:border-r md:border-black/10")}>
              <p className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: D }}>{value}</p>
              <p className="mt-1 text-sm font-medium" style={{ color: "#555" }}>{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="tinh-nang" className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={stagger}
            className="mb-16 flex max-w-2xl flex-col items-center text-center mx-auto">
            <motion.span variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: YL, color: YD, border: `1.5px solid ${Y}` }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: Y }} />
              Tính năng nổi bật
            </motion.span>
            <motion.h2 variants={fadeInUp}
              className="mt-6 text-4xl font-extrabold tracking-tight md:text-[58px]"
              style={{ color: D, letterSpacing: "-1px" }}>
              Tại sao chọn{" "}
              <span className="relative inline-block">
                <span style={{ color: B }}>Uni</span>
                <span style={{ color: YD }}>Move</span>
                <span aria-hidden className="absolute -bottom-1 left-0 h-2 w-full rounded-sm opacity-50"
                  style={{ backgroundColor: Y }} />
              </span>
              ?
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg leading-relaxed" style={{ color: G }}>
              Mọi thứ bạn cần để một chuyến chuyển trọ diễn ra hoàn hảo
            </motion.p>
          </motion.div>

          {/* Cards */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={stagger}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <motion.div key={title} variants={fadeInUp}
                className="group relative overflow-hidden rounded-2xl border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: "#F0F0F0" }}>
                {/* Yellow top border accent */}
                <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl"
                  style={{ backgroundColor: color === B ? Y : color + "AA" }} />
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: YL }}>
                  <Icon size={22} style={{ color: color }} />
                </div>
                <h3 className="mb-2 text-lg font-bold" style={{ color: D }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: G }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ PROCESS ══════════ */}
      <section id="dich-vu" className="py-28" style={{ backgroundColor: YL }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={stagger}
            className="mb-16 flex max-w-2xl flex-col items-center text-center mx-auto">
            <motion.span variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: Y + "33", color: YD, border: `1.5px solid ${Y}` }}>
              Quy trình
            </motion.span>
            <motion.h2 variants={fadeInUp}
              className="mt-6 text-4xl font-extrabold tracking-tight md:text-[58px]"
              style={{ color: D, letterSpacing: "-1px" }}>
              Chỉ <span style={{ color: B }}>4 bước</span> là xong
            </motion.h2>
            <motion.p variants={fadeInUp} className="mt-4 text-lg" style={{ color: G }}>
              Quy trình được tối giản đến mức bạn có thể đặt trong khi đang ngồi họp
            </motion.p>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={viewport} variants={stagger}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ step, title, desc }, i) => (
              <motion.div key={step} variants={fadeInUp}
                className="relative rounded-2xl bg-white p-7 shadow-sm transition-all hover:shadow-md"
                style={{ border: `1.5px solid ${Y}66` }}>
                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div aria-hidden className="absolute right-0 top-8 hidden translate-x-1/2 lg:flex">
                    <ChevronRight size={20} style={{ color: YD }} />
                  </div>
                )}
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold"
                  style={{ backgroundColor: Y, color: D }}>
                  {step}
                </div>
                <h3 className="mb-2 text-lg font-bold" style={{ color: D }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: G }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ PROVIDER CTA ══════════ */}
      <section id="doi-tac" className="py-28" style={{ backgroundColor: BD }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={stagger}
              className="flex flex-col">
              <motion.span variants={fadeInUp}
                className="mb-6 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ backgroundColor: Y + "22", color: Y, border: `1.5px solid ${Y}55` }}>
                Đối tác vận chuyển
              </motion.span>
              <motion.h2 variants={fadeInUp}
                className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-[58px]"
                style={{ letterSpacing: "-1px" }}>
                Bạn có <span style={{ color: Y }}>xe tải</span>?<br />Hãy cùng kiếm tiền.
              </motion.h2>
              <motion.p variants={fadeInUp} className="mt-5 text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                Tham gia mạng lưới nhà vận chuyển UniMove. Thu nhập chủ động, nhận đơn khi rảnh.
              </motion.p>
              <motion.ul variants={fadeInUp} className="mt-8 space-y-3.5">
                {PROVIDER_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
                    <CheckCircle size={18} className="mt-0.5 shrink-0" style={{ color: Y }} />
                    {item}
                  </li>
                ))}
              </motion.ul>
              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4">
                <Link href="/dang-ky"
                  className="group mt-10 flex w-fit items-center gap-2 rounded-full px-8 py-4 text-base font-bold transition-all hover:scale-[1.03] hover:brightness-95 active:scale-[0.98]"
                  style={{ backgroundColor: Y, color: D }}>
                  Đăng ký làm đối tác
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/nha-xe"
                  className="group mt-10 flex w-fit items-center gap-2 rounded-full px-8 py-4 text-base font-semibold border border-white/30 text-white transition-all hover:bg-white/10 hover:scale-[1.03] active:scale-[0.98]">
                  Xem danh sách nhà xe
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — stat cards */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp}
              className="grid grid-cols-2 gap-4">
              {[
                { icon: DollarSign, value: "90%",     label: "Doanh thu giữ lại",   sub: "Sau mỗi chuyến hoàn thành" },
                { icon: Truck,      value: "1",      label: "Tài xế đang hoạt động", sub: "Trên nền tảng UniMove"   },
                { icon: Clock,      value: "7/7",     label: "Ngày hoạt động",       sub: "Không nghỉ lễ"            },
                { icon: Star,       value: "4.9★",    label: "Điểm tài xế TB",       sub: "Từ đánh giá thực tế"     },
              ].map(({ icon: Icon, value, label, sub }) => (
                <div key={label} className="rounded-2xl p-5 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon size={22} className="mx-auto mb-2" style={{ color: Y }} />
                  <p className="text-2xl font-extrabold text-white">{value}</p>
                  <p className="mt-0.5 text-xs font-semibold" style={{ color: Y }}>{label}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{sub}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="bg-white py-28">
        <motion.div
          initial="hidden" whileInView="visible" viewport={viewport} variants={stagger}
          className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <motion.span variants={fadeInUp}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: YL, color: YD, border: `1.5px solid ${Y}` }}>
            <Zap size={12} style={{ color: YD }} /> Bắt đầu ngay hôm nay
          </motion.span>
          <motion.h2 variants={fadeInUp}
            className="mt-6 text-4xl font-extrabold tracking-tight md:text-[58px]"
            style={{ color: D, letterSpacing: "-1.5px" }}>
            Sẵn sàng{" "}
            <span className="relative">
              <span style={{ color: B }}>chuyển trọ</span>
              <span aria-hidden className="absolute -bottom-1.5 left-0 h-2.5 w-full rounded-sm opacity-50"
                style={{ backgroundColor: Y }} />
            </span>
            ?
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-lg leading-relaxed" style={{ color: G }}>
            Tạo tài khoản miễn phí. Không cần thẻ tín dụng.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <Link href="/dang-ky"
              className="flex items-center justify-center gap-2 rounded-full px-10 py-4 text-base font-bold text-white transition-all hover:scale-[1.03] hover:brightness-110"
              style={{ backgroundColor: B, boxShadow: `0 8px 24px ${B}44` }}>
              Tạo tài khoản — Miễn phí
            </Link>
            <Link href="/dang-nhap"
              className="flex items-center justify-center gap-2 rounded-full border-2 px-10 py-4 text-base font-semibold transition-all hover:scale-[1.03]"
              style={{ borderColor: Y, color: D }}>
              Đã có tài khoản? Đăng nhập
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer id="lien-he" className="border-t py-12" style={{ borderColor: "#FFF0A0" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center md:flex-row md:text-left lg:px-8">
          <Link href="/" className="shrink-0">
            <UniMoveLogo size="sm" />
          </Link>
          <p className="text-sm" style={{ color: G }}>
            © 2026 UniMove. Nền tảng chuyển trọ dành cho sinh viên Việt Nam.
          </p>
          <div className="flex gap-6">
            {["Điều khoản", "Bảo mật", "Liên hệ"].map((item) => (
              <a key={item} href="#"
                className="text-sm transition-colors"
                style={{ color: G }}
                onMouseEnter={e => (e.currentTarget.style.color = B)}
                onMouseLeave={e => (e.currentTarget.style.color = G)}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
