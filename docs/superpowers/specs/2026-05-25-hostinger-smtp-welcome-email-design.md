# Hostinger SMTP Welcome Email Design

## Goal

When a visitor joins the early access list, they should receive a polished welcome email from the Guatemala Rewards domain email account. The current lead capture behavior stays in place: the form saves the lead to Supabase first, then email delivery runs as a follow-up step.

## Scope

- Send a welcome email to early access subscribers after a successful lead save.
- Use the Hostinger mailbox `info@guatemalarewards.com` through SMTP.
- Keep SMTP credentials server-side only.
- Preserve the current success state even if email sending fails after the lead is saved.
- Include both HTML and plain-text email bodies.

Out of scope:

- Bulk newsletters or campaign management.
- Admin email templates.
- Unsubscribe management beyond normal contact preferences already implied by the early access form.
- Replacing Supabase lead capture.

## Recommended Approach

Add a Vercel serverless API endpoint that uses `nodemailer` to send through Hostinger SMTP. This matches the current Vercel deployment setup and avoids putting SMTP credentials in the Vite frontend bundle.

The frontend will continue calling `earlyAccessService.createLead()`. After that succeeds, it will call the email endpoint with the saved lead's name and email address. The endpoint will validate the input, build the welcome email, and send it using server environment variables.

## Data Flow

1. Visitor submits the early access form.
2. React validates the form.
3. `earlyAccessService.createLead()` stores the lead through the Supabase RPC.
4. If the saved lead has an email address, the frontend calls `/api/send-welcome-email`.
5. The API endpoint sends the welcome email through Hostinger SMTP.
6. The page shows the existing success confirmation.

If Supabase lead creation fails, the email endpoint is not called.

If email delivery fails after the lead is saved, the app should still show the success state. The failure should be logged server-side and should not remove or roll back the lead.

## Server API

Endpoint:

`POST /api/send-welcome-email`

Request body:

```json
{
  "fullName": "Subscriber Name",
  "email": "subscriber@example.com"
}
```

Validation:

- `email` is required and must be a valid email.
- `fullName` is optional and should be trimmed.
- Missing SMTP configuration returns a server error.

Response:

```json
{
  "ok": true
}
```

## SMTP Configuration

Server-only environment variables:

```txt
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@guatemalarewards.com
SMTP_PASS=<hostinger-mailbox-password>
SMTP_FROM=Guatemala Rewards <info@guatemalarewards.com>
```

These values must be configured in Vercel project environment variables. They must not use the `VITE_` prefix and must not be committed.

## Email Content

From:

`Guatemala Rewards <info@guatemalarewards.com>`

Subject:

`Welcome to Guatemala Rewards`

HTML email:

- Branded top section with Guatemala Rewards name.
- Friendly greeting using the subscriber's first name when available.
- Confirmation that they are on the early access list.
- Short explanation that they will be among the first to hear about launch access, rewards, and early adopter benefits.
- Simple footer with `guatemalarewards.com`.

Plain text fallback:

- Same message in concise text form.

## Error Handling

- Lead save errors remain user-visible, as they are today.
- Email send errors do not block the subscription success state.
- The frontend should avoid showing SMTP internals to users.
- The API endpoint should log enough context for debugging without logging passwords or full SMTP configuration.

## Testing

- Unit-style test coverage should confirm the early access page calls the welcome email endpoint only after the lead is saved.
- Tests should confirm the request includes the saved lead email.
- Static tests should confirm the endpoint requires server-only SMTP environment variables and does not introduce `VITE_` SMTP secrets.
- Existing early access validation and content tests should continue passing.
