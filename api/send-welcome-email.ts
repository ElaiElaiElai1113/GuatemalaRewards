import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createTransport } from 'nodemailer'

type WelcomeEmailRequest = {
  fullName?: unknown
  email?: unknown
}

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sendJson(response: VercelResponse, status: number, body: Record<string, unknown>) {
  response.status(status).json(body)
}

function parseRequestBody(body: unknown): WelcomeEmailRequest {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as WelcomeEmailRequest
    } catch {
      return {}
    }
  }

  if (body && typeof body === 'object') {
    return body as WelcomeEmailRequest
  }

  return {}
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST
  const portValue = process.env.SMTP_PORT
  const secureValue = process.env.SMTP_SECURE
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  if (!host || !portValue || !secureValue || !user || !pass || !from) {
    return null
  }

  const port = Number(portValue)

  if (!Number.isInteger(port) || port <= 0) {
    return null
  }

  return {
    host,
    port,
    secure: secureValue.toLowerCase() === 'true',
    user,
    pass,
    from,
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getGreetingName(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0]
  return firstName || 'there'
}

function buildTextEmail(fullName: string): string {
  return [
    `Hi ${getGreetingName(fullName)},`,
    '',
    'Welcome to Guatemala Rewards. Your early access request has been received.',
    '',
    'We are creating a private rewards experience for women who enjoy beautiful places, elevated moments, and getting more from the lifestyle they already love.',
    '',
    'As we prepare to open access, you will be among the first to receive selected invitations, rewards opportunities, and member updates.',
    '',
    'Thank you for joining us early. We are excited to share what is coming.',
    '',
    'Guatemala Rewards',
    'guatemalarewards.com',
  ].join('\n')
}

function buildHtmlEmail(fullName: string): string {
  const greetingName = escapeHtml(getGreetingName(fullName))

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to Guatemala Rewards</title>
  </head>
  <body style="margin:0;background:#f7f1e8;font-family:Arial,Helvetica,sans-serif;color:#24190f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f1e8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #eadfce;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:#24190f;padding:28px 28px 24px;text-align:left;">
                <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#f2c978;font-weight:700;">Guatemala Rewards</div>
                <h1 style="margin:12px 0 0;font-size:30px;line-height:1.2;color:#fff8ec;">Welcome to early access</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <p style="margin:0 0 18px;font-size:18px;line-height:1.6;color:#24190f;">Hi ${greetingName},</p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#443426;">
                  Your early access request has been received.
                </p>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#443426;">
                  We are creating a private rewards experience for women who enjoy beautiful places, elevated moments, and getting more from the lifestyle they already love.
                </p>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#443426;">
                  As we prepare to open access, you will be among the first to receive selected invitations, rewards opportunities, and member updates.
                </p>
                <div style="border-left:4px solid #16a34a;background:#f3faf4;padding:16px 18px;margin:24px 0;">
                  <p style="margin:0;font-size:15px;line-height:1.6;color:#24422b;">
                    Your request has been received. Selected invitations and early rewards opportunities will be shared as access opens.
                  </p>
                </div>
                <p style="margin:24px 0 0;font-size:16px;line-height:1.7;color:#443426;">
                  Thank you for joining us early. We are excited to share what is coming.
                </p>
                <p style="margin:10px 0 0;font-size:16px;line-height:1.7;color:#443426;">Guatemala Rewards Team</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #eadfce;padding:18px 28px;background:#fffaf2;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#7a6752;">
                  guatemalarewards.com
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    sendJson(response, 405, { ok: false, error: 'Method not allowed' })
    return
  }

  const body = parseRequestBody(request.body)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''

  if (!emailPattern.test(email)) {
    sendJson(response, 400, { ok: false, error: 'Valid email is required' })
    return
  }

  const smtpConfig = getSmtpConfig()

  if (!smtpConfig) {
    console.error('Welcome email SMTP configuration is missing or invalid.')
    sendJson(response, 500, { ok: false, error: 'Email service is not configured' })
    return
  }

  try {
    const transporter = createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    })

    await transporter.sendMail({
      from: smtpConfig.from,
      to: email,
      subject: 'Welcome to Guatemala Rewards',
      text: buildTextEmail(fullName),
      html: buildHtmlEmail(fullName),
    })

    sendJson(response, 200, { ok: true })
  } catch (error) {
    console.error('Failed to send early access welcome email.', {
      email,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    sendJson(response, 502, { ok: false, error: 'Unable to send welcome email' })
  }
}
