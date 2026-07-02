import { expect, test } from '@playwright/test'

test.describe('public acquisition workflow', () => {
  test('landing page and early access page render', async ({ page }) => {
    await page.goto('/landing-page')
    await expect(page.locator('body')).toContainText('Guatemala Rewards')
    await expect(page.getByRole('heading', { name: /Earn a free vacation every year/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Early adopter monthly subscription' })).toBeVisible()
    await expect(page.getByText('$100,000 in Rewards')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
    await expect(page.getByText('Where can I use my rewards?')).toBeVisible()
    await expect(page.getByRole('link', { name: /Businesses/i })).toHaveAttribute('href', '/business')
    await expect(page.getByText('You can use your rewards with partnered businesses inside the Guatemala Rewards network.')).toBeHidden()
    await page.getByText('Where can I use my rewards?').click()
    await expect(page.getByText('You can use your rewards with partnered businesses inside the Guatemala Rewards network.')).toBeVisible()

    await page.goto('/invitation')
    await expect(page.locator('body')).toContainText(/Medell[ií]n Rewards/)
    await expect(page.locator('body')).toContainText(/Suscribirse|Subscribe/i)
    await page.getByRole('button', { name: /Suscribirse|Subscribe/i }).click()
    await page.getByRole('button', { name: /Suscribirse|Subscribe/i }).click()
    await expect(page.getByText(/Enter your WhatsApp number|Ingresa tu n.mero de WhatsApp/i)).toBeVisible()
    await expect(page.getByText(/Enter your email|Ingresa tu correo/i)).toBeVisible()
  })
})
