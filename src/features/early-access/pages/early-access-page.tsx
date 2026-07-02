import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { LanguagePicker } from '@/components/language-picker'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { earlyAccessService } from '@/integrations/supabase/services/early-access-service'
import { useLanguage } from '@/lib/language'
import {
  earlyAccessMessageLines,
  earlyAccessSubscribeButtonLabel,
} from '../early-access-content'
import { sendEarlyAccessWelcomeEmail } from '../welcome-email-service'

const earlyAccessModalSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(80, 'Keep your name under 80 characters'),
  whatsapp: z.string().trim().min(5, 'Enter your WhatsApp number').max(40, 'Keep WhatsApp under 40 characters'),
  instagram: z.string().trim().max(120, 'Keep Instagram under 120 characters').optional(),
  email: z.string().trim().min(1, 'Enter your email').pipe(z.email('Enter a valid email')),
})

type EarlyAccessModalFormValues = z.infer<typeof earlyAccessModalSchema>

const defaultValues: EarlyAccessModalFormValues = {
  fullName: '',
  whatsapp: '',
  instagram: '',
  email: '',
}

const inputClass =
  'h-12 w-full rounded-md border border-black bg-white px-3.5 text-base text-black placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-black/20'
const labelClass = 'text-xs font-bold uppercase text-neutral-700'
const errorClass = 'text-xs font-bold text-error'
const earlyAccessParagraphClass = 'max-w-3xl text-[1.125rem] font-medium leading-8 text-neutral-950'

export function EarlyAccessPage() {
  const { t } = useLanguage()
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const leadForm = useForm<EarlyAccessModalFormValues>({
    resolver: zodResolver(earlyAccessModalSchema),
    defaultValues,
  })

  const openLeadModal = () => {
    setSubmitError(null)
    setLeadModalOpen(true)
  }

  return (
    <main className="early-access-neutral min-h-screen overflow-x-hidden bg-white font-sans text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-10 sm:px-8 lg:px-12">
        <section className="w-full space-y-7">
          <div className="flex justify-end">
            <LanguagePicker className="text-neutral-700" compact />
          </div>

          <div className="space-y-5">
            {earlyAccessMessageLines.slice(0, 6).map((line) => (
              <p key={line} className={earlyAccessParagraphClass}>
                {t(line)}
              </p>
            ))}

            {isSubmitted ? (
              <div className="max-w-xl space-y-3 border-l-2 border-black pl-4">
                <h2 className="text-xl font-semibold leading-tight text-black">{t("You're on the early list.")}</h2>
                <p className="text-base font-medium leading-7 text-neutral-700">
                  {t('We saved your details. We will reach out when Guatemala Rewards is ready for early adopters.')}
                </p>
              </div>
            ) : (
              <button
                type="button"
                className="h-12 rounded-md bg-[#16a34a] px-8 text-base font-bold text-white transition hover:bg-[#15803d]"
                onClick={openLeadModal}
              >
                {t(earlyAccessSubscribeButtonLabel)}
              </button>
            )}
          </div>

          <div className="space-y-1">
            {earlyAccessMessageLines.slice(6, 8).map((line) => (
              <p key={line} className={earlyAccessParagraphClass}>
                {t(line)}
              </p>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="early-access-neutral max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 text-black shadow-xl sm:p-8">
          <form
            className="space-y-5"
            onSubmit={leadForm.handleSubmit(async (values) => {
              try {
                setSubmitError(null)
                const instagram = values.instagram?.trim() ?? ''
                const lead = await earlyAccessService.createLead({
                  fullName: values.fullName,
                  whatsapp: values.whatsapp,
                  email: values.email ?? '',
                  notes: instagram ? `Instagram: ${instagram}` : '',
                  marketingConsent: true,
                })
                if (lead.email) {
                  try {
                    await sendEarlyAccessWelcomeEmail({
                      fullName: lead.fullName,
                      email: lead.email,
                    })
                  } catch (emailError) {
                    console.warn('Unable to send early access welcome email.', emailError)
                  }
                }
                leadForm.reset(defaultValues)
                setIsSubmitted(true)
                setLeadModalOpen(false)
              } catch (error) {
                setSubmitError(error instanceof Error ? error.message : t('Unable to join the early access list.'))
              }
            })}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-black">{t('Join early access')}</DialogTitle>
              <DialogDescription className="text-sm font-semibold leading-6 text-neutral-700">
                {t('Leave your details and we will contact you when Guatemala Rewards opens.')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <label htmlFor="early-access-name" className={labelClass}>{t('Name')}</label>
              <input id="early-access-name" className={inputClass} placeholder={t('Your name')} {...leadForm.register('fullName')} />
              {leadForm.formState.errors.fullName ? <p className={errorClass}>{t(leadForm.formState.errors.fullName.message ?? '')}</p> : null}
            </div>

            <div className="grid gap-3">
              <label htmlFor="early-access-whatsapp" className={labelClass}>WhatsApp</label>
              <input id="early-access-whatsapp" className={inputClass} placeholder="+57 300 000 0000" {...leadForm.register('whatsapp')} />
              {leadForm.formState.errors.whatsapp ? <p className={errorClass}>{t(leadForm.formState.errors.whatsapp.message ?? '')}</p> : null}
            </div>

            <div className="grid gap-3">
              <label htmlFor="early-access-instagram" className={labelClass}>{t('Instagram optional')}</label>
              <input id="early-access-instagram" className={inputClass} placeholder="@yourhandle" {...leadForm.register('instagram')} />
              {leadForm.formState.errors.instagram ? <p className={errorClass}>{t(leadForm.formState.errors.instagram.message ?? '')}</p> : null}
            </div>

            <div className="grid gap-3">
              <label htmlFor="early-access-email" className={labelClass}>{t('Email')}</label>
              <input id="early-access-email" className={inputClass} placeholder="you@example.com" {...leadForm.register('email')} />
              {leadForm.formState.errors.email ? <p className={errorClass}>{t(leadForm.formState.errors.email.message ?? '')}</p> : null}
            </div>

            {submitError ? (
              <div className="rounded-md border border-black p-3 text-sm font-bold text-black">
                {t(submitError)}
              </div>
            ) : null}

            <button
              type="submit"
              className="h-12 w-full rounded-md bg-[#16a34a] px-8 text-base font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
              disabled={leadForm.formState.isSubmitting}
            >
              {leadForm.formState.isSubmitting ? t('Submitting...') : t(earlyAccessSubscribeButtonLabel)}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
