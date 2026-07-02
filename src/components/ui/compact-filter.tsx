import * as React from 'react'
import { ChevronDown, Filter } from 'lucide-react'

import { cn } from '@/lib/utils'

export type CompactFilterOption = {
  value: string
  label: string
  count?: number
}

type CompactFilterProps = Omit<React.ComponentProps<'select'>, 'children'> & {
  options: CompactFilterOption[]
  wrapperClassName?: string
}

export function CompactFilter({ className, options, wrapperClassName, ...props }: CompactFilterProps) {
  return (
    <div className={cn('relative w-full sm:w-48', wrapperClassName)}>
      <Filter className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/55" />
      <select
        className={cn(
          'h-10 w-full appearance-none rounded-full border border-outline-variant/20 bg-[var(--card)] py-2 pl-10 pr-9 text-sm font-semibold text-primary shadow-sm outline-none transition focus:border-primary/30 focus-visible:ring-2 focus-visible:ring-primary-container/25',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.count === undefined ? option.label : `${option.label} (${option.count})`}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/55" />
    </div>
  )
}
