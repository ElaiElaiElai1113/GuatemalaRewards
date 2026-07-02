import * as React from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type CompactSearchProps = React.ComponentProps<'input'> & {
  wrapperClassName?: string
}

export function CompactSearch({ className, wrapperClassName, type = 'search', ...props }: CompactSearchProps) {
  return (
    <div className={cn('relative w-full sm:w-72', wrapperClassName)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/55" />
      <Input
        type={type}
        className={cn(
          'h-10 rounded-full border-outline-variant/20 bg-[var(--card)] py-2 pl-10 pr-4 text-sm shadow-sm placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25',
          className,
        )}
        {...props}
      />
    </div>
  )
}
