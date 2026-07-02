# Early Access Conversion Design

Date: 2026-05-18

## Scope

Redesign the early access page at `src/features/early-access/pages/early-access-page.tsx` into a conversion-focused waitlist experience for Guatemala Rewards.

The visible marketing copy is locked and must use the user's supplied text exactly:

```text
Hey,
We’re tired of watching people work hard but still struggle to afford the life they want — vacations, freedom, extras.
That’s why we’re building Guatemala Rewards: the highest-paying rewards program. Earn 20-100% back on almost everything you already buy daily.
No extra spending. Just real money back to help you do more of what you love.
As an early adopter, you’ll get exclusive benefits before anyone else.
Ready to earn more?
Let’s make this happen together.
Guatemala Rewards Team
```

## Goals

- Put the value proposition and subscribe action in the first viewport.
- Preserve the exact supplied copy for the pitch and CTA wording.
- Reduce form friction by showing only WhatsApp and email as primary fields.
- Keep the current backend lead capture behavior: at least one of WhatsApp or email is required, and consent is still collected.
- Maintain the Guatemala Rewards premium visual direction while making the layout more direct and conversion-oriented.

## Recommended Approach

Use a split conversion hero.

Desktop layout:

- Left column contains the brand, language picker, and the locked founder-style message.
- Right column contains a compact early access subscribe panel.
- The form panel stays visually prominent and above the fold.

Mobile layout:

- Stack the content.
- Show the message first, with the subscribe panel immediately after the call to action.
- Keep input and button heights stable to avoid layout shift.

## Visual Design

The page should feel premium, warm, and direct. Use the existing Guatemala Rewards palette with espresso, cream, champagne, blush, and muted green accents.

The copy block should read like a personal note rather than a generic landing page. The strongest phrases may be visually emphasized through typography or inline styling only if the text content itself remains unchanged:

- `highest-paying rewards program`
- `20-100% back`
- `No extra spending.`

The right-side form should have strong contrast, clear labels, and a single dominant action:

- WhatsApp input
- Email input
- Consent checkbox
- Button text: `Subscribe`

The existing name and notes fields should no longer be visible in this early access flow. They can remain in the form defaults and service payload as empty optional values.

## Data Flow

The page continues to use:

- `react-hook-form`
- `earlyAccessLeadSchema`
- `earlyAccessService.createLead`
- Supabase RPC `create_early_access_lead`

Expected submission behavior:

1. User enters WhatsApp, email, or both.
2. User accepts contact consent.
3. Submit calls `earlyAccessService.createLead`.
4. Success state confirms they are on the early access list.
5. Backend duplicate handling remains unchanged.

## Error Handling

Show validation errors close to the relevant input.

- If both WhatsApp and email are empty, show the existing `Add an email or WhatsApp number` validation message.
- If email is invalid, show the existing email validation message.
- If consent is unchecked, show the existing consent validation message.
- If Supabase submission fails, show the existing submit error area.

## Accessibility

- Keep real labels associated with each input.
- Preserve keyboard-friendly focus styles.
- Keep the primary button text readable and not dependent on icons alone.
- Use decorative imagery with empty alt text.
- Ensure text and controls do not overlap on narrow mobile widths.

## Testing

Run:

- `npm run typecheck`
- `npm run build`

Manual checks:

- Desktop first viewport shows the message and form together.
- Mobile layout stacks without clipping or overlapping text.
- Submit validation works when both contact fields are empty.
- Submit validation works when consent is unchecked.
- Successful submission reaches the confirmation state.
