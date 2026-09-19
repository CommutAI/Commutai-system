import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useEffect, useState } from 'react'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ToastColor = 'success' | 'danger' | 'warning' | 'info'

interface ToastProps {
  isOpen: boolean
  message: string
  color?: ToastColor
  duration?: number
  onDismiss: () => void
}

const iconMap = {
  success: CheckCircle2,
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorStyles = {
  success: 'bg-green-500/90 border-green-400',
  danger: 'bg-red-500/90 border-red-400',
  warning: 'bg-yellow-500/90 border-yellow-400',
  info: 'bg-blue-500/90 border-blue-400',
}

const iconColors = {
  success: 'text-green-200',
  danger: 'text-red-200',
  warning: 'text-yellow-200',
  info: 'text-blue-200',
}

export function Toast({
  isOpen,
  message,
  color = 'success',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      const timer = setTimeout(() => {
        onDismiss()
      }, duration)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [isOpen, duration, onDismiss])

  if (!visible) return null

  const Icon = iconMap[color]

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm',
          colorStyles[color]
        )}
      >
        <Icon size={20} className={iconColors[color]} />
        <span className="text-white font-medium text-sm">{message}</span>
        <button
          onClick={onDismiss}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
