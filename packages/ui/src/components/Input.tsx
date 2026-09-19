import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type LucideIcon, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: LucideIcon
}

export function Input({ label, error, icon: Icon, className, type, style, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div className="relative w-full overflow-visible">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
            <Icon size={18} />
          </div>
        )}
        <input
          className={cn(
            'w-full rounded-lg border border-gray-600 bg-gray-700 py-2 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          type={resolvedType}
          style={{
            ...style,
            paddingLeft: Icon ? '2.75rem' : '1rem',
            paddingRight: isPassword ? '2rem' : '1rem'
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute text-gray-400 hover:text-gray-300 z-20 pointer-events-auto"
            style={{ right: '20px', top: '50%', transform: 'translateY(-50%)' }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
