export type ServiceTier = "economy" | "standard" | "premium";
export type AlleyAccess = "unknown" | "wide" | "narrow" | "no_car";
export type CargoVolume = "light" | "medium" | "heavy";

export interface ServicePackage {
  tier: ServiceTier;
  label: string;
  badge: string;
  subtitle: string;
  popular: boolean;
  transportBasePrice: number;
  laborSuggested: number;
  maxLaborCount: number;
  includedKm: number;
  extraKmPrice: number;
  extraLaborComboPrice: number;
  features: { text: string; included: boolean }[];
}

export interface PartnerOffer {
  id: string;
  name: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  price: number;
  vehicleLabel: string;
  offeredComboTiers: ServiceTier[];
  comboLaborUnitPrice?: number;
}

export interface InsurancePlan {
  id: string;
  name: string;
  tagline: string;
  coverageAmount: number;
  price: number;
  recommended?: boolean;
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    tier: "economy",
    label: "Combo nhẹ",
    subtitle: "Ít đồ · gợi ý 1 người",
    badge: "TIẾT KIỆM",
    popular: false,
    transportBasePrice: 134_000,
    laborSuggested: 1,
    maxLaborCount: 3,
    includedKm: 5,
    extraKmPrice: 8_000,
    extraLaborComboPrice: 65_000,
    features: [
      { text: "Vali, bàn, vài thùng — chuyến ngắn", included: true },
      { text: "Xe tải ~500kg · giá niêm yết cố định", included: true },
      { text: "Chọn 1–3 người khuân vác (giá combo)", included: true },
      { text: "Bảo hiểm hàng hóa", included: false },
    ],
  },
  {
    tier: "standard",
    label: "Combo phòng trọ",
    subtitle: "Đồ vừa · gợi ý 2 người",
    badge: "PHỔ BIẾN",
    popular: true,
    transportBasePrice: 300_000,
    laborSuggested: 2,
    maxLaborCount: 3,
    includedKm: 10,
    extraKmPrice: 7_000,
    extraLaborComboPrice: 75_000,
    features: [
      { text: "Giường, tủ, bếp — đa số sinh viên", included: true },
      { text: "Xe tải ~1 tấn · giá niêm yết cố định", included: true },
      { text: "Chọn 1–3 người khuân vác (giá combo)", included: true },
      { text: "Bảo hiểm cơ bản", included: true },
    ],
  },
  {
    tier: "premium",
    label: "Combo trọn gói",
    subtitle: "Nhiều đồ · gợi ý 3 người",
    badge: "TRỌN CHUYỂN",
    popular: false,
    transportBasePrice: 680_000,
    laborSuggested: 3,
    maxLaborCount: 4,
    includedKm: 15,
    extraKmPrice: 6_000,
    extraLaborComboPrice: 70_000,
    features: [
      { text: "Nhiều đồ lớn, cần đóng gói", included: true },
      { text: "Xe tải ~1.5 tấn · giá niêm yết cố định", included: true },
      { text: "Chọn 1–4 người khuân vác (giá combo)", included: true },
      { text: "Bảo hiểm toàn diện", included: true },
    ],
  },
];

export const INSURANCE_PLANS: InsurancePlan[] = [
  { id: "none", name: "Không mua bảo hiểm", tagline: "Tự chịu rủi ro", coverageAmount: 0, price: 0 },
  { id: "basic", name: "Bảo hiểm cơ bản", tagline: "Đồ sinh viên thông thường", coverageAmount: 10_000_000, price: 35_000 },
  { id: "standard", name: "Bảo hiểm tiêu chuẩn", tagline: "Phòng trọ đầy đủ đồ", coverageAmount: 30_000_000, price: 75_000, recommended: true },
  { id: "premium", name: "Bảo hiểm toàn diện", tagline: "Đồ giá trị cao", coverageAmount: 50_000_000, price: 120_000 },
];

export const MOCK_PARTNERS: PartnerOffer[] = [
  {
    id: "p1",
    name: "UniMove Test Transport",
    distanceKm: 1.2,
    rating: 4.9,
    reviewCount: 148,
    price: 250_000,
    vehicleLabel: "Xe tải 1 tấn",
    offeredComboTiers: ["economy", "standard", "premium"],
    comboLaborUnitPrice: 60_000,
  },
  {
    id: "p2",
    name: "Đà Nẵng Express",
    distanceKm: 2.4,
    rating: 4.7,
    reviewCount: 89,
    price: 280_000,
    vehicleLabel: "Xe tải 1.5 tấn",
    offeredComboTiers: ["standard", "premium"],
    comboLaborUnitPrice: 65_000,
  },
  {
    id: "p3",
    name: "SV Move Pro",
    distanceKm: 3.1,
    rating: 4.8,
    reviewCount: 203,
    price: 220_000,
    vehicleLabel: "Xe tải 500kg",
    offeredComboTiers: ["economy", "standard"],
    comboLaborUnitPrice: 55_000,
  },
];

export const SCHEDULE_SLOT_HOURS = [7, 8, 9, 13, 14, 15, 16] as const;

export const ALLEY_LABELS: Record<AlleyAccess, string> = {
  unknown: "Chưa rõ",
  wide: "Hẻm rộng (xe vào được)",
  narrow: "Hẻm hẹp",
  no_car: "Không xe vào được",
};

export const CARGO_LABELS: Record<CargoVolume, string> = {
  light: "Ít đồ",
  medium: "Vừa phải",
  heavy: "Nhiều đồ / nặng",
};

export type DormPhotoSection =
  | "pickupStairs"
  | "pickupAlley"
  | "destinationStairs"
  | "destinationAlley"
  | "cargo";

export const DORM_PHOTO_LABELS: Record<DormPhotoSection, string> = {
  pickupStairs: "Ảnh cầu thang trọ cũ",
  pickupAlley: "Ảnh hẻm / cổng trọ cũ",
  destinationStairs: "Ảnh cầu thang trọ mới",
  destinationAlley: "Ảnh hẻm / cổng trọ mới",
  cargo: "Ảnh đồ cần chuyển",
};

export const MAX_DORM_PHOTOS_PER_SECTION = 3;

export function isDormPhotoSectionVisible(
  section: DormPhotoSection,
  ctx: {
    pickupHasElevator: boolean;
    pickupAlleyAccess: AlleyAccess;
    hasElevator: boolean;
    destinationAlleyAccess: AlleyAccess;
    cargoVolume: CargoVolume;
  }
) {
  switch (section) {
    case "pickupStairs":
      return !ctx.pickupHasElevator;
    case "pickupAlley":
      return ctx.pickupAlleyAccess !== "wide";
    case "destinationStairs":
      return !ctx.hasElevator;
    case "destinationAlley":
      return ctx.destinationAlleyAccess !== "wide";
    case "cargo":
      return ctx.cargoVolume !== "light";
  }
}

export function packagePriceAtLabor(pkg: ServicePackage, laborCount: number) {
  return pkg.transportBasePrice + laborCount * pkg.extraLaborComboPrice;
}

export function tierVehicleSize(tier: ServiceTier) {
  if (tier === "economy") return "small_truck";
  if (tier === "premium") return "large_truck";
  return "medium_truck";
}
