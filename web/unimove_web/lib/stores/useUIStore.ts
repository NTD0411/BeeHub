'use client'

import { create } from 'zustand'

export type BottomSheetName =
  | 'danh-dau-da-ban'
  | 'gia-han-tin'
  | 'an-tin'
  | 'hien-tin'
  | 'xoa-tin'
  | 'chon-dia-chi'
  | 'chon-loai-do'
  | 'bo-loc-cho'
  | 'xac-nhan-dat-chuyen'
  | 'shared-move'
  | 'xac-nhan-huy-don'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface AppToast {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface UIState {
  // Bottom sheet (single active at a time)
  activeSheet: BottomSheetName | null
  sheetData:   Record<string, unknown>

  // Toast queue
  toasts: AppToast[]

  // Route transition spinner
  isPageLoading: boolean

  /* ── Actions ── */
  openSheet:  (name: BottomSheetName, data?: Record<string, unknown>) => void
  closeSheet: () => void

  showToast:    (toast: Omit<AppToast, 'id'>) => void
  dismissToast: (id: string) => void

  // Convenience helpers
  showSuccess: (message: string) => void
  showError:   (message: string) => void
  showInfo:    (message: string) => void

  setPageLoading: (loading: boolean) => void
}

let _toastId = 0

export const useUIStore = create<UIState>((set) => ({
  activeSheet:   null,
  sheetData:     {},
  toasts:        [],
  isPageLoading: false,

  openSheet:  (name, data = {}) => set({ activeSheet: name, sheetData: data }),
  closeSheet: ()                 => set({ activeSheet: null, sheetData: {} }),

  showToast: (toast) => {
    const id       = String(++_toastId)
    const duration = toast.duration ?? 3000
    set((s) => ({ toasts: [...s.toasts, { ...toast, id, duration }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  showSuccess: (message) => {
    const id = String(++_toastId)
    set((s) => ({ toasts: [...s.toasts, { id, type: 'success', message, duration: 3000 }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },

  showError: (message) => {
    const id = String(++_toastId)
    set((s) => ({ toasts: [...s.toasts, { id, type: 'error', message, duration: 4000 }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },

  showInfo: (message) => {
    const id = String(++_toastId)
    set((s) => ({ toasts: [...s.toasts, { id, type: 'info', message, duration: 3000 }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },

  setPageLoading: (loading) => set({ isPageLoading: loading }),
}))
