import type { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'mobile' | 'compact'
  onClick?: () => void
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className, variant = 'default', onClick }: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-200'
  
  const variants = {
    default: 'bg-gray-800 border border-gray-700 p-6',
    glass: 'bg-gray-800/50 backdrop-blur-lg border border-gray-700/50 p-6',
    mobile: 'bg-gray-800 border border-gray-700 p-4 md:p-6',
    compact: 'bg-gray-800 border border-gray-700 p-3',
  }
  
  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        onClick && 'cursor-pointer hover:bg-gray-700/50 active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 md:mb-6', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 md:mt-6 pt-4 border-t border-gray-700', className)}>
      {children}
    </div>
  )
}
