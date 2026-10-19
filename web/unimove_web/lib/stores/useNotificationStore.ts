'use client'

import { create } from 'zustand'

export type NotificationType = 'tin-nhan' | 'don-hang' | 'san-pham' | 'he-thong'

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  'tin-nhan':  'Tin nhắn',
  'don-hang':  'Đơn hàng',
  'san-pham':  'Sản phẩm',
  'he-thong':  'Hệ thống',
}

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
  href?: string
  avatar?: string
  meta?: Record<string, string>
}

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number

  setNotifications: (items: AppNotification[]) => void
  prependNotification: (item: AppNotification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  setUnreadCount: (count: number) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount:   0,

  setNotifications: (items) =>
    set({
      notifications: items,
      unreadCount:   items.filter((n) => !n.isRead).length,
    }),

  prependNotification: (item) =>
    set((s) => ({
      notifications: [item, ...s.notifications],
      unreadCount:   s.unreadCount + (item.isRead ? 0 : 1),
    })),

  markRead: (id) =>
    set((s) => {
      const wasUnread = s.notifications.find((n) => n.id === id && !n.isRead)
      return {
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
      }
    }),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount:   0,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),
}))
