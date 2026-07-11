import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const host = '127.0.0.1'
const port = Number(process.env.RESPONSIVE_AUDIT_PORT ?? 5176)
const baseUrl = `http://${host}:${port}`
const outputDir = '.tmp-responsive-audit'

const viewports = [
  { name: 'small-mobile', width: 360, height: 780 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
]

const routes = [
  { name: 'home', path: '/', fullViewport: true },
  { name: 'signin', path: '/signin', fullViewport: true },
  { name: 'reset-password', path: '/reset-password', fullViewport: true },
  { name: 'business-login', path: '/business/login', fullViewport: true },
  { name: 'admin-login', path: '/admin', fullViewport: true },
  { name: 'agreements-required', path: '/agreements/required' },
  { name: 'promo', path: '/promo' },
  { name: 'promo-register', path: '/promo/register' },
  { name: 'ambassadors', path: '/ambassadors', fullViewport: true },
  { name: 'join', path: '/join', fullViewport: true },
  { name: 'invitation', path: '/invitation', fullViewport: true },
  { name: 'early-access-alias', path: '/early-access' },
  { name: 'landing', path: '/landing-page', fullViewport: true },
  { name: 'business-qr', path: '/b/velvet-brew', fullViewport: true },
  { name: 'joinusearly-alias', path: '/joinusearly' },
  { name: 'join-us-early-alias', path: '/join-us-early' },
  { name: 'terms', path: '/terms', fullViewport: true },
  { name: 'privacy', path: '/privacy', fullViewport: true },
  { name: 'reward-terms', path: '/reward-terms' },
  { name: 'verification-policy', path: '/verification-policy' },
  { name: 'guide', path: '/guide', fullViewport: true },
  { name: 'public-gift-card', path: '/g/demo-token' },
  { name: 'cost-calculator', path: '/cost-calculator', fullViewport: true },
  { name: 'business-cost-calculator-alias', path: '/business/cost-calculator' },
  { name: 'businesses-map', path: '/shop', fullViewport: true },
  { name: 'hidden-rewards', path: '/rewards' },
  { name: 'business-onboarding', path: '/business', fullViewport: true },
  { name: 'for-businesses-alias', path: '/for-businesses' },
  { name: 'promotions', path: '/promotions', fullViewport: true },
  { name: 'customer-dashboard-protected', path: '/dashboard' },
  { name: 'customer-gift-cards-protected', path: '/gift-cards' },
  { name: 'customer-wallet-gift-cards-protected', path: '/wallet/gift-cards' },
  { name: 'customer-wallet-gift-card-detail-protected', path: '/wallet/gift-cards/demo-card' },
  { name: 'customer-cart-protected', path: '/cart' },
  { name: 'customer-checkout-protected', path: '/checkout' },
  { name: 'customer-order-confirmation-protected', path: '/order-confirmation' },
  { name: 'customer-orders-protected', path: '/orders' },
  { name: 'customer-membership-protected', path: '/membership' },
  { name: 'customer-redeem-protected', path: '/redeem/demo-reward' },
  { name: 'customer-activity-protected', path: '/activity' },
  { name: 'customer-profile-protected', path: '/profile' },
  { name: 'admin-portal-protected', path: '/admin/portal' },
  { name: 'admin-gift-cards-protected', path: '/admin/gift-cards' },
  { name: 'admin-guide-protected', path: '/admin/guide' },
  { name: 'business-dashboard-protected', path: '/business/dashboard' },
  { name: 'business-member-sale-protected', path: '/business/member-sale/demo-token' },
  { name: 'business-products-protected', path: '/business/products' },
  { name: 'business-rewards-protected', path: '/business/rewards' },
  { name: 'business-gift-cards-protected', path: '/business/gift-cards' },
  { name: 'business-redemptions-protected', path: '/business/redemptions' },
  { name: 'business-promotions-protected', path: '/business/promotions' },
  { name: 'business-members-protected', path: '/business/members' },
  { name: 'business-partners-protected', path: '/business/partners' },
  { name: 'business-guide-protected', path: '/business/guide' },
  { name: 'business-settings-protected', path: '/business/settings' },
  { name: 'not-found', path: '/not-a-real-route', fullViewport: true },
]

function shouldAuditRouteAtViewport(route, viewport) {
  return viewport.name === 'small-mobile' || route.fullViewport
}

function formatRouteUrl(path) {
  return `${baseUrl}${path}`
}

function summarizeConsoleMessage(message) {
  return {
    type: message.type(),
    text: message.text().slice(0, 220),
  }
}

function isIgnoredConsoleError(message) {
  return message.text().includes('ERR_NETWORK_ACCESS_DENIED')
}

async function main() {
  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  const server = await createServer({
    server: {
      host,
      port,
      strictPort: true,
    },
  })

  await server.listen()

  const browser = await chromium.launch()
  const results = []

  try {
    for (const viewport of viewports) {
      const routesForViewport = routes.filter((route) => shouldAuditRouteAtViewport(route, viewport))
      const context = await browser.newContext({
        viewport: {
          width: viewport.width,
          height: viewport.height,
        },
        deviceScaleFactor: 1,
      })

      for (const route of routesForViewport) {
        const page = await context.newPage()
        const consoleMessages = []
        const pageErrors = []

        page.on('console', (message) => {
          if (message.type() === 'error' && !isIgnoredConsoleError(message)) {
            consoleMessages.push(summarizeConsoleMessage(message))
          }
        })
        page.on('pageerror', (error) => {
          pageErrors.push(error.message.slice(0, 220))
        })

        const url = formatRouteUrl(route.path)
        let status = 'ok'
        let finalUrl = ''

        try {
          const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 12_000,
          })
          await page.waitForTimeout(450)
          status = response?.ok() || response?.status() === 304 ? 'ok' : `http-${response?.status() ?? 'unknown'}`
          finalUrl = page.url().replace(baseUrl, '')
        } catch (error) {
          status = `error: ${error instanceof Error ? error.message : String(error)}`
        }

        const metrics = await page.evaluate(() => {
          const documentWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth)
          const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
          const oversizedElements = Array.from(document.querySelectorAll('body *'))
            .map((element) => {
              const rect = element.getBoundingClientRect()
              const styles = window.getComputedStyle(element)
              return {
                tag: element.tagName.toLowerCase(),
                className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
                text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90),
                width: Math.round(rect.width),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                display: styles.display,
                position: styles.position,
              }
            })
            .filter((element) => element.display !== 'none' && element.width > window.innerWidth + 8)
            .slice(0, 8)
          const clippedInteractiveElements = Array.from(
            document.querySelectorAll('a, button, input, select, textarea, summary, [role="button"], [tabindex]:not([tabindex="-1"])'),
          )
            .map((element) => {
              const rect = element.getBoundingClientRect()
              const styles = window.getComputedStyle(element)
              return {
                tag: element.tagName.toLowerCase(),
                className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
                text: (element.textContent ?? element.getAttribute('aria-label') ?? element.getAttribute('placeholder') ?? '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .slice(0, 90),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                top: Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                display: styles.display,
                visibility: styles.visibility,
              }
            })
            .filter(
              (element) =>
                element.display !== 'none' &&
                element.visibility !== 'hidden' &&
                element.width > 0 &&
                element.height > 0 &&
                (element.left < -2 || element.right > window.innerWidth + 2),
            )
            .slice(0, 8)

          return {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            documentWidth,
            documentHeight,
            overflowX: Math.max(0, documentWidth - window.innerWidth),
            bodyTextLength: document.body.innerText.length,
            headings: Array.from(document.querySelectorAll('h1, h2'))
              .map((heading) => heading.textContent?.replace(/\s+/g, ' ').trim())
              .filter(Boolean)
              .slice(0, 8),
            oversizedElements,
            clippedInteractiveElements,
          }
        })

        const screenshotPath = join(outputDir, `${route.name}-${viewport.name}.png`)
        await page.screenshot({ path: screenshotPath, fullPage: viewport.name === 'small-mobile' })

        results.push({
          route: route.path,
          name: route.name,
          viewport: viewport.name,
          status,
          finalUrl,
          screenshotPath,
          consoleErrors: consoleMessages,
          pageErrors,
          ...metrics,
        })

        await page.close()
      }

      await context.close()
    }
  } finally {
    await browser.close()
    await server.close()
  }

  await writeFile(join(outputDir, 'summary.json'), JSON.stringify(results, null, 2))

  const issues = results.filter(
    (result) =>
      result.status !== 'ok' ||
      result.overflowX > 2 ||
      result.clippedInteractiveElements.length > 0 ||
      result.consoleErrors.length > 0 ||
      result.pageErrors.length > 0,
  )

  console.log(`Responsive audit complete: ${results.length} checks`)
  console.log(`Screenshots: ${outputDir}`)
  console.log(`Issues: ${issues.length}`)
  for (const issue of issues) {
    console.log(
      JSON.stringify({
        route: issue.route,
        viewport: issue.viewport,
        status: issue.status,
        finalUrl: issue.finalUrl,
        overflowX: issue.overflowX,
        oversizedElements: issue.oversizedElements.slice(0, 3),
        clippedInteractiveElements: issue.clippedInteractiveElements.slice(0, 3),
        consoleErrors: issue.consoleErrors.slice(0, 2),
        pageErrors: issue.pageErrors.slice(0, 2),
        screenshotPath: issue.screenshotPath,
      }),
    )
  }

  if (issues.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
