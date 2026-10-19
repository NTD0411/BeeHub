'use client'

import { create } from 'zustand'

export interface LatLng {
  lat: number
  lng: number
}

export interface BookingLocation {
  address: string
  name?: string
  coords?: LatLng
  savedAddressId?: string
}

export type ItemType =
  | 'ban-hoc'
  | 'tu-quan-ao'
  | 'giuong'
  | 'thung-carton'
  | 'xe-may'
  | 'may-tinh'
  | 'tu-lanh'
  | 'may-giat'
  | 'khac'

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  'ban-hoc':    'Bàn học',
  'tu-quan-ao': 'Tủ quần áo',
  'giuong':     'Giường / Đệm',
  'thung-carton': 'Thùng carton',
  'xe-may':     'Xe máy',
  'may-tinh':   'Máy tính / Điện tử',
  'tu-lanh':    'Tủ lạnh',
  'may-giat':   'Máy giặt',
  'khac':       'Đồ khác',
}

export const ITEM_TYPE_ICONS: Record<ItemType, string> = {
  'ban-hoc':      '🪑',
  'tu-quan-ao':   '🪞',
  'giuong':       '🛏',
  'thung-carton': '📦',
  'xe-may':       '🏍',
  'may-tinh':     '💻',
  'tu-lanh':      '🧊',
  'may-giat':     '🫧',
  'khac':         '📦',
}

export interface ServiceOption {
  id: string
  name: string
  description: string
  vehicle: string
  price: number
  estimatedMinutes: number
}

export const BOOKING_TOTAL_STEPS = 6

interface BookingState {
  currentStep: number
  pickup: BookingLocation | null
  dropoff: BookingLocation | null
  itemTypes: ItemType[]
  photos: string[]
  notes: string
  selectedService: ServiceOption | null
  isSharedMove: boolean

  // Pre-fill from marketplace "Đặt UniMove chuyển giúp bạn"
  prefillFromListing: (sellerLocation: BookingLocation) => void

  // Step navigation
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  // Location
  setPickup: (location: BookingLocation) => void
  setDropoff: (location: BookingLocation) => void

  // Items & media
  toggleItem: (item: ItemType) => void
  setPhotos: (photos: string[]) => void
  setNotes: (notes: string) => void

  // Service & shared
  setService: (service: ServiceOption) => void
  toggleSharedMove: () => void

  resetBooking: () => void
}

const INITIAL: Omit<
  BookingState,
  | 'prefillFromListing'
  | 'setStep' | 'nextStep' | 'prevStep'
  | 'setPickup' | 'setDropoff'
  | 'toggleItem' | 'setPhotos' | 'setNotes'
  | 'setService' | 'toggleSharedMove'
  | 'resetBooking'
> = {
  currentStep: 1,
  pickup: null,
  dropoff: null,
  itemTypes: [],
  photos: [],
  notes: '',
  selectedService: null,
  isSharedMove: false,
}

export const useBookingStore = create<BookingState>((set) => ({
  ...INITIAL,

  prefillFromListing: (sellerLocation) =>
    set({ pickup: sellerLocation, currentStep: 2 }),

  setStep:   (step) => set({ currentStep: step }),
  nextStep:  () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, BOOKING_TOTAL_STEPS) })),
  prevStep:  () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  setPickup:  (location) => set({ pickup: location }),
  setDropoff: (location) => set({ dropoff: location }),

  toggleItem: (item) =>
    set((s) => ({
      itemTypes: s.itemTypes.includes(item)
        ? s.itemTypes.filter((i) => i !== item)
        : [...s.itemTypes, item],
    })),

  setPhotos: (photos) => set({ photos }),
  setNotes:  (notes)  => set({ notes }),

  setService:       (service) => set({ selectedService: service }),
  toggleSharedMove: ()        => set((s) => ({ isSharedMove: !s.isSharedMove })),

  resetBooking: () => set(INITIAL),
}))
