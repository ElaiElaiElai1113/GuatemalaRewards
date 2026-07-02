# Guatemala Rewards

React + TypeScript + Vite application for the Guatemala Rewards member, business, and admin platform backed by Supabase.

Checkout is currently a labeled demo flow for rewards testing. No real payment is processed.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from `.env.example` and set:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the dev server:

```bash
npm run dev
```

## Database Setup

Apply the Supabase migrations before using the app locally. The launch-critical flows now depend on database RPCs for checkout, reward redemption, reward-point adjustments, and reward-credit consumption.

```bash
supabase db reset
```

## Verification

```bash
npm run lint
npm run test
npm run build
```

## Production Build

```bash
npm run build
```

The production output is written to `dist/`.

## App / PWA Version

The app version is an installable PWA that uses the same React routes and Supabase backend as the website. Build it with:

```bash
npm run build
npm run preview
```

Then open the preview URL in Chrome DevTools and run a Lighthouse PWA check, or open the deployed site on a phone and use the browser install flow. Android Chrome should show an install option when criteria are met. On iOS Safari, use Share -> Add to Home Screen.

The PWA is online-first: account data, QR sale recording, rewards, and admin operations require an internet connection.

### Native Android and iOS App

This repo includes a Capacitor wrapper so the same React app can be packaged as real Android and iOS apps.

```bash
npm run native:sync
```

Android:

```bash
npm run android:sync
npm run android:open
```

Build Android APK/AAB from Android Studio, or run `npm run android:build:debug` after Android Studio/Gradle is fully installed. Final release builds require a signing key, Play Store package details, app icons, screenshots, and privacy declarations.

iOS:

```bash
npm run ios:sync
npm run ios:open
```

iOS builds require macOS with Xcode. Final release builds require an Apple Developer account, bundle signing, App Store Connect metadata, app icons, screenshots, and privacy declarations.

The native apps use the same online-first behavior as the website and PWA. Add push notifications only after the team has a clear use case such as verification status, reward updates, or commission alerts. Add analytics/crash reporting after choosing a provider, such as Sentry, PostHog, Firebase, or Vercel Analytics.

## Vercel Deployment

This repo is configured for Vercel with:

- Vite framework build output in `dist/`
- SPA fallback to `index.html` so React Router routes work on refresh and direct URL access

Set these environment variables in the Vercel project before deploying:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Recommended Vercel settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

After adding the env vars, deploy with either the Vercel dashboard or:
```bash
vercel
```
