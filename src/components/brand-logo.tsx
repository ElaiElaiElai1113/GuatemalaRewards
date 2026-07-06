import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  markClassName?: string
  textClassName?: string
  compact?: boolean
  showText?: boolean
  'aria-label'?: string
}

export function BrandLogo({
  className,
  imageClassName,
  markClassName,
  textClassName,
  compact = false,
  showText = true,
  'aria-label': ariaLabel,
}: BrandLogoProps) {
  const imageSizeClass = markClassName ?? imageClassName ?? (compact ? 'w-[54px]' : 'w-[162px]')
  const shouldShowWordmark = showText && !imageClassName
  const logoSrc = shouldShowWordmark ? '/guatemala-rewards-mark.png' : '/guatemala-rewards-logo.png'

  return (
    <span className={cn('inline-flex min-w-0 items-center justify-center gap-2.5', className)} aria-label={ariaLabel}>
      <img
        src={logoSrc}
        alt={shouldShowWordmark ? '' : 'Guatemala Rewards'}
        className={cn(
          'block h-auto shrink-0 object-contain',
          imageSizeClass,
        )}
        aria-hidden={shouldShowWordmark ? 'true' : undefined}
        draggable={false}
      />
      {shouldShowWordmark ? (
        <span className={cn('truncate font-serif font-bold leading-none tracking-[-0.01em]', textClassName)}>
          Guatemala <span className="text-[#c9a84c]">Rewards</span>
        </span>
      ) : null}
      {shouldShowWordmark ? <span className="sr-only">Guatemala Rewards</span> : null}
    </span>
  )
}
