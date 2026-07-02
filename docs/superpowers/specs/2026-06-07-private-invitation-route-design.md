# Private Invitation Route Design

## Goal

Move the client-facing early access entry point from the visible `/early-access` URL to a cleaner `/invitation` URL. The old `/early-access` path should keep working as a redirect so existing links and QR codes do not break, but new website CTAs, tests, and client-facing QR guidance should use `/invitation`.

## Scope

- Add `/invitation` as the primary route for the existing early access page.
- Redirect `/early-access` to `/invitation`.
- Update public-facing CTAs that currently point to `/early-access` so they point to `/invitation`.
- Remove visible `/early-access` text from user-facing email/page content.
- Preserve the existing early access lead capture form and welcome email send flow.
- Update tests that assert early access routing so they expect `/invitation` as the public route and keep coverage that `/early-access` remains a compatibility redirect.

## Out of Scope

- Creating personalized per-user QR codes.
- Changing the database schema for early access leads.
- Changing admin terminology for the internal "Early Access" lead workflow.
- Reworking the landing page design.

## Architecture

The existing `EarlyAccessPage` remains the single page component. Routing changes happen in `src/routes/router.tsx`:

- `/invitation` renders `EarlyAccessPage`.
- `/early-access` redirects to `/invitation`.
- Existing legacy aliases can continue redirecting to the same private entry point.

Public CTAs in the landing/auth pages should use `/invitation`. Internal admin labels can remain "Early Access" because that is a business workflow label, not the public URL.

## Data Flow

1. Visitor opens `/invitation`, or scans a QR that points to `/invitation`.
2. The existing early access form saves the lead through `earlyAccessService.createLead()`.
3. If the lead includes an email address, the frontend calls `/api/send-welcome-email`.
4. The email API sends the current confirmation/welcome email without exposing `/early-access`.
5. Visitors using old `/early-access` links are redirected to `/invitation`.

## Error Handling

Existing error handling remains:

- Lead save errors show the existing join-list error.
- Email send failures are logged but do not block the successful lead submission.
- Invalid email API requests still return `400`.
- Missing SMTP config still returns `500`.

## Testing

Tests should cover:

- `/invitation` renders the early access page.
- `/early-access` redirects rather than being the primary route.
- Landing CTAs point to `/invitation`.
- Welcome email code does not expose `/early-access`.
- Existing early access form and welcome email behavior remains intact.

## Rollout Notes

The new QR code should point to:

`https://guatemalarewards.com/invitation`

Existing QR codes using `/early-access` will continue to work through the redirect, but all new client-facing materials should use `/invitation`.
