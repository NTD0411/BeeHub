import { WifiOff, ServerCrash, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'

type ErrorType = 'network' | 'not-found' | 'generic'

const CONFIGS = {
  network: {
    Icon:        WifiOff,
    title:       'Không có kết nối mạng',
    description: 'Kiểm tra kết nối WiFi hoặc dữ liệu di động của bạn.',
    iconClass:   'text-muted-foreground',
    bgClass:     'bg-surface-2',
  },
  'not-found': {
    Icon:        SearchX,
    title:       'Không tìm thấy nội dung',
    description: 'Nội dung này không tồn tại hoặc đã bị xoá.',
    iconClass:   'text-muted-foreground',
    bgClass:     'bg-surface-2',
  },
  generic: {
    Icon:        ServerCrash,
    title:       'Đã có lỗi xảy ra',
    description: 'Vui lòng thử lại sau ít phút.',
    iconClass:   'text-error',
    bgClass:     'bg-error-light',
  },
} as const

interface ErrorStateProps {
  type?:      ErrorType
  message?:   string
  onRetry?:   () => void
  className?: string
}

export function ErrorState({ type = 'generic', message, onRetry, className }: ErrorStateProps) {
  const { Icon, title, description, iconClass, bgClass } = CONFIGS[type]

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', className)}
      role="alert"
    >
      <div className={cn('flex h-16 w-16 items-center justify-center rounded-full', bgClass)}>
        <Icon className={cn('h-7 w-7', iconClass)} strokeWidth={1.5} />
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{message ?? description}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-button bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark active:scale-95"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}
