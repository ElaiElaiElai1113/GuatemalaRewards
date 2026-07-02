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
  const activeChip = 'luxe-chip-active px-8 hover:bg-[var(--champagne)] hover:text-[var(--espresso)]'
  const inactiveChip = 'luxe-chip-muted hover:border-primary/60 hover:bg-[var(--espresso-soft)] hover:text-[var(--cream)]'

  return (
    <div className="animate-soft-reveal flex flex-wrap items-center gap-3 rounded-[1.35rem] border border-primary/25 bg-[var(--espresso)] px-4 py-3 shadow-luxe">
      <span className="mr-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--champagne)]">
        {t('Business:')}
      </span>
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
          {business.name}
        </Button>
      ))}
    </div>
  )
}
