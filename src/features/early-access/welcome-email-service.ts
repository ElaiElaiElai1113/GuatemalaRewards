type EarlyAccessWelcomeEmailInput = {
  fullName?: string | null
  email: string
}

export async function sendEarlyAccessWelcomeEmail(input: EarlyAccessWelcomeEmailInput): Promise<void> {
  const response = await fetch('/api/send-welcome-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName: input.fullName ?? '',
      email: input.email,
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to send welcome email.')
  }
}
