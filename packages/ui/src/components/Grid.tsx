import type { ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface GridProps {
  children: ReactNode
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Grid({ children, cols = {}, gap = 'md', className }: GridProps) {
  const { mobile = 1, tablet = 2, desktop = 3 } = cols

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${mobile}`,
        `md:grid-cols-${tablet}`,
        `lg:grid-cols-${desktop}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

interface GridItemProps {
  children: ReactNode
  span?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  className?: string
}

export function GridItem({ children, span = {}, className }: GridItemProps) {
  const { mobile = 1, tablet = 1, desktop = 1 } = span

  return (
    <div
      className={cn(
        `col-span-${mobile}`,
        `md:col-span-${tablet}`,
        `lg:col-span-${desktop}`,
        className
      )}
    >
      {children}
    </div>
  )
}
