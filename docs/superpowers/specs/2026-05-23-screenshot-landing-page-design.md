# Screenshot Landing Page Design

## Goal

Replace the existing `/landing-page` marketing page with a faithful React/Tailwind recreation of the provided screenshot for Guatemala Rewards.

## Scope

- Keep the existing app shell, router, authentication flow, and sign-in page behavior unchanged.
- Replace only the exported `LandingPage` view in `src/features/auth/pages/landing-page.tsx`.
- Match the screenshot structure: header, centered hero, benefit rows, category pills, subscription card, how-it-works cards, FAQ rows, and footer.
- Use existing dependencies, especially `lucide-react` for the small line icons.
- Keep links functional: join actions route to `/early-access`, business navigation routes to `/business`, agreement routes to `/reward-terms`, privacy routes to `/privacy`, and contact routes to `/terms`.

## Visual Requirements

- Light neutral page background with white sections separated by thin gray borders.
- Serif headings, sans-serif body text, gold highlight accents, and compact rounded cards.
- Maximum content width should visually align to the screenshot: narrow hero and FAQ content, wider how-it-works cards.
- Mobile layout should stack gracefully without horizontal overflow.

## Verification

- Add Playwright coverage that checks the screenshot-specific landing sections and text.
- Run the targeted Playwright test for `/landing-page`.
- Run typecheck/build before completion.
