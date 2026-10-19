"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Phone, MapPin, Truck, Camera, FileImage,
  ChevronRight, ChevronLeft, CheckCircle, Clock, AlertCircle, Upload,
  ChevronDown,
} from "lucide-react";
import { authApi, providerApi } from "@/lib/api";
import { getStoredUser, isAuthenticated, storeAuth, type AuthUser } from "@/lib/auth";
import { TermsModal } from "@/components/modals/TermsModal";

const BRAND   = "#1A56DB";  // provider primary
const SUCCESS = "#16A34A";  // semantic: success screen step 4, icon hoàn tất

const DA_NANG_PHUONG = [
  "Phường Hải Châu", "Phường Hòa Cường", "Phường Thanh Khê", "Phường An Khê",
  "Phường An Hải", "Phường Sơn Trà", "Phường Ngũ Hành Sơn", "Phường Hòa Khánh",
  "Phường Hải Vân", "Phường Liên Chiểu", "Phường Cẩm Lệ", "Phường Hòa Xuân",
];

function buildAddress(street: string, ward: string) {
  return [street.trim(), ward, "Đà Nẵng"].filter(Boolean).join(", ");
}

function parseAddress(addr: string): { ward: string; street: string } {
  if (!addr) return { ward: "", street: "" };
  const parts = addr.split(",").map(s => s.trim());
  const dnIdx = parts.findIndex(p => p === "Đà Nẵng");
  if (dnIdx >= 1) {
    const ward = parts[dnIdx - 1] ?? "";
    const street = parts.slice(0, dnIdx - 1).join(", ");
    return { ward: DA_NANG_PHUONG.includes(ward) ? ward : "", street };
  }
  return { ward: "", street: addr };
}

const VEHICLE_LABELS: Record<string, string> = {
  motorbike: "Xe máy (≤ 100kg)", pickup: "Bán tải", van: "Xe van 5 tạ – 1 tấn",
  truck_1t: "Xe tải 1 tấn", truck_2t: "Xe tải 2 tấn", truck_5t: "Xe tải 5 tấn+",
};

type DocKey = "cccd_front" | "cccd_back" | "driver_license" | "vehicle_registration";
const DOC_FIELDS: { key: DocKey; label: string }[] = [
  { key: "cccd_front",           label: "CCCD/CMND mặt trước" },
  { key: "cccd_back",            label: "CCCD/CMND mặt sau" },
  { key: "driver_license",       label: "Bằng lái xe" },
  { key: "vehicle_registration", label: "Đăng ký xe (cà vẹt)" },
];

const STEP_LABELS = ["Cá nhân", "Phương tiện", "Giấy tờ", "Hoàn tất"];

export default function DangKyTaiXePage() {
  const router = useRouter();
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [phone,  setPhone]  = useState("");
  const [ward,   setWard]   = useState("");
  const [street, setStreet] = useState("");

  // OTP phone verification
  const [otpSent,     setOtpSent]     = useState(false);
  const [otpValue,    setOtpValue]    = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [otpError,    setOtpError]    = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [vehicleType,    setVehicleType]    = useState("");
  const [vehiclePlate,   setVehiclePlate]   = useState("");
  const [vehicleFile,    setVehicleFile]    = useState<File | null>(null);
  const [vehiclePreview, setVehiclePreview] = useState<string | null>(null);
  const vehicleRef = useRef<HTMLInputElement>(null);

  const [docs,     setDocs]     = useState<Partial<Record<DocKey, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<DocKey, string>>>({});
  const [tosAgreed,       setTosAgreed]       = useState(false);
  const [showProviderTos, setShowProviderTos] = useState(false);
  const docRef0 = useRef<HTMLInputElement>(null);
  const docRef1 = useRef<HTMLInputElement>(null);
  const docRef2 = useRef<HTMLInputElement>(null);
  const docRef3 = useRef<HTMLInputElement>(null);
  const docRefs = [docRef0, docRef1, docRef2, docRef3];

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/dang-nhap"); return; }
    const u = getStoredUser();
    setUser(u);
    if (u?.phone)        setPhone(u.phone);
    if (u?.vehicle_type) setVehicleType(u.vehicle_type);
    if (u?.address) {
      const parsed = parseAddress(u.address);
      setWard(parsed.ward);
      setStreet(parsed.street);
    }
  }, [router]);

  const handleVehiclePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setVehicleFile(f);
    setVehiclePreview(URL.createObjectURL(f));
  };

  const handleDoc = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setDocs(d => ({ ...d, [key]: f }));
    setPreviews(p => ({ ...p, [key]: URL.createObjectURL(f) }));
  };

  const sendOtp = async () => {
    if (!phone.trim()) { setOtpError("Nhập số điện thoại trước"); return; }
    if (!user?.id) { setOtpError("Chưa đăng nhập"); return; }
    setOtpLoading(true);
    setOtpError(null);
    try {
      await authApi.sendPhoneOtp(phone.trim(), user.id);
      setOtpSent(true);
      setOtpCooldown(60);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      cooldownRef.current = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Gửi mã thất bại");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpValue.trim()) { setOtpError("Nhập mã OTP"); return; }
    if (!user?.id) { setOtpError("Chưa đăng nhập"); return; }
    setOtpLoading(true);
    setOtpError(null);
    try {
      await authApi.verifyPhoneOtp(otpValue.trim(), user.id);
      setOtpVerified(true);
      setOtpError(null);
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Mã OTP không hợp lệ");
    } finally {
      setOtpLoading(false);
    }
  };

  const nextStep1 = async () => {
    setError(null);
    if (!phone.trim())  { setError("Vui lòng nhập số điện thoại"); return; }
    if (!otpVerified)   { setError("Vui lòng xác minh số điện thoại bằng mã OTP"); return; }
    if (!ward)          { setError("Vui lòng chọn phường"); return; }
    if (!street.trim()) { setError("Vui lòng nhập số nhà và tên đường"); return; }
    setLoading(true);
    try {
      const res = await authApi.updateMe({ phone: phone.trim(), address: buildAddress(street, ward), ward });
      if (res.success && res.data) {
        const token = localStorage.getItem("unimove_token") ?? "";
        storeAuth({ ...user!, ...(res.data as AuthUser) }, token);
      }
      setStep(2);
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi kết nối"); }
    finally { setLoading(false); }
  };

  const nextStep2 = async () => {
    setError(null);
    if (!vehicleType)         { setError("Vui lòng chọn loại phương tiện"); return; }
    if (!vehiclePlate.trim()) { setError("Vui lòng nhập biển số xe"); return; }
    setLoading(true);
    try {
      const res = await authApi.updateMe({ vehicle_type: vehicleType, vehicle_plate: vehiclePlate.trim() });
      if (res.success && res.data) {
        const token = localStorage.getItem("unimove_token") ?? "";
        storeAuth({ ...user!, ...(res.data as AuthUser) }, token);
        setUser(prev => prev ? { ...prev, vehicle_type: vehicleType } : prev);
      }
      setStep(3);
    } catch (e) { setError(e instanceof Error ? e.message : "Lỗi kết nối"); }
    finally { setLoading(false); }
  };

  const submitDocs = async () => {
    setError(null);
    const missing = DOC_FIELDS.filter(d => !docs[d.key]);
    if (missing.length) {
      setError(`Vui lòng upload: ${missing.map(d => d.label).join(", ")}`);
      return;
    }
    if (!tosAgreed) {
      setError("Vui lòng đọc và đồng ý với điều khoản dịch vụ trước khi nộp hồ sơ");
      return;
    }
    setLoading(true);
    try {
      const files: Record<string, File> = {};
      (Object.keys(docs) as DocKey[]).forEach(k => { if (docs[k]) files[k] = docs[k]!; });
      if (vehicleFile) files.vehicle_photo = vehicleFile;
      await providerApi.uploadDocuments(files);
      setStep(4);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload thất bại, thử lại sau"); }
    finally { setLoading(false); }
  };

  return (
    <>
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-0.5 text-[15px] font-extrabold leading-none">
            <span className="bg-[#FFCC00] text-white rounded-lg px-2 py-0.5">Uni</span>
            <span style={{ color: "#2563EB" }}>Move</span>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full text-white" style={{ backgroundColor: BRAND }}>
            Đăng ký tài xế
          </span>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

        {/* ── Progress bar ── */}
        {step < 4 && (
          <div className="flex items-center mb-8">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const done   = step > n;
              const active = step === n;
              return (
                <React.Fragment key={n}>
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      done || active ? "text-white" : "bg-gray-100 text-gray-400"
                    }`} style={done || active ? { backgroundColor: BRAND } : {}}>
                      {done ? <CheckCircle size={16} /> : n}
                    </div>
                    <span className={`mt-1.5 text-[11px] font-semibold ${active || done ? "text-[#1A56DB]" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-5 mx-1 transition-colors ${step > n ? "bg-[#1A56DB]" : "bg-gray-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-2xl bg-red-50 border border-red-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
            <StepHeader icon={<User size={18} />} title="Thông tin cá nhân" sub="Điền thông tin liên hệ của bạn" />
            <div className="space-y-4 mt-6">
              <Field label="Họ và tên">
                <input disabled value={user?.full_name ?? ""}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm bg-gray-100 text-gray-500" />
              </Field>
              <Field label="Số điện thoại" required>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <FieldInput icon={<Phone size={15} />} placeholder="0901 234 567" type="tel"
                      value={phone} onChange={e => { setPhone(e.target.value); setOtpVerified(false); setOtpSent(false); setOtpValue(""); setOtpError(null); }}
                      disabled={otpVerified} />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={otpLoading || otpCooldown > 0 || !phone.trim()}
                      className="shrink-0 h-12 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ backgroundColor: BRAND, minWidth: 90 }}
                    >
                      {otpLoading ? (
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                      ) : otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Gửi lại" : "Gửi mã"}
                    </button>
                  )}
                  {otpVerified && (
                    <div className="h-12 px-3 rounded-xl flex items-center gap-1.5 text-sm font-semibold"
                      style={{ backgroundColor: "#dcfce7", color: "#16A34A" }}>
                      <CheckCircle size={15} /> Đã xác minh
                    </div>
                  )}
                </div>
              </Field>

              {/* OTP input — hiện sau khi nhấn Gửi mã */}
              {otpSent && !otpVerified && (
                <Field label={`Nhập mã OTP gửi đến ${user?.email ?? "email của bạn"}`} required>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="● ● ● ● ● ●"
                        value={otpValue}
                        onChange={e => { setOtpValue(e.target.value.replace(/\D/g, "")); setOtpError(null); }}
                        className="flex-1 h-12 px-4 rounded-xl border text-center text-xl font-bold tracking-[0.4em] focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          borderColor: otpError ? "#EF4444" : BRAND,
                          "--tw-ring-color": BRAND,
                        } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        onClick={verifyOtp}
                        disabled={otpLoading || otpValue.length < 6}
                        className="h-12 px-5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                        style={{ backgroundColor: BRAND }}
                      >
                        {otpLoading
                          ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                          : "Xác nhận"}
                      </button>
                    </div>
                    {otpError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} /> {otpError}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Kiểm tra hộp thư <strong>{user?.email}</strong> · Mã có hiệu lực 10 phút
                    </p>
                  </div>
                </Field>
              )}
              <Field label="Thành phố">
                <div className="flex items-center gap-2 h-12 px-4 rounded-xl border border-gray-200 bg-gray-100">
                  <MapPin size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-semibold text-gray-500">Đà Nẵng</span>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Mặc định</span>
                </div>
              </Field>
              <Field label="Phường" required>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  <select value={ward} onChange={e => setWard(e.target.value)}
                    className="w-full h-12 pl-10 pr-9 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:bg-white transition-colors"
                    style={{ "--tw-ring-color": BRAND } as React.CSSProperties}>
                    <option value="">-- Chọn phường --</option>
                    {DA_NANG_PHUONG.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </Field>
              <Field label="Số nhà, tên đường" required>
                <FieldInput icon={<MapPin size={15} />} placeholder="VD: 45 Nguyễn Văn Linh"
                  value={street} onChange={e => setStreet(e.target.value)} />
                {ward && street.trim() && (
                  <p className="text-xs text-gray-400 mt-1.5 px-1">→ {buildAddress(street, ward)}</p>
                )}
              </Field>
            </div>
            <StepFooter onNext={nextStep1} loading={loading} nextLabel="Tiếp theo" />
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
            <StepHeader icon={<Truck size={18} />} title="Thông tin phương tiện" sub="Loại xe và ảnh phương tiện của bạn" />
            <div className="space-y-5 mt-6">
              <Field label="Loại phương tiện" required>
                <div className="relative">
                  <Truck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}
                    className="w-full h-12 pl-10 pr-9 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:bg-white transition-colors"
                    style={{ "--tw-ring-color": BRAND } as React.CSSProperties}>
                    <option value="">-- Chọn loại phương tiện --</option>
                    {Object.entries(VEHICLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </Field>
              <Field label="Biển số xe" required hint="VD: 43A-123.45">
                <FieldInput
                  icon={<Truck size={15} />}
                  placeholder="43A-123.45"
                  value={vehiclePlate}
                  onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                  maxLength={12}
                />
              </Field>
              <Field label="Ảnh phương tiện" hint="Tuỳ chọn — JPG / PNG, tối đa 5MB">
                {vehiclePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#1A56DB]">
                    <img src={vehiclePreview} alt="vehicle" className="w-full object-contain" style={{ maxHeight: 360 }} />
                    <button onClick={() => vehicleRef.current?.click()}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-md"
                      style={{ backgroundColor: BRAND }}>
                      <Camera size={13} /> Thay ảnh
                    </button>
                  </div>
                ) : (
                  <button onClick={() => vehicleRef.current?.click()}
                    className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#1A56DB] hover:bg-[#EFF4FE] flex flex-col items-center justify-center gap-2 transition-colors">
                    <Camera size={28} className="text-gray-300" />
                    <span className="text-sm text-gray-400">Nhấn để chụp / chọn ảnh</span>
                  </button>
                )}
                <input ref={vehicleRef} type="file" accept="image/*" className="hidden" onChange={handleVehiclePhoto} />
                {vehiclePreview && (
                  <p className="text-xs mt-1.5 font-medium flex items-center gap-1" style={{ color: BRAND }}>
                    <CheckCircle size={12} /> Đã chọn
                  </p>
                )}
              </Field>
            </div>
            <StepFooter onBack={() => setStep(1)} onNext={nextStep2} loading={loading} nextLabel="Tiếp theo" />
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
            <StepHeader icon={<FileImage size={18} />} title="Giấy tờ xác minh" sub="Chụp rõ nét, không mờ, không che khuất" />
            <div className="grid grid-cols-2 gap-3 mt-6">
              {DOC_FIELDS.map(({ key, label }, idx) => {
                const preview = previews[key];
                return (
                  <div key={key}>
                    <p className="text-xs font-semibold text-gray-600 mb-1.5">
                      {label}<span className="text-red-500 ml-0.5">*</span>
                    </p>
                    {preview ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-[#1A56DB]">
                        <img src={preview} alt={label} className="w-full object-contain" style={{ maxHeight: 280 }} />
                        <button onClick={() => docRefs[idx].current?.click()}
                          className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow"
                          style={{ backgroundColor: BRAND }}>
                          <Upload size={11} /> Thay
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => docRefs[idx].current?.click()}
                        className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1A56DB] hover:bg-[#EFF4FE] flex flex-col items-center justify-center gap-1.5 transition-colors">
                        <Upload size={22} className="text-gray-300" />
                        <span className="text-[11px] text-gray-400">Nhấn để upload</span>
                      </button>
                    )}
                    {preview && (
                      <p className="text-[10px] mt-1 font-medium flex items-center gap-0.5" style={{ color: BRAND }}>
                        <CheckCircle size={10} /> Đã tải lên
                      </p>
                    )}
                    <input ref={docRefs[idx]} type="file" accept="image/*" className="hidden"
                      onChange={e => handleDoc(key, e)} />
                  </div>
                );
              })}
            </div>
            {/* Điều khoản nhà xe */}
            <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 space-y-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setTosAgreed(v => !v)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                  style={{ borderColor: tosAgreed ? BRAND : "#D1D5DB", backgroundColor: tosAgreed ? BRAND : "white" }}
                >
                  {tosAgreed && <CheckCircle size={12} className="text-white" />}
                </button>
                <p className="text-sm text-gray-700 leading-snug">
                  Tôi đã đọc và đồng ý với{" "}
                  <button
                    type="button"
                    onClick={() => setShowProviderTos(true)}
                    className="font-semibold underline underline-offset-2"
                    style={{ color: BRAND }}
                  >
                    Điều khoản dịch vụ nhà vận chuyển
                  </button>
                  , bao gồm chính sách hủy đơn và điểm tuân thủ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProviderTos(true)}
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: BRAND }}
              >
                📄 Xem toàn bộ điều khoản →
              </button>
            </div>

            <StepFooter onBack={() => setStep(2)} onNext={submitDocs} loading={loading} nextLabel="Nộp giấy tờ" nextIcon={<CheckCircle size={16} />} />
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>
              <CheckCircle size={36} style={{ color: SUCCESS }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hồ sơ đã gửi thành công!</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-xs mx-auto">
              Chúng tôi sẽ xét duyệt trong vòng <strong>24 – 48 giờ</strong>.<br />
              Bạn sẽ nhận thông báo khi được phê duyệt.
            </p>
            <div className="flex flex-col items-center gap-2.5 mb-7">
              {[
                { label: "Hồ sơ đã nhận", done: true, active: false },
                { label: "Đang xét duyệt giấy tờ", done: false, active: true },
                { label: "Phê duyệt & kích hoạt tài khoản", done: false, active: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    item.done ? "bg-[#16A34A]" : item.active ? "bg-yellow-100" : "bg-gray-100"
                  }`}>
                    {item.done ? <CheckCircle size={13} className="text-white" />
                      : item.active ? <Clock size={12} className="text-yellow-500" />
                      : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                  </div>
                  <span className={item.done ? "font-semibold text-[#16A34A]" : item.active ? "font-semibold text-yellow-600" : "text-gray-400"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => router.replace("/cho-duyet")}
              className="w-full h-12 rounded-full font-bold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: BRAND }}>
              Xem trạng thái hồ sơ
            </button>
          </div>
        )}
      </div>
    </div>
    {showProviderTos && (
      <TermsModal
        type="provider"
        onAgree={() => { setTosAgreed(true); setShowProviderTos(false); }}
        onClose={() => setShowProviderTos(false)}
      />
    )}
    </>
  );
}

function StepHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
        style={{ backgroundColor: BRAND }}>{icon}</div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function FieldInput({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      {icon && <span className="absolute left-3.5 pointer-events-none text-gray-400">{icon}</span>}
      <input {...props}
        className={`w-full h-12 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-colors ${icon ? "pl-10 pr-4" : "px-4"}`}
        style={{ "--tw-ring-color": BRAND } as React.CSSProperties}
      />
    </div>
  );
}

function StepFooter({ onBack, onNext, loading, nextLabel, nextIcon }: {
  onBack?: () => void; onNext: () => void; loading?: boolean; nextLabel: string; nextIcon?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 mt-6">
      {onBack && (
        <button onClick={onBack}
          className="h-12 px-5 rounded-full border border-gray-200 font-semibold text-gray-600 flex items-center gap-1.5 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={16} /> Quay lại
        </button>
      )}
      <button onClick={onNext} disabled={loading}
        className="flex-1 h-12 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: BRAND }}>
        {loading
          ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          : <>{nextIcon ?? null}{nextLabel}{!nextIcon && <ChevronRight size={16} />}</>
        }
      </button>
    </div>
  );
}
