import type { LucideIcon } from 'lucide-react'



interface MetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  helper: string
}

export function MetricCard({ label, value, icon: Icon, helper }: MetricCardProps) {
  return (
    <div className="luxe-card animate-card-stagger rounded-[1.5rem] p-6 text-card-foreground">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--muted-foreground)]">{label}</span>
        <div className="luxe-art rounded-[1rem] p-2.5">
          <Icon className="size-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-serif text-4xl font-semibold leading-none text-primary-container">{value}</p>
        <p className="mt-2 text-xs font-medium text-[var(--muted-foreground)]">{helper}</p>
      </div>
    </div>
  )
}
