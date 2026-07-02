# Landing Page Client Requirements Design

## Goal

Create a Spanish-first public landing page at `/landing-page` that clearly explains:

- Why people should join
- Early subscriber benefits
- How the rewards system works
- Membership advantages

The existing `/` and `/early-access` letter page should remain available as the simple early-access capture page.

## Audience

The page is primarily for Spanish-speaking community members who need to quickly understand why Guatemala Rewards is worth joining before launch. English remains available through the existing language picker.

## Recommended UX Direction

Use the existing Guatemala Rewards visual language, but improve the current landing-page design with a clearer conversion flow:

1. Lead with a plain-language value proposition, not oversized hype.
2. Organize the body into four scannable sections matching the client's requested topics.
3. Keep cards compact and functional, with icons used as recognition aids.
4. Keep CTA behavior simple: primary actions lead to `/early-access`.
5. Explain rewards as program credits/offers and avoid implying guaranteed cash payouts.

## Page Structure

### Header

- Brand: Guatemala Rewards
- Nav anchors:
  - Por que unirte
  - Beneficios
  - Recompensas
  - Membresia
  - FAQ
- Language picker visible on desktop and mobile-friendly.
- CTA: Unirme temprano

### Hero

Purpose: explain why joining matters.

Content:

- Headline: Guatemala Rewards convierte tus compras diarias en valor para usar dentro de una red de negocios participantes.
- Supporting copy: explain that members can earn rewards from eligible spending without changing everyday habits.
- Primary CTA: Unirme como suscriptor temprano
- Secondary CTA: Ver como funciona

### Why Join

Three benefits:

- Gana con compras cotidianas
- Compra en negocios participantes
- Acumula valor para beneficios mayores

### Early Subscriber Benefits

Four benefits:

- Acceso antes del lanzamiento publico
- Primeras noticias y actualizaciones
- Beneficios exclusivos de lanzamiento
- Primeras oportunidades de recompensas

### Rewards System

Four-step flow:

1. Te unes
2. Compras en la red
3. Ganas recompensas de 20% a 100% en compras elegibles
4. Canjeas recompensas por ofertas, experiencias, valor de tarjetas de regalo o beneficios disponibles

Include a short note: Las recompensas son creditos/ofertas del programa, no pagos automaticos en efectivo.

### Membership Advantages

Explain membership as the account layer that protects and unlocks value:

- Una cuenta verificada
- Historial y saldo en un solo lugar
- Acceso a ofertas para miembros
- Proteccion contra duplicados o reclamos invalidos

### FAQ

Keep current FAQ and add client-aligned questions:

- Por que deberia suscribirme temprano?
- Como gano recompensas?
- Donde puedo usar mis recompensas?
- Las recompensas son dinero en efectivo?
- Que incluye la membresia?

## Routing

- Add `/landing-page` route rendering the improved `LandingPage`.
- Keep `/` rendering `EarlyAccessPage`.
- Keep `/early-access` rendering `EarlyAccessPage`.
- CTA links from `/landing-page` should point to `/early-access`.

## Content And Translation

- Spanish remains default through `src/lib/language.tsx`.
- All new visible strings must be wrapped in `t(...)`.
- Every new English source string must have a Spanish dictionary entry.
- Existing translation audit test should continue to pass.

## Testing

Add or update tests to verify:

- Router exposes `/landing-page`.
- Landing page content includes the four client-required topic areas.
- CTA links point to `/early-access`.
- Translation audit still passes.

## Non-Goals

- Do not replace the `/` early-access letter page.
- Do not add payment processing.
- Do not change authenticated customer/business/admin workflows.
- Do not redesign the entire app theme.
