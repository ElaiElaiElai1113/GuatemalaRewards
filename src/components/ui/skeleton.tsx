import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('featured-shimmer rounded-md bg-[linear-gradient(90deg,var(--muted),var(--blush),var(--muted))] bg-[length:220%_100%] opacity-70', className)}
      {...props}
    />
  )
}

export { Skeleton }
