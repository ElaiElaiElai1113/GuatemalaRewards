import { zodResolver } from '@hookform/resolvers/zod'
import { Gift, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompactFilter } from '@/components/ui/compact-filter'
import { CompactSearch } from '@/components/ui/compact-search'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAwardPoints,
  useBusinessMembers,
  useBusinessOwnerData,
  useRegisterCustomer,
} from '@/hooks/use-business-owner-data'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/language'
import { searchMatches } from '@/lib/search'
import { getVerificationStatusLabel } from '@/lib/status-labels'
import { cn, formatPoints, getInitials } from '@/lib/utils'
import {
  registerCustomerSchema,
  rewardAdjustmentSchema,
  type RegisterCustomerFormValues,
  type RewardAdjustmentFormValues,
} from '@/types/forms'

type CustomerStatusFilter = 'all' | 'under_review' | 'approved' | 'missing_document' | 'rejected'

function matchesCustomerStatusFilter(
  member: { verificationStatus?: 'not_submitted' | 'pending_document' | 'submitted' | 'verified' | 'rejected' },
  filter: CustomerStatusFilter,
) {
  if (filter === 'all') return true
  if (filter === 'under_review') return member.verificationStatus === 'submitted'
  if (filter === 'approved') return member.verificationStatus === 'verified'
  if (filter === 'rejected') return member.verificationStatus === 'rejected'
  return member.verificationStatus !== 'submitted' && member.verificationStatus !== 'verified' && member.verificationStatus !== 'rejected'
}

export function MembersPage() {
  const { profile } = useAuth()
  const { t } = useLanguage()
  const { business, metrics } = useBusinessOwnerData()
  const members = useBusinessMembers(business?.id)
  const awardPoints = useAwardPoints(profile, business?.id)
  const registerCustomer = useRegisterCustomer(business?.id)
  const [actionError, setActionError] = useState<string | null>(null)
  const [registerActionError, setRegisterActionError] = useState<string | null>(null)
  const [purchaseAmount, setPurchaseAmount] = useState<string>('')
  const [memberSearch, setMemberSearch] = useState('')
  const [customerStatusFilter, setCustomerStatusFilter] = useState<CustomerStatusFilter>('all')

  const form = useForm<RewardAdjustmentFormValues>({
    resolver: zodResolver(rewardAdjustmentSchema),
    defaultValues: {
      profileId: '',
      delta: 10,
      reason: '',
    },
  })
  const registerForm = useForm<RegisterCustomerFormValues>({
    resolver: zodResolver(registerCustomerSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  })

  const selectedProfileId = useWatch({
    control: form.control,
    name: 'profileId',
  })
  const selectedMember = members.data?.find((member) => member.id === selectedProfileId) ?? null
  const memberRows = members.data ?? []
  const customerStatusFilterOptions = [
    { value: 'all', label: t('All'), count: memberRows.length },
    {
      value: 'under_review',
      label: t('Under review'),
      count: memberRows.filter((member) => matchesCustomerStatusFilter(member, 'under_review')).length,
    },
    {
      value: 'approved',
      label: t('Approved'),
      count: memberRows.filter((member) => matchesCustomerStatusFilter(member, 'approved')).length,
    },
    {
      value: 'missing_document',
      label: t('Missing ID'),
      count: memberRows.filter((member) => matchesCustomerStatusFilter(member, 'missing_document')).length,
    },
    {
      value: 'rejected',
      label: t('Rejected'),
      count: memberRows.filter((member) => matchesCustomerStatusFilter(member, 'rejected')).length,
    },
  ]
  const filteredMembers = memberRows.filter(
    (member) =>
      matchesCustomerStatusFilter(member, customerStatusFilter) &&
      searchMatches(memberSearch, [
        member.fullName,
        member.email,
        member.id,
        member.points,
        member.verificationStatus,
        getVerificationStatusLabel(member.verificationStatus),
      ]),
  )
  const calculatedPoints =
    purchaseAmount && business?.earnRate
      ? Math.floor(Number.parseFloat(purchaseAmount) * business.earnRate)
      : null

  return (
    <div className="space-y-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">{t('Customers')}</h1>
          <p className="text-lg text-on-surface-variant/85">
            {t('Look up a customer, review their balance, and award points for in-store purchases.')}
          </p>
        </div>
        <Badge variant="accent" className="w-fit rounded-full bg-primary/5 px-5 py-3 text-primary">
          {metrics?.totalMembers ?? members.data?.length ?? 0} {t('active customers')}
        </Badge>
      </div>

      <div className="grid gap-10 xl:grid-cols-[420px_1fr]">
        <div className="space-y-8">
          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              {t('Quick Action')}
            </span>
            <h2 className="font-serif text-3xl text-primary">{t('Award Points')}</h2>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm rounded-[2rem] p-8">
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  setActionError(null)
                  await awardPoints.mutateAsync(values)
                  form.reset({
                    profileId: '',
                    delta: 10,
                    reason: '',
                  })
                  setPurchaseAmount('')
                } catch (error) {
                  setActionError(error instanceof Error ? error.message : t('Failed to award points.'))
                }
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="profileId" className="text-sm font-semibold">
                  {t('Customer')}
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant/55" />
                  <Input
                    id="profileId"
                    list="business-member-options"
                    placeholder={t('Search by customer ID')}
                    className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] pl-11 text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                    {...form.register('profileId')}
                  />
                </div>
                <datalist id="business-member-options">
                  {(members.data ?? []).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} - {member.email}
                    </option>
                  ))}
                </datalist>
                {form.formState.errors.profileId ? (
                  <p className="text-xs text-red-500">{form.formState.errors.profileId.message}</p>
                ) : null}
              </div>

              <div className="rounded-3xl border border-primary-container/15 bg-[var(--muted)] p-5 shadow-sm">
                {selectedMember ? (
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container font-serif text-lg text-primary-foreground shadow-lg">
                      {getInitials(selectedMember.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-xl text-primary">{selectedMember.fullName}</p>
                      <p className="truncate text-sm text-on-surface-variant/85">{selectedMember.email}</p>
                    </div>
                    <Badge
                      variant="accent"
                      className="rounded-full border-primary-container/25 bg-primary-container/12 px-4 py-2 text-primary"
                    >
                      {formatPoints(selectedMember.points)} {t('points')}
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-serif text-xl text-primary">{t('No customer selected')}</p>
                    <p className="text-sm text-on-surface-variant/85">
                      {t('Choose a customer to preview their current balance before awarding points.')}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="purchaseAmount" className="text-sm font-semibold">
                  Purchase Amount (optional)
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-on-surface-variant/60">
                    $
                  </span>
                  <Input
                    id="purchaseAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="h-12 rounded-2xl border-outline-variant/20 pl-8 focus:border-primary/30"
                    value={purchaseAmount}
                    onChange={(event) => {
                      const value = event.target.value
                      setPurchaseAmount(value)

                      const amount = Number.parseFloat(value)
                      if (!Number.isNaN(amount) && business?.earnRate) {
                        form.setValue('delta', Math.floor(amount * business.earnRate), { shouldValidate: true })
                      }
                    }}
                  />
                </div>
                {purchaseAmount ? (
                  <p className="text-xs text-on-surface-variant/70">
                    {business?.earnRate ?? 0} pts per $1 · ${purchaseAmount} = {calculatedPoints ?? 0} pts
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="delta" className="text-sm font-semibold">
                  {t('Points to Award')}
                </Label>
                <Input
                  id="delta"
                  type="number"
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary focus-visible:ring-primary-container/25"
                  {...form.register('delta', { valueAsNumber: true })}
                />
                {form.formState.errors.delta ? (
                  <p className="text-xs text-red-500">{form.formState.errors.delta.message}</p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="reason" className="text-sm font-semibold">
                  {t('Reason')}
                </Label>
                <Input
                  id="reason"
                  placeholder={t('e.g., In-store purchase $12.50')}
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary placeholder:text-on-surface-variant/55 focus-visible:ring-primary-container/25"
                  {...form.register('reason')}
                />
                {form.formState.errors.reason ? (
                  <p className="text-xs text-red-500">{form.formState.errors.reason.message}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="h-14 w-full rounded-full font-semibold"
                disabled={awardPoints.isPending}
              >
                {awardPoints.isPending ? t('Awarding...') : t('Award Points')}
              </Button>
              {actionError ? <p className="text-sm font-bold text-red-500">{actionError}</p> : null}
            </form>
          </div>

          <div className="space-y-2 pb-4 border-b border-outline-variant/10">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Quick Action
            </span>
            <h2 className="font-serif text-3xl text-primary">Register New Customer</h2>
          </div>

          <div className="rounded-3xl border border-outline-variant/5 bg-white p-8 shadow-sm">
            <form
              className="space-y-6"
              onSubmit={registerForm.handleSubmit(async (values) => {
                try {
                  setRegisterActionError(null)
                  await registerCustomer.mutateAsync({
                    name: values.fullName,
                    email: values.email,
                  })
                  registerForm.reset({
                    fullName: '',
                    email: '',
                  })
                } catch (error) {
                  setRegisterActionError(
                    error instanceof Error ? error.message : 'Failed to register customer.',
                  )
                }
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="registerFullName" className="text-sm font-semibold">
                  Full Name
                </Label>
                <Input
                  id="registerFullName"
                  type="text"
                  className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                  {...registerForm.register('fullName')}
                />
                {registerForm.formState.errors.fullName ? (
                  <p className="text-xs text-red-500">{registerForm.formState.errors.fullName.message}</p>
                ) : null}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="registerEmail" className="text-sm font-semibold">
                  Email Address
                </Label>
                <Input
                  id="registerEmail"
                  type="email"
                  className="h-12 rounded-2xl border-outline-variant/20 focus:border-primary/30"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email ? (
                  <p className="text-xs text-red-500">{registerForm.formState.errors.email.message}</p>
                ) : null}
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-14 w-full rounded-full font-semibold"
                disabled={registerCustomer.isPending}
              >
                {registerCustomer.isPending ? 'Registering...' : 'Register Customer'}
              </Button>
              {registerActionError ? (
                <p className="text-sm font-bold text-red-500">{registerActionError}</p>
              ) : null}
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col gap-4 border-b border-outline-variant/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                {t('Customer Base')}
              </span>
              <h2 className="font-serif text-3xl text-primary">{t('Your Customers')}</h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <CompactSearch
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder={t('Search customers')}
                aria-label={t('Search customers')}
                wrapperClassName="w-full sm:w-64"
              />
              <CompactFilter
                value={customerStatusFilter}
                onChange={(event) => setCustomerStatusFilter(event.target.value as CustomerStatusFilter)}
                options={customerStatusFilterOptions}
                aria-label={t('Filter customers by verification status')}
                wrapperClassName="w-full sm:w-52"
              />
            </div>
          </div>

          {members.isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-5 rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-5">
                    <Skeleton className="size-14 rounded-2xl" />
                    <div className="space-y-3">
                      <Skeleton className="h-7 w-44" />
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
              ))}
            </div>
          ) : members.data?.length ? (
            <div className="grid gap-4">
              {filteredMembers.length ? filteredMembers.map((member) => {
                const selected = member.id === selectedProfileId

                return (
                  <div
                    key={member.id}
                    className={cn(
                      'rounded-xl border border-[var(--border)] bg-white shadow-sm flex flex-col gap-5 rounded-[2rem] p-6 transition-all md:flex-row md:items-center md:justify-between',
                      selected
                        ? 'border-primary-container/35 bg-primary-container/[0.08] shadow-sm'
                        : 'hover:border-primary-container/35 hover:bg-[var(--muted)] hover:shadow-sm',
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container font-serif text-lg text-primary-foreground shadow-lg">
                        {getInitials(member.fullName)}
                      </div>
                      <div>
                        <p className="font-serif text-2xl leading-tight text-primary">{member.fullName}</p>
                        <p className="mt-1 text-sm font-medium text-on-surface-variant/90">{member.email}</p>
                        <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant/70">
                          ID: {member.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        variant="accent"
                        className="flex items-center gap-1.5 rounded-full border border-primary-container/25 bg-primary-container/12 px-4 py-2 text-primary"
                      >
                        <Gift className="size-3" />
                        {formatPoints(member.points)} {t('points')}
                      </Badge>
                      <Badge
                        variant="accent"
                        className={cn(
                          'rounded-full px-4 py-2',
                          member.verificationStatus === 'verified'
                            ? 'border-success/25 bg-success/10 text-success'
                            : member.verificationStatus === 'rejected'
                              ? 'border-red-200 bg-red-50 text-red-600'
                              : 'border-warning/25 bg-warning/10 text-warning',
                        )}
                      >
                        {getVerificationStatusLabel(member.verificationStatus)}
                      </Badge>
                      <Button
                        variant={selected ? 'default' : 'outline'}
                        className={cn(
                          'rounded-full',
                          !selected &&
                            'border-primary-container/30 bg-[var(--card)] text-primary hover:border-primary-container/60 hover:bg-primary-container/10 hover:text-primary',
                        )}
                        onClick={() => form.setValue('profileId', member.id, { shouldValidate: true })}
                      >
                        {selected ? t('Selected') : t('Select')}
                      </Button>
                    </div>
                  </div>
                )
              }) : (
                <EmptyState
                  className="rounded-[2rem]"
                  icon={<Users className="size-8" />}
                  title={t('No customers match this search')}
                  description={t('Try a different search or status filter.')}
                />
              )}
            </div>
          ) : (
            <EmptyState
              className="rounded-[2rem]"
              icon={<Users className="size-8" />}
              title={t('No customers yet')}
              description={t("Customers will appear here once they've purchased from your business.")}
            />
          )}
        </div>
      </div>
    </div>
  )
}
