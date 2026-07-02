import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

interface LoadingStateProps {
  title: string
  description?: string
  className?: string
}

export function LoadingState({ title, description, className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center py-10 text-center', className)}>
      <div className="space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-[1.1rem] bg-[var(--muted)] text-primary shadow-soft">
          <Sparkles className="size-7 animate-spin [animation-duration:1.8s]" />
        </div>
        <div className="space-y-1.5">
          <p className="font-serif text-2xl font-semibold leading-tight text-primary">{title}</p>
          {description ? (
            <p className="mx-auto max-w-md text-sm font-medium leading-6 text-on-surface-variant/80">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
