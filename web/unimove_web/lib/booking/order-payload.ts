import type { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { tierVehicleSize, ALLEY_LABELS, CARGO_LABELS, SCHEDULE_SLOT_HOURS } from "./constants";

type FlowState = ReturnType<typeof useBookingFlowStore.getState>;

function normalizeAscii(s: string) {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const DA_NANG_DISTRICT_KEYWORDS = [
  "ngu hanh son",
  "hai chau",
  "thanh khe",
  "son tra",
  "cam le",
  "lien chieu",
  "hoa vang",
  "hoa khanh",
  "thanh binh",
  "an hai",
  "an khe",
  "man thai",
  "hoa cuong",
  "hoa xuan",
];

function mentionsDaNang(text: string) {
  const n = normalizeAscii(text);
  return n.includes("da nang") || n.includes("danang");
}

function isDaNangDistrictName(text: string) {
  const n = normalizeAscii(text);
  return DA_NANG_DISTRICT_KEYWORDS.some((k) => n.includes(k));
}

function splitAddress(full: string) {
  const parts = full.split(",").map((s) => s.trim()).filter(Boolean);

  if (mentionsDaNang(full)) {
    const districtPart =
      parts.find((p) => isDaNangDistrictName(p)) ??
      (parts.length >= 2 && !mentionsDaNang(parts[parts.length - 1])
        ? parts[parts.length - 2]
        : parts[0] ?? "");
    return { address: full, city: "Đà Nẵng", district: districtPart };
  }

  const last = parts[parts.length - 1] ?? "";
  if (isDaNangDistrictName(last)) {
    return { address: full, city: "Đà Nẵng", district: last };
  }

  const district = parts.length >= 2 ? parts[parts.length - 2] : "";
  const city = parts.length >= 1 ? parts[parts.length - 1] : "";
  return { address: full, district, city };
}

function formatNotes(opts: {
  alley: string;
  cargo?: string;
  extra?: string;
  imageCount?: number;
  isPickup: boolean;
}) {
  const bits: string[] = [];
  if (opts.alley && opts.alley !== "unknown") bits.push(`Hẻm: ${opts.alley}`);
  if (!opts.isPickup && opts.cargo) bits.push(`Khối lượng: ${opts.cargo}`);
  if (opts.extra?.trim()) bits.push(opts.extra.trim());
  if (opts.imageCount && opts.imageCount > 0) bits.push(`Ảnh đính kèm: ${opts.imageCount}`);
  return bits.join(" · ") || undefined;
}

export function buildOrderPayload(
  state: FlowState,
  opts: { basePrice: number; totalPrice: number; quoteReferenceId?: string }
) {
  const pickup = splitAddress(state.pickup);
  const delivery = splitAddress(state.destination);
  const tier = state.selectedTier;
  const vehicleSize = tierVehicleSize(tier);
  const serviceType = tier === "premium" ? "premium" : "standard";

  const helpers = state.isComboBooking ? state.selectedComboLaborCount : 0;

  const alleyLabel = (v: string) => (ALLEY_LABELS as Record<string, string>)[v] ?? v;
  const cargoLabel = (v?: string) => (v ? (CARGO_LABELS as Record<string, string>)[v] ?? v : undefined);

  const imageCount = state.dormImageCount();

  const porterHintNote =
    state.wantsTransportLabor && state.transportLaborHelpers > 0
      ? `Nhu cầu khuân vác (tham khảo cho nhà xe): ~${state.transportLaborHelpers} người`
      : undefined;

  const noteExtra = [state.dormNote.trim(), porterHintNote].filter(Boolean).join(" · ") || undefined;

  let pickupNotes = formatNotes({
    alley: alleyLabel(state.pickupAlleyAccess),
    extra: noteExtra,
    imageCount,
    isPickup: true,
  });
  if (opts.quoteReferenceId) {
    pickupNotes = [pickupNotes, `Mã báo giá: ${opts.quoteReferenceId}`].filter(Boolean).join(" · ");
  }

  const deliveryNotes = formatNotes({
    alley: alleyLabel(state.destinationAlleyAccess),
    cargo: cargoLabel(state.cargoVolume),
    extra: noteExtra,
    imageCount,
    isPickup: false,
  });

  const photoUrls = state.dormImageUrls.length > 0 ? state.dormImageUrls : undefined;

  return {
    vehicle_size: vehicleSize,
    service_type: serviceType,
    pickup_address: pickup.address,
    pickup_city: pickup.city,
    pickup_district: pickup.district,
    pickup_floor: state.pickupFloor,
    pickup_has_elevator: state.pickupHasElevator,
    ...(state.pickupLat != null ? { pickup_latitude: state.pickupLat } : {}),
    ...(state.pickupLng != null ? { pickup_longitude: state.pickupLng } : {}),
    pickup_notes: pickupNotes,
    delivery_address: delivery.address,
    delivery_city: delivery.city,
    delivery_district: delivery.district,
    ...(state.destinationLat != null ? { delivery_latitude: state.destinationLat } : {}),
    ...(state.destinationLng != null ? { delivery_longitude: state.destinationLng } : {}),
    delivery_floor: state.floorCount,
    delivery_has_elevator: state.hasElevator,
    delivery_notes: deliveryNotes,
    base_price: opts.basePrice,
    distance_price: 0,
    floor_price: 0,
    service_fee: 0,
    total_price: opts.totalPrice,
    number_of_rooms: 1,
    requires_helpers: helpers > 0,
    number_of_helpers: helpers,
    quote_request: !!opts.quoteReferenceId,
    ...(state.scheduledPickupAt
      ? { scheduled_pickup_time: new Date(state.scheduledPickupAt).toISOString() }
      : {}),
    ...(state.selectedPartnerId ? { provider_id: state.selectedPartnerId } : {}),
    ...(photoUrls ? { dorm_image_urls: photoUrls, description: `Ảnh mô tả: ${photoUrls.length} tấm` } : {}),
  };
}

export function isValidPickupTime(d: Date) {
  return d.getTime() - Date.now() >= 1 * 60 * 60 * 1000;
}

/** Khung giờ còn chọn được trong ngày `day` (YYYY-MM-DD, giờ local). */
export function getAvailableScheduleSlots(day: string, now = new Date()): number[] {
  const [y, m, d] = day.split("-").map(Number);
  return SCHEDULE_SLOT_HOURS.filter((hour) => {
    const slot = new Date(y, m - 1, d, hour, 0, 0, 0);
    return slot.getTime() - now.getTime() >= 1 * 60 * 60 * 1000;
  });
}

export function toLocalDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Gợi ý ngày/giờ hợp lệ, snap vào khung giờ có sẵn. */
export function resolveScheduleSelection(preferred?: Date) {
  const base = preferred ?? defaultPickupSuggestion();
  let day = toLocalDateInputValue(base);
  let available = getAvailableScheduleSlots(day);

  for (let i = 0; i < 14 && available.length === 0; i++) {
    const [y, m, d] = day.split("-").map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + 1);
    day = toLocalDateInputValue(next);
    available = getAvailableScheduleSlots(day);
  }

  const preferredHour = base.getHours();
  const hour = available.includes(preferredHour)
    ? preferredHour
    : available.find((h) => h >= preferredHour) ?? available[0] ?? 9;

  return { day, hour };
}

export function defaultPickupSuggestion() {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  if (d.getHours() < 7) d.setHours(9, 0, 0, 0);
  if (d.getHours() > 16) {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  }
  return d;
}
