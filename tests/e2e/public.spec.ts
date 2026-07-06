import { expect, test } from '@playwright/test'

test.describe('public acquisition workflow', () => {
  test('landing page and early access page render', async ({ page }) => {
    await page.goto('/landing-page')
    await expect(page.locator('body')).toContainText('Guatemala Rewards')
    await expect(page.getByRole('heading', { name: /Scan once\. Join locally\. Earn rewards/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Partner QR sticker rollout' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'One sticker code per partner business' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Businesses/i })).toHaveAttribute('href', '/business')
    await expect(page.getByText('Each QR is individually coded for one business.')).toBeHidden()
    await page.getByText('What does each partner QR do?').click()
    await expect(page.getByText('Each QR is individually coded for one business.')).toBeVisible()

    await page.goto('/invitation')
    await expect(page.locator('body')).toContainText('Guatemala Rewards')
    await expect(page.locator('body')).toContainText(/highest-paying rewards program|programa de recompensas que mas paga/i)
    await expect(page.locator('body')).toContainText(/Suscribirse|Subscribe/i)
    await page.getByRole('button', { name: /Suscribirse|Subscribe/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /Join early access|Unirse al acceso temprano/i })).toBeVisible()
    await dialog.getByRole('button', { name: /Suscribirse|Subscribe/i }).click()
    await expect(dialog.getByText(/Enter your name|Ingresa tu nombre/i)).toBeVisible()
    await expect(dialog.getByText(/Enter your WhatsApp number|Ingresa tu n.mero de WhatsApp/i)).toBeVisible()
    await expect(dialog.getByText(/Enter your email|Ingresa tu correo/i)).toBeVisible()
  })
})
