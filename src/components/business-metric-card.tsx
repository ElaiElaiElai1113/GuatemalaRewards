import type { ReactNode } from 'react'

interface BusinessMetricCardProps {
  title: string
  value: string
  icon: ReactNode
  helper?: string
  trend?: string
  trendUp?: boolean
}

export function BusinessMetricCard({ title, value, icon, helper, trend, trendUp }: BusinessMetricCardProps) {
  return (
    <div className="luxe-card animate-card-stagger rounded-[1rem] p-4 text-card-foreground xl:rounded-[1.15rem]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">{title}</span>
        <div className="luxe-art shrink-0 rounded-[0.8rem] p-2">
          {icon}
        </div>
      </div>
      <div>
        <p className="font-serif text-3xl font-semibold leading-none text-primary-container">{value}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendUp ? 'text-success' : 'text-error'}`}>
            {trend}
          </p>
        )}
        {!trend && helper ? (
          <p className="mt-1.5 text-xs font-medium leading-4 text-[var(--muted-foreground)]">{helper}</p>
        ) : null}
      </div>
    </div>
  )
}
