"use client";

import { create } from "zustand";
import {
  type ServiceTier,
  type AlleyAccess,
  type CargoVolume,
  type DormPhotoSection,
  SERVICE_PACKAGES,
  INSURANCE_PLANS,
  MAX_DORM_PHOTOS_PER_SECTION,
} from "@/lib/booking/constants";

export type BookingServiceKind = "fullMove" | "combo" | "laborAddon" | "laborOnly";

export interface DormPhotoItem {
  id: string;
  previewUrl: string;
  file: File;
  uploadedUrl?: string;
}

interface BookingFlowState {
  serviceKind: BookingServiceKind;
  isComboBooking: boolean;
  bookingModeChosen: boolean;

  pickup: string;
  pickupLat: number | null;
  pickupLng: number | null;
  destination: string;
  destinationLat: number | null;
  destinationLng: number | null;

  pickupFloor: number;
  pickupHasElevator: boolean;
  pickupAlleyAccess: AlleyAccess;
  floorCount: number;
  hasElevator: boolean;
  destinationAlleyAccess: AlleyAccess;
  cargoVolume: CargoVolume;
  dormNote: string;
  dormPhotos: Partial<Record<DormPhotoSection, DormPhotoItem[]>>;
  dormImageUrls: string[];

  wantsTransportLabor: boolean;
  transportLaborHelpers: number;
  transportLaborHours: number;

  scheduledPickupAt: string | null;

  selectedTier: ServiceTier;
  selectedComboLaborCount: number;
  selectedPartnerId: string | null;
  selectedInsurancePlanId: string;
  discountCode: string;
  discountApplied: boolean;

  linkedOrderId: string | null;
  quoteOrderId: string | null;

  setServiceKind: (k: BookingServiceKind) => void;
  setIsComboBooking: (v: boolean) => void;
  setBookingMode: (mode: "combo" | "quote") => void;
  setPickup: (address: string, lat?: number | null, lng?: number | null) => void;
  setDestination: (address: string, lat?: number | null, lng?: number | null) => void;
  setDormDetails: (p: Partial<Pick<BookingFlowState,
    "pickupFloor" | "pickupHasElevator" | "pickupAlleyAccess" |
    "floorCount" | "hasElevator" | "destinationAlleyAccess" |
    "cargoVolume" | "dormNote" | "wantsTransportLabor" |
    "transportLaborHelpers" | "transportLaborHours"
  >>) => void;
  setScheduledPickupAt: (iso: string | null) => void;
  setSelectedTier: (t: ServiceTier) => void;
  setComboLaborCount: (n: number) => void;
  setSelectedPartnerId: (id: string | null) => void;
  setInsurancePlanId: (id: string) => void;
  setDiscountCode: (code: string) => void;
  applyDiscount: () => void;
  setLinkedOrderId: (id: string | null) => void;
  setQuoteOrderId: (id: string | null) => void;
  addDormPhoto: (section: DormPhotoSection, file: File) => void;
  removeDormPhoto: (section: DormPhotoSection, index: number) => void;
  setDormImageUrls: (urls: string[]) => void;
  dormImageCount: () => number;
  allDormPhotoItems: () => DormPhotoItem[];
  resetFlow: () => void;

  movePackagePrice: () => number;
  comboLaborFee: () => number;
  insuranceFee: () => number;
  discountAmount: () => number;
  total: () => number;
}

const INITIAL = {
  serviceKind: "fullMove" as BookingServiceKind,
  isComboBooking: false,
  bookingModeChosen: false,
  pickup: "",
  pickupLat: null as number | null,
  pickupLng: null as number | null,
  destination: "",
  destinationLat: null as number | null,
  destinationLng: null as number | null,
  pickupFloor: 1,
  pickupHasElevator: true,
  pickupAlleyAccess: "unknown" as AlleyAccess,
  floorCount: 1,
  hasElevator: true,
  destinationAlleyAccess: "unknown" as AlleyAccess,
  cargoVolume: "medium" as CargoVolume,
  dormNote: "",
  dormPhotos: {} as Partial<Record<DormPhotoSection, DormPhotoItem[]>>,
  dormImageUrls: [] as string[],
  wantsTransportLabor: false,
  transportLaborHelpers: 2,
  transportLaborHours: 2,
  scheduledPickupAt: null as string | null,
  selectedTier: "standard" as ServiceTier,
  selectedComboLaborCount: 2,
  selectedPartnerId: null as string | null,
  selectedInsurancePlanId: "standard",
  discountCode: "",
  discountApplied: false,
  linkedOrderId: null as string | null,
  quoteOrderId: null as string | null,
};

export const useBookingFlowStore = create<BookingFlowState>((set, get) => ({
  ...INITIAL,

  setServiceKind: (k) => set({
    serviceKind: k,
    isComboBooking: k === "combo",
  }),
  setIsComboBooking: (v) => set({ isComboBooking: v, serviceKind: v ? "combo" : "fullMove" }),

  setBookingMode: (mode) =>
    set({
      bookingModeChosen: true,
      isComboBooking: mode === "combo",
      serviceKind: mode === "combo" ? "combo" : "fullMove",
    }),

  setPickup: (address, lat = null, lng = null) => set({ pickup: address, pickupLat: lat ?? null, pickupLng: lng ?? null }),
  setDestination: (address, lat = null, lng = null) => set({
    destination: address,
    destinationLat: lat ?? null,
    destinationLng: lng ?? null,
  }),

  setDormDetails: (p) => set(p),

  setScheduledPickupAt: (iso) => set({ scheduledPickupAt: iso }),
  setSelectedTier: (t) => {
    const pkg = SERVICE_PACKAGES.find((x) => x.tier === t);
    set({ selectedTier: t, selectedComboLaborCount: pkg?.laborSuggested ?? 2 });
  },
  setComboLaborCount: (n) => set({ selectedComboLaborCount: n }),
  setSelectedPartnerId: (id) => set({ selectedPartnerId: id }),
  setInsurancePlanId: (id) => set({ selectedInsurancePlanId: id }),
  setDiscountCode: (code) => set({ discountCode: code, discountApplied: false }),
  applyDiscount: () => {
    const code = get().discountCode.trim().toUpperCase();
    set({ discountApplied: code === "UNIMOVE50" });
  },
  setLinkedOrderId: (id) => set({ linkedOrderId: id }),
  setQuoteOrderId: (id) => set({ quoteOrderId: id }),

  addDormPhoto: (section, file) => {
    const current = get().dormPhotos[section] ?? [];
    if (current.length >= MAX_DORM_PHOTOS_PER_SECTION) return;
    const item: DormPhotoItem = {
      id: `${section}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      previewUrl: URL.createObjectURL(file),
      file,
    };
    set({
      dormPhotos: {
        ...get().dormPhotos,
        [section]: [...current, item],
      },
    });
  },

  removeDormPhoto: (section, index) => {
    const current = [...(get().dormPhotos[section] ?? [])];
    const removed = current.splice(index, 1)[0];
    if (removed?.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    const next = { ...get().dormPhotos };
    if (current.length) next[section] = current;
    else delete next[section];
    set({ dormPhotos: next });
  },

  setDormImageUrls: (urls) => set({ dormImageUrls: urls }),

  dormImageCount: () =>
    Object.values(get().dormPhotos).reduce((sum, list) => sum + (list?.length ?? 0), 0),

  allDormPhotoItems: () =>
    Object.values(get().dormPhotos).flatMap((list) => list ?? []),

  resetFlow: () => {
    Object.values(get().dormPhotos).forEach((list) => {
      list?.forEach((p) => {
        if (p.previewUrl.startsWith("blob:")) URL.revokeObjectURL(p.previewUrl);
      });
    });
    set({ ...INITIAL, dormPhotos: {}, dormImageUrls: [] });
  },

  movePackagePrice: () => {
    const s = get();
    if (!s.isComboBooking) return 0;
    const pkg = SERVICE_PACKAGES.find((x) => x.tier === s.selectedTier);
    return pkg?.transportBasePrice ?? 0;
  },

  comboLaborFee: () => {
    const s = get();
    if (!s.isComboBooking) return 0;
    const pkg = SERVICE_PACKAGES.find((x) => x.tier === s.selectedTier);
    if (!pkg) return 0;
    return s.selectedComboLaborCount * pkg.extraLaborComboPrice;
  },

  insuranceFee: () => {
    const plan = INSURANCE_PLANS.find((p) => p.id === get().selectedInsurancePlanId);
    return plan?.price ?? 0;
  },

  discountAmount: () => (get().discountApplied ? 35_000 : 0),

  total: () => {
    const s = get();
    if (s.isComboBooking) {
      return s.movePackagePrice() + s.comboLaborFee() + s.insuranceFee() - s.discountAmount();
    }
    return 0;
  },
}));
