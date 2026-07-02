import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'luxe-card animate-soft-reveal flex flex-col items-center justify-center rounded-[2rem] px-6 py-16 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="luxe-art animate-float-soft mb-6 flex size-20 items-center justify-center rounded-[1.5rem] shadow-soft">
          {icon}
        </div>
      ) : null}
      <h3 className="relative font-serif text-3xl text-primary-container">{title}</h3>
      {description ? (
        <p className="relative mt-3 max-w-md text-sm font-medium leading-6 text-on-surface-variant/80">{description}</p>
      ) : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  )
}
