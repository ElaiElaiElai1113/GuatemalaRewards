import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.1em] uppercase',
  {
    variants: {
      variant: {
        default: 'border border-primary/15 bg-[var(--muted)] text-[var(--muted-foreground)]',
        tenant: 'featured-shimmer border border-primary/15 bg-[linear-gradient(90deg,var(--tenant-accent-soft),var(--blush),var(--tenant-accent-soft))] text-[var(--foreground)]',
        accent: 'featured-shimmer border border-primary/15 bg-[linear-gradient(90deg,var(--tenant-accent-soft),var(--blush),var(--tenant-accent-soft))] text-[var(--foreground)]',
        success: 'border border-success/25 bg-success/12 text-success',
        outline: 'border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]',
        secondary: 'border border-primary/10 bg-[var(--muted)] text-[var(--foreground)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
