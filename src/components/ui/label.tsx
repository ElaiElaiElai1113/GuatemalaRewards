import * as React from 'react'

import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      className={cn('ml-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/85', className)}
      {...props}
    />
  )
}

export { Label }
