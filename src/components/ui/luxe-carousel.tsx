import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Children, type CSSProperties, type ReactNode, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface LuxeCarouselProps {
  title: string
  eyebrow?: string
  description?: string
  children: ReactNode
  className?: string
  density?: 'comfortable' | 'compact'
}

export function LuxeCarousel({ title, eyebrow, description, children, className, density = 'comfortable' }: LuxeCarouselProps) {
  const carouselId = useId()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const items = Children.toArray(children).filter(Boolean)
  const slideWidth = density === 'compact'
    ? 'min-w-[82%] sm:min-w-[calc((100%_-_1.25rem)_/_2)] lg:min-w-[calc((100%_-_2.5rem)_/_3)] xl:min-w-[calc((100%_-_3.75rem)_/_4)] min-[1900px]:min-w-[calc((100%_-_5rem)_/_5)]'
    : items.length > 2
      ? 'min-w-full sm:min-w-[calc((100%_-_1.25rem)_/_2)] lg:min-w-[calc((100%_-_2.5rem)_/_3)]'
      : 'min-w-full sm:min-w-[calc((100%_-_1.25rem)_/_2)]'

  const scrollTo = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, items.length - 1))
    const scroller = scrollerRef.current

    if (!scroller) return

    const target = scroller.children.item(nextIndex) as HTMLElement | null
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    setActiveIndex(nextIndex)
  }

  const handleScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const nextIndex = Array.from(scroller.children).reduce(
      (closestIndex, child, index) => {
        const currentDistance = Math.abs((child as HTMLElement).offsetLeft - scroller.scrollLeft)
        const closestDistance = Math.abs(
          ((scroller.children.item(closestIndex) as HTMLElement | null)?.offsetLeft ?? 0) - scroller.scrollLeft,
        )

        return currentDistance < closestDistance ? index : closestIndex
      },
      0,
    )

    setActiveIndex(Math.max(0, Math.min(nextIndex, items.length - 1)))
  }

  if (items.length === 0) return null

  return (
    <section className={cn('animate-soft-reveal space-y-5', className)} aria-labelledby={carouselId}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-2">
          {eyebrow ? (
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 id={carouselId} className="font-serif text-4xl font-semibold leading-none text-primary-container md:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="text-sm font-medium leading-6 text-on-surface-variant/85">{description}</p>
          ) : null}
        </div>

        {items.length > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-muted"
              aria-label="Previous carousel item"
              onClick={() => scrollTo(activeIndex - 1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-muted"
              aria-label="Next carousel item"
              onClick={() => scrollTo(activeIndex + 1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="-mx-6 flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto scroll-smooth px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'animate-carousel-enter flex snap-start',
              slideWidth,
            )}
            style={{ '--stagger': index } as CSSProperties}
          >
            {item}
          </div>
        ))}
      </div>

      {items.length > 1 ? (
        <div className="flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                'h-2 rounded-full transition-all',
                activeIndex === index ? 'w-8 bg-primary' : 'w-2 bg-primary/25 hover:bg-primary/45',
              )}
              aria-label={`Go to carousel item ${index + 1}`}
              onClick={() => scrollTo(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
