import { zodResolver } from '@hookform/resolvers/zod'
import { Archive, Copy, Download, Gift, Hotel, Megaphone, QrCode, UserRoundPlus, Users } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompactSearch } from '@/components/ui/compact-search'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  useArchivePartnerReferrer,
  useAmbassadorLeads,
  useBusinessOwnerData,
  useCreatePartnerReferrer,
  usePartnerCreditLedger,
  usePartnerPerformance,
  usePartnerReferrals,
  usePartnerReferrers,
  useRedeemPartnerCredit,
  useUpdateBusinessAmbassadorLeadStatus,
} from '@/hooks/use-business-owner-data'
import { useLanguage } from '@/lib/language'
import { searchMatches } from '@/lib/search'
import { getAmbassadorLeadStatusLabel, getPartnerReferralStatusLabel } from '@/lib/status-labels'
import { partnerReferrerDraftSchema, type PartnerReferrerDraftFormValues } from '@/types/forms'

function downloadCsv(filename: string, rows: Array<Record<string, string | number | null>>) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const escapeCell = (value: string | number | null) => {
    const cell = value === null ? '' : String(value)
    return `"${cell.replace(/"/g, '""')}"`
  }
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function PartnersPage() {
  const { business } = useBusinessOwnerData()
  const { t } = useLanguage()
  const referrers = usePartnerReferrers(business?.id)
  const referrals = usePartnerReferrals(business?.id)
  const performance = usePartnerPerformance(business?.id)
  const partnerCredits = usePartnerCreditLedger(business?.id)
  const ambassadorLeads = useAmbassadorLeads(business?.id)
  const createPartnerReferrer = useCreatePartnerReferrer(business?.id)
  const archivePartnerReferrer = useArchivePartnerReferrer(business?.id)
  const redeemPartnerCredit = useRedeemPartnerCredit(business?.id)
  const updateAmbassadorLeadStatus = useUpdateBusinessAmbassadorLeadStatus(business?.id)
  const [leadSearch, setLeadSearch] = useState('')
  const [partnerContactSearch, setPartnerContactSearch] = useState('')
  const [referralSearch, setReferralSearch] = useState('')
  const [creditSearch, setCreditSearch] = useState('')

  const form = useForm<PartnerReferrerDraftFormValues>({
    resolver: zodResolver(partnerReferrerDraftSchema),
    defaultValues: {
      businessId: business?.id ?? '',
      sourceLabel: '',
      contactEmail: '',
      notes: '',
    },
  })

  const activeCount = performance.data?.filter((entry) => entry.active).length ?? 0
  const totalCredits = performance.data?.reduce((sum, entry) => sum + entry.creditsEarned, 0) ?? 0
  const redeemedCredits = performance.data?.reduce((sum, entry) => sum + entry.creditsRedeemed, 0) ?? 0
  const attributedCount = referrals.data?.length ?? 0
  const creditedCount = referrals.data?.filter((referral) => referral.status === 'credited').length ?? 0
  const unreedeemedCredits = (partnerCredits.data ?? []).filter((entry) => !entry.redeemedAt)
  const outstandingCredits = unreedeemedCredits.reduce((sum, entry) => sum + entry.creditUnits, 0)
  const ambassadorStatusOptions = ['new', 'contacted', 'converted', 'archived'] as const
  const allReferrers = referrers.data ?? []
  const activeReferrers = allReferrers.filter((referrer) => referrer.active)
  const archivedReferrers = allReferrers.filter((referrer) => !referrer.active)
  const allAmbassadorLeads = ambassadorLeads.data ?? []
  const activeAmbassadorLeads = allAmbassadorLeads.filter((lead) => lead.status !== 'archived')
  const archivedAmbassadorLeads = allAmbassadorLeads.filter((lead) => lead.status === 'archived')
  const visibleActiveAmbassadorLeads = activeAmbassadorLeads.filter((lead) =>
    searchMatches(leadSearch, [
      lead.fullName,
      lead.email,
      lead.phone,
      lead.city,
      lead.notes,
      lead.status,
      lead.socialLinks.instagram,
      lead.socialLinks.tiktok,
      lead.socialLinks.other,
    ]),
  )
  const visibleArchivedAmbassadorLeads = archivedAmbassadorLeads.filter((lead) =>
    searchMatches(leadSearch, [
      lead.fullName,
      lead.email,
      lead.phone,
      lead.city,
      lead.notes,
      lead.status,
      lead.socialLinks.instagram,
      lead.socialLinks.tiktok,
      lead.socialLinks.other,
    ]),
  )
  const visibleActiveReferrers = activeReferrers.filter((referrer) =>
    searchMatches(partnerContactSearch, [
      referrer.partnerName,
      referrer.contactName,
      referrer.contactEmail,
      referrer.code,
      referrer.notes,
    ]),
  )
  const visibleArchivedReferrers = archivedReferrers.filter((referrer) =>
    searchMatches(partnerContactSearch, [
      referrer.partnerName,
      referrer.contactName,
      referrer.contactEmail,
      referrer.code,
      referrer.notes,
    ]),
  )
  const filteredReferrals = (referrals.data ?? []).filter((referral) =>
    searchMatches(referralSearch, [
      referral.customer.fullName,
      referral.customer.email,
      referral.partnerReferrer.partnerName,
      referral.partnerReferrer.contactName,
      referral.partnerReferrer.code,
      referral.status,
      referral.firstOrder?.total,
    ]),
  )
  const recentReferrals = filteredReferrals.slice(0, 6)
  const filteredUnredeemedCredits = unreedeemedCredits.filter((entry) => {
    const referral = referrals.data?.find((item) => item.id === entry.partnerReferralId)
    return searchMatches(creditSearch, [
      entry.partnerReferrerId,
      entry.partnerReferralId,
      entry.orderId,
      entry.creditType,
      entry.creditUnits,
      entry.details,
      referral?.partnerReferrer.partnerName,
      referral?.partnerReferrer.contactName,
      referral?.partnerReferrer.code,
      referral?.customer.fullName,
      referral?.customer.email,
    ])
  })
  const ambassadorUrl =
    business?.id && typeof window !== 'undefined'
      ? `${window.location.origin}/ambassadors?business=${business.id}`
      : ''

  const handleExportReferrals = () => {
    downloadCsv(
      `${business?.slug ?? 'business'}-partner-referrals.csv`,
      (referrals.data ?? []).map((referral) => ({
        source: referral.partnerReferrer.contactName,
        code: referral.partnerReferrer.code,
        customer: referral.customer.fullName,
        email: referral.customer.email,
        status: referral.status,
        firstOrderTotal: referral.firstOrder?.total ?? null,
        attributedAt: referral.attributedAt,
        creditedAt: referral.creditedAt,
      })),
    )
  }

  const handleExportCredits = () => {
    downloadCsv(
      `${business?.slug ?? 'business'}-partner-credits.csv`,
      (partnerCredits.data ?? []).map((entry) => ({
        partnerReferrerId: entry.partnerReferrerId,
        partnerReferralId: entry.partnerReferralId,
        orderId: entry.orderId,
        creditType: entry.creditType,
        creditUnits: entry.creditUnits,
        details: entry.details,
        createdAt: entry.createdAt,
        redeemedAt: entry.redeemedAt,
      })),
    )
  }

  return (
    <div className="space-y-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <h1 className="font-serif text-5xl tracking-tight text-primary">Partner Referrals</h1>
          <p className="text-lg text-on-surface-variant/85">
            Track hotel/front-desk referrals and reward partners after first paid orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Badge variant="accent" className="rounded-full border-primary-container/25 bg-primary-container/12 px-5 py-3 text-primary">
            {activeCount} active contacts
          </Badge>
          <Badge variant="accent" className="rounded-full border-secondary-container/25 bg-secondary-container/15 px-5 py-3 text-secondary">
            {totalCredits} partner credits earned
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Active Contacts', activeCount],
          ['Attributed Customers', attributedCount],
          ['Credited Orders', creditedCount],
          ['Credits Redeemed', redeemedCredits],
          ['Outstanding Credits', outstandingCredits],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[var(--border)] bg-white shadow-sm rounded-[2rem] p-5">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
            <p className="mt-3 font-serif text-4xl text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        <div className="rounded-[2rem] border border-primary-container/18 bg-[var(--card)] p-7 shadow-card">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-primary-container/25 bg-primary-container/10 text-primary">
              <Megaphone className="size-5" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-3xl text-primary">Ambassador Page</h2>
              <p className="text-sm leading-6 text-on-surface-variant/80">
                Share this public link with local creators and promoters. Submitted requests appear here for follow-up.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-primary-container/15 bg-[var(--card)] p-4">
            {ambassadorUrl ? <QRCodeSVG value={ambassadorUrl} size={132} /> : <QrCode className="size-32 text-on-surface-variant/40" />}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={!ambassadorUrl}
              onClick={async () => {
                if (!ambassadorUrl) return
                await navigator.clipboard.writeText(ambassadorUrl)
                toast.success('Ambassador lead link copied')
              }}
            >
              <Copy className="size-4" />
              Copy Link
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border)] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-outline-variant/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Lead Follow-up</p>
              <h2 className="mt-1 font-serif text-3xl text-primary">Ambassador Leads</h2>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <CompactSearch
                value={leadSearch}
                onChange={(event) => setLeadSearch(event.target.value)}
                placeholder={t('Search leads')}
                aria-label={t('Search leads')}
              />
              <Badge variant="accent" className="w-fit border-primary-container/25 bg-primary-container/12 text-primary">
                {activeAmbassadorLeads.length} active requests
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-outline-variant/10">
            {ambassadorLeads.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-6">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="mt-3 h-4 w-64" />
                </div>
              ))
            ) : visibleActiveAmbassadorLeads.length ? (
              visibleActiveAmbassadorLeads.slice(0, 6).map((lead) => (
                <div key={lead.id} className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-serif text-2xl text-primary">{lead.fullName}</p>
                    <p className="mt-1 text-sm text-on-surface-variant/80">{lead.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-on-surface-variant/65">
                      {lead.city} · {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(lead.socialLinks)
                        .filter(([, value]) => Boolean(value))
                        .map(([key, value]) => (
                          <Badge key={key} variant="accent" className="max-w-full border-primary-container/20 bg-primary-container/10 text-primary">
                            <span className="truncate">{key}: {value}</span>
                          </Badge>
                        ))}
                    </div>
                    {lead.notes ? <p className="mt-3 text-sm leading-6 text-on-surface-variant/80">{lead.notes}</p> : null}
                  </div>
                  <select
                    className="h-11 rounded-2xl border border-outline-variant/20 bg-surface-highest px-4 text-sm font-medium text-on-surface shadow-sm outline-none"
                    value={lead.status}
                    disabled={updateAmbassadorLeadStatus.isPending}
                    onChange={(event) => {
                      updateAmbassadorLeadStatus.mutate({
                        id: lead.id,
                        status: event.target.value as typeof ambassadorStatusOptions[number],
                      })
                    }}
                  >
                    {ambassadorStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {getAmbassadorLeadStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
              ))
            ) : activeAmbassadorLeads.length ? (
              <EmptyState
                className="border-0 shadow-none"
                icon={<Megaphone className="size-8" />}
                title={t('No leads match this search')}
                description={t('Try a name, email, city, or social handle.')}
              />
            ) : (
              <EmptyState
                className="border-0 shadow-none"
                icon={<Megaphone className="size-8" />}
                title={t('No ambassador leads yet')}
                description={t('Share the ambassador link to collect creator and promoter requests.')}
              />
            )}
          </div>

          {archivedAmbassadorLeads.length ? (
            <div className="border-t border-outline-variant/10">
              <div className="flex items-center justify-between gap-4 p-6">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">Archived</p>
                  <h3 className="mt-1 font-serif text-2xl text-primary">Archived Leads</h3>
                </div>
                <Badge variant="outline">{visibleArchivedAmbassadorLeads.length}</Badge>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {visibleArchivedAmbassadorLeads.slice(0, 6).map((lead) => (
                  <div key={lead.id} className="flex flex-col gap-2 p-6">
                    <p className="font-serif text-xl text-primary">{lead.fullName}</p>
                    <p className="text-sm text-on-surface-variant/80">{lead.email}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-10 xl:grid-cols-[420px_1fr]">
        <div className="space-y-8">
          <div className="space-y-2 border-b border-outline-variant/10 pb-4">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Partner Setup
            </span>
            <h2 className="font-serif text-3xl text-primary">Add Receptionist Code</h2>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm rounded-[2rem] p-8">
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(async (values) => {
                if (!business?.id) return

                await createPartnerReferrer.mutateAsync({
                  ...values,
                  businessId: business.id,
                })
                form.reset({
                  businessId: business.id,
                  sourceLabel: '',
                  contactEmail: '',
                  notes: '',
                })
              })}
            >
              <div className="grid gap-3">
                <Label htmlFor="source-label">Referral Source</Label>
                <Input
                  id="source-label"
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary"
                  placeholder="Ana - Harbor View Hotel"
                  {...form.register('sourceLabel')}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  className="h-12 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary"
                  placeholder="optional@email.com"
                  {...form.register('contactEmail')}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="partner-notes">Notes</Label>
                <Textarea
                  id="partner-notes"
                  className="min-h-28 rounded-2xl border border-primary-container/15 bg-[var(--card)] text-primary"
                  placeholder="Reward terms, front-desk context, or handoff notes"
                  {...form.register('notes')}
                />
              </div>

              <Button type="submit" variant="secondary" className="h-14 w-full rounded-full" disabled={form.formState.isSubmitting}>
                <UserRoundPlus className="size-4" />
                {form.formState.isSubmitting ? t('Saving...') : 'Create Partner Code'}
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm rounded-[2rem] p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-primary-container/25 bg-primary-container/10 text-primary-container">
                  <Gift className="size-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-primary">Partner Credit Rule</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant/80">
                    Each referral source earns 1 partner credit after the referred customer places their first paid order.
                  </p>
                </div>
              </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col gap-4 border-b border-outline-variant/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                Active Directory
              </span>
              <h2 className="font-serif text-3xl text-primary">Partner Contacts</h2>
            </div>
            <CompactSearch
              value={partnerContactSearch}
              onChange={(event) => setPartnerContactSearch(event.target.value)}
              placeholder={t('Search contacts')}
              aria-label={t('Search contacts')}
            />
          </div>

          {referrers.isLoading ? (
            <div className="grid gap-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-sm">
                  <div className="flex gap-5">
                    <Skeleton className="size-16 rounded-2xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-8 w-48" />
                      <Skeleton className="h-3 w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-7 w-24 rounded-full" />
                        <Skeleton className="h-7 w-24 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : visibleActiveReferrers.length ? (
            <div className="grid gap-5">
              {visibleActiveReferrers.slice(0, 12).map((referrer) => {
                const stats = performance.data?.find((entry) => entry.partnerReferrerId === referrer.id)
                const partnerUrl =
                  business?.id && typeof window !== 'undefined'
                    ? `${window.location.origin}/promo?partner=${referrer.code}&business=${business.id}`
                    : ''

                return (
                  <div key={referrer.id} className="rounded-xl border border-[var(--border)] bg-white shadow-sm rounded-[2rem] p-6">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-5">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container font-serif text-2xl text-primary-foreground shadow-lg">
                          {referrer.contactName.charAt(0)}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="font-serif text-3xl leading-tight text-primary">{referrer.contactName}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant/70">{referrer.code}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="accent" className="border-primary-container/25 bg-primary-container/12 text-primary">
                              {stats?.referralsAttributed ?? 0} attributed
                            </Badge>
                            <Badge variant="accent" className="border-secondary-container/25 bg-secondary-container/15 text-secondary">
                              {stats?.creditsEarned ?? 0} credits earned
                            </Badge>
                            <Badge variant="accent" className="border-success/25 bg-success/12 text-success">
                              {stats?.creditsRedeemed ?? 0} redeemed
                            </Badge>
                          </div>
                          {referrer.notes ? (
                            <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant/80">{referrer.notes}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 xl:items-end">
                        <div className="rounded-3xl border border-primary-container/15 bg-[var(--card)] p-4">
                          {partnerUrl ? <QRCodeSVG value={partnerUrl} size={112} /> : <QrCode className="size-28 text-on-surface-variant/40" />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={async () => {
                              if (!partnerUrl) return
                              await navigator.clipboard.writeText(partnerUrl)
                              toast.success('Partner referral link copied')
                            }}
                          >
                            <Copy className="size-4" />
                            Copy Link
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full border-red-300 text-red-400 hover:bg-red-500/10"
                            onClick={() => archivePartnerReferrer.mutate(referrer.id)}
                          >
                            <Archive className="size-4" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : activeReferrers.length ? (
            <EmptyState
              className="rounded-[2rem]"
              icon={<Hotel className="size-8" />}
              title={t('No contacts match this search')}
              description={t('Try a contact name, code, email, or note.')}
            />
          ) : (
            <EmptyState
              className="rounded-[2rem]"
              icon={<Hotel className="size-8" />}
              title={t('No referral sources yet')}
              description={t('Create your first referral source link to start tracking referred purchases.')}
            />
          )}

          {archivedReferrers.length ? (
            <div className="space-y-5 pt-4">
              <div className="space-y-2 border-t border-outline-variant/10 pt-6">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
                  Archived
                </span>
                <h3 className="font-serif text-2xl text-primary">Archived Contacts</h3>
              </div>
              <div className="grid gap-4">
                {visibleArchivedReferrers.slice(0, 6).map((referrer) => (
                  <div key={referrer.id} className="rounded-[2rem] border border-[var(--border)] bg-white p-5 shadow-sm">
                    <p className="font-serif text-2xl text-primary">{referrer.contactName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant/70">{referrer.code}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2 border-b border-outline-variant/10 pb-4">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Recent Activity
            </span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-3xl text-primary">Attributed Customers</h2>
              <div className="flex flex-col gap-2 sm:items-end">
                <CompactSearch
                  value={referralSearch}
                  onChange={(event) => setReferralSearch(event.target.value)}
                  placeholder={t('Search referrals')}
                  aria-label={t('Search referrals')}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit rounded-full"
                  disabled={(referrals.data ?? []).length === 0}
                  onClick={handleExportReferrals}
                >
                  <Download className="size-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm divide-y divide-outline-variant/10 overflow-hidden">
            {referrals.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-6">
                  <Skeleton className="h-7 w-44" />
                  <Skeleton className="mt-3 h-4 w-56" />
                  <Skeleton className="mt-5 h-4 w-32" />
                </div>
              ))
            ) : recentReferrals.length ? (
              recentReferrals.map((referral) => (
                <div key={referral.id} className="flex flex-col gap-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-serif text-2xl text-primary">{referral.customer.fullName}</p>
                      <p className="text-sm text-on-surface-variant/80">{referral.customer.email}</p>
                    </div>
                    <Badge
                      variant="accent"
                      className={
                        referral.status === 'credited'
                          ? 'border-success/25 bg-success/12 text-success'
                          : 'border-primary-container/25 bg-primary-container/12 text-primary'
                      }
                    >
                      {getPartnerReferralStatusLabel(referral.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-on-surface-variant/75">
                    Source: {referral.partnerReferrer.contactName}
                  </p>
                </div>
              ))
            ) : (referrals.data ?? []).length ? (
              <EmptyState
                className="border-0 shadow-none"
                icon={<Users className="size-8" />}
                title={t('No referrals match this search')}
                description={t('Try a customer, email, source, code, or status.')}
              />
            ) : (
              <EmptyState
                className="border-0 shadow-none"
                icon={<Users className="size-8" />}
                title={t('No partner referrals yet')}
                description={t('Attributed customers will appear here after referral links are used.')}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 border-b border-outline-variant/10 pb-4">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
              Offline Redemption
            </span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-3xl text-primary">Outstanding Partner Credits</h2>
              <div className="flex flex-col gap-2 sm:items-end">
                <CompactSearch
                  value={creditSearch}
                  onChange={(event) => setCreditSearch(event.target.value)}
                  placeholder={t('Search credits')}
                  aria-label={t('Search credits')}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit rounded-full"
                  disabled={(partnerCredits.data ?? []).length === 0}
                  onClick={handleExportCredits}
                >
                  <Download className="size-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm divide-y divide-outline-variant/10 overflow-hidden">
            {partnerCredits.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-6">
                  <Skeleton className="h-7 w-44" />
                  <Skeleton className="mt-3 h-4 w-32" />
                </div>
              ))
            ) : filteredUnredeemedCredits.length ? (
              filteredUnredeemedCredits.map((entry) => {
                const referral = referrals.data?.find((item) => item.id === entry.partnerReferralId)
                return (
                  <div key={entry.id} className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-serif text-2xl text-primary">
                        {referral?.partnerReferrer.contactName ?? 'Referral Source'}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-on-surface-variant/70">
                        {entry.creditUnits} partner credit
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-full"
                      onClick={() => redeemPartnerCredit.mutate(entry.id)}
                    >
                      Mark Redeemed
                    </Button>
                  </div>
                )
              })
            ) : unreedeemedCredits.length ? (
              <EmptyState
                className="border-0 shadow-none"
                icon={<Gift className="size-8" />}
                title={t('No credits match this search')}
                description={t('Try a referral source, credit type, or details.')}
              />
            ) : (
              <EmptyState
                className="border-0 shadow-none"
                icon={<Gift className="size-8" />}
                title={t('No outstanding partner credits')}
                description={t('Redeemable partner credits will appear here once referrals earn credits.')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
