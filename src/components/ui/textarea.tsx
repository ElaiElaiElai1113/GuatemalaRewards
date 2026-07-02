import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-[1.5rem] border border-border/80 bg-input px-4 py-3 text-sm text-foreground shadow-soft outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
