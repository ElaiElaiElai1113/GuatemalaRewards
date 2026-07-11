import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import type { Business } from '@/types/domain'

interface BusinessFilterProps {
  businesses: Business[]
  selected: string | null // null = "All"
  onChange: (businessId: string | null) => void
}

export function BusinessFilter({ businesses, selected, onChange }: BusinessFilterProps) {
  const { t } = useLanguage()
  const activeChip = 'luxe-chip-active shrink-0 px-5 hover:bg-[var(--champagne)] hover:text-[var(--espresso)] sm:px-8'
  const inactiveChip = 'luxe-chip-muted shrink-0 hover:border-primary/60 hover:bg-[var(--espresso-soft)] hover:text-[var(--cream)]'

  return (
    <div className="animate-soft-reveal min-w-0 rounded-[1.35rem] border border-primary/25 bg-[var(--espresso)] px-4 py-3 shadow-luxe">
      <span className="mb-3 block text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--champagne)] sm:mb-0 sm:mr-2 sm:inline-block">
        {t('Business:')}
      </span>
      <div className="-mx-1 flex min-w-0 items-center gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:mx-0 sm:inline-flex sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
      <Button
        variant={selected === null ? 'tertiary' : 'ghost'}
        size="sm"
        className={selected === null ? activeChip : inactiveChip}
        onClick={() => onChange(null)}
      >
        {t('All Businesses')}
      </Button>
      {businesses.map((business) => (
        <Button
          key={business.id}
          variant={selected === business.id ? 'tertiary' : 'ghost'}
          size="sm"
          className={selected === business.id ? activeChip : inactiveChip}
          onClick={() => onChange(business.id)}
        >
          <span className="max-w-[12rem] truncate">{business.name}</span>
        </Button>
      ))}
      </div>
    </div>
  )
}
