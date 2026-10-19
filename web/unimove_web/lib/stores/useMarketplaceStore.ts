'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ── Enums & Label maps ────────────────────────────────────── */

export type MarketplaceTab    = 'kham-pha' | 'yeu-thich' | 'tin-cua-toi'
export type MyListingsSubtab  = 'dang-ban' | 'da-ban' | 'da-an'
export type SortOption        = 'moi-nhat' | 'gia-tang' | 'gia-giam' | 'gan-nhat'
export type ListingCondition  = 'moi' | 'nhu-moi' | 'con-tot' | 'da-dung-nhieu'
export type ListingCategory   =
  | 'noi-that'
  | 'dien-tu'
  | 'sach-tai-lieu'
  | 'quan-ao'
  | 'do-bep'
  | 'khac'

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  'noi-that':      'Nội thất',
  'dien-tu':       'Điện tử',
  'sach-tai-lieu': 'Sách & Tài liệu',
  'quan-ao':       'Quần áo',
  'do-bep':        'Đồ bếp',
  'khac':          'Khác',
}

export const CATEGORY_ICONS: Record<ListingCategory, string> = {
  'noi-that':      '🪑',
  'dien-tu':       '📱',
  'sach-tai-lieu': '📚',
  'quan-ao':       '👕',
  'do-bep':        '🍳',
  'khac':          '📦',
}

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  'moi':           'Mới',
  'nhu-moi':       'Như mới',
  'con-tot':       'Còn tốt',
  'da-dung-nhieu': 'Đã dùng nhiều',
}

export const SORT_LABELS: Record<SortOption, string> = {
  'moi-nhat':  'Mới nhất',
  'gia-tang':  'Giá tăng dần',
  'gia-giam':  'Giá giảm dần',
  'gan-nhat':  'Gần nhất',
}

/* ── Listing draft ─────────────────────────────────────────── */

export interface ListingDraft {
  category: ListingCategory | null
  photos: string[]
  title: string
  price: string
  isNegotiable: boolean
  condition: ListingCondition | null
  description: string
  location: string
  locationCoords?: { lat: number; lng: number }
  availableTime: string
  isUrgent: boolean
}

const INITIAL_DRAFT: ListingDraft = {
  category:      null,
  photos:        [],
  title:         '',
  price:         '',
  isNegotiable:  false,
  condition:     null,
  description:   '',
  location:      '',
  availableTime: '',
  isUrgent:      false,
}

export const LISTING_TOTAL_STEPS = 5

/* ── Store interface ───────────────────────────────────────── */

interface MarketplaceState {
  // Navigation
  activeTab:          MarketplaceTab
  myListingsSubtab:   MyListingsSubtab

  // Search & filters
  searchQuery:      string
  selectedCategory: ListingCategory | null
  sortBy:           SortOption
  priceMin:         string
  priceMax:         string

  // Persisted: saved listings (survives page refresh)
  savedListingIds: string[]

  // Create / edit listing
  listingDraft:       ListingDraft
  currentListingStep: number
  editingListingId:   string | null

  /* ── Actions ── */
  setTab:              (tab: MarketplaceTab)         => void
  setMyListingsSubtab: (subtab: MyListingsSubtab)    => void

  setSearch:    (query: string)                  => void
  setCategory:  (category: ListingCategory | null) => void
  setSort:      (sort: SortOption)               => void
  setPriceRange: (min: string, max: string)      => void
  resetFilters: ()                               => void

  toggleSave: (id: string) => void
  isSaved:    (id: string) => boolean

  setListingStep: (step: number)                      => void
  nextListingStep: ()                                  => void
  prevListingStep: ()                                  => void
  updateDraft:    (updates: Partial<ListingDraft>)    => void
  startEdit:      (id: string, data: Partial<ListingDraft>) => void
  resetDraft:     ()                                  => void
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      activeTab:          'kham-pha',
      myListingsSubtab:   'dang-ban',
      searchQuery:        '',
      selectedCategory:   null,
      sortBy:             'moi-nhat',
      priceMin:           '',
      priceMax:           '',
      savedListingIds:    [],
      listingDraft:       INITIAL_DRAFT,
      currentListingStep: 1,
      editingListingId:   null,

      setTab:              (tab)    => set({ activeTab: tab }),
      setMyListingsSubtab: (subtab) => set({ myListingsSubtab: subtab }),

      setSearch:   (query)          => set({ searchQuery: query }),
      setCategory: (category)       => set({ selectedCategory: category }),
      setSort:     (sort)           => set({ sortBy: sort }),
      setPriceRange: (min, max)     => set({ priceMin: min, priceMax: max }),
      resetFilters: ()              => set({
        searchQuery:      '',
        selectedCategory: null,
        sortBy:           'moi-nhat',
        priceMin:         '',
        priceMax:         '',
      }),

      toggleSave: (id) =>
        set((s) => ({
          savedListingIds: s.savedListingIds.includes(id)
            ? s.savedListingIds.filter((sid) => sid !== id)
            : [...s.savedListingIds, id],
        })),

      isSaved: (id) => get().savedListingIds.includes(id),

      setListingStep: (step) => set({ currentListingStep: step }),
      nextListingStep: ()    => set((s) => ({
        currentListingStep: Math.min(s.currentListingStep + 1, LISTING_TOTAL_STEPS),
      })),
      prevListingStep: ()    => set((s) => ({
        currentListingStep: Math.max(s.currentListingStep - 1, 1),
      })),

      updateDraft: (updates) =>
        set((s) => ({ listingDraft: { ...s.listingDraft, ...updates } })),

      startEdit: (id, data) =>
        set({
          editingListingId:   id,
          listingDraft:       { ...INITIAL_DRAFT, ...data },
          currentListingStep: 1,
        }),

      resetDraft: () =>
        set({
          listingDraft:       INITIAL_DRAFT,
          currentListingStep: 1,
          editingListingId:   null,
        }),
    }),
    {
      name: 'unimove-marketplace',
      // Only persist favourites — the rest is transient UI state
      partialize: (s) => ({ savedListingIds: s.savedListingIds }),
    }
  )
)
