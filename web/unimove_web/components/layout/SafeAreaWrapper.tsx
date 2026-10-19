import { cn } from '@/lib/utils'

interface SafeAreaWrapperProps {
  children: React.ReactNode
  className?: string
  sides?: Array<'top' | 'bottom' | 'left' | 'right'>
}

export function SafeAreaWrapper({
  children,
  className,
  sides = ['bottom'],
}: SafeAreaWrapperProps) {
  const style: React.CSSProperties = {}
  if (sides.includes('top'))    style.paddingTop    = 'env(safe-area-inset-top)'
  if (sides.includes('bottom')) style.paddingBottom = 'env(safe-area-inset-bottom)'
  if (sides.includes('left'))   style.paddingLeft   = 'env(safe-area-inset-left)'
  if (sides.includes('right'))  style.paddingRight  = 'env(safe-area-inset-right)'

  return (
    <div className={cn('', className)} style={style}>
      {children}
    </div>
  )
}
