import { expect, test } from '@playwright/test'

test.describe('platform guide workflow', () => {
  test('public guide explains the platform with Spanish-first video-ready content', async ({ page }) => {
    await page.goto('/guide')

    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { name: 'Guia de la plataforma' })).toBeVisible()
    await expect(page.getByText('Video aqui proximamente')).toBeVisible()
    await expect(page.getByText('Storyboard con pantallas')).toBeVisible()
    await expect(page.getByText('English version')).not.toBeVisible()
    await expect(page.getByText('Platform guide', { exact: true })).not.toBeVisible()

    await expect(page.getByText('Guion en espanol')).not.toBeVisible()
    await expect(page.getByText('Script base para grabar')).not.toBeVisible()
    await expect(page.getByText('Notas para presentar')).not.toBeVisible()
    await expect(page.locator('body')).not.toContainText('Que es Guatemala Rewards')
    await expect(page.locator('body')).not.toContainText('Experiencia del cliente')
    await expect(page.locator('body')).not.toContainText('Flujo para negocios')
    await expect(page.locator('body')).not.toContainText('Flujo para administradores')
    await expect(page.locator('body')).not.toContainText('What the platform does')

    await expect(page.getByRole('link', { name: 'Ver mapa' })).toHaveAttribute('href', '/shop')
    await expect(page.getByRole('link', { name: 'Portal negocio' })).toHaveAttribute('href', '/business/dashboard')
    await expect(page.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/portal#members')
  })

  test('public guide follows the English language preference without Spanish guide copy', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('guatemalarewards-language', 'en')
    })

    await page.goto('/guide')

    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { name: 'Platform guide' })).toBeVisible()
    await expect(page.getByText('Video coming soon')).toBeVisible()
    await expect(page.getByText('Screen storyboard')).toBeVisible()

    await expect(page.getByText('English script')).not.toBeVisible()
    await expect(page.getByText('Recording script')).not.toBeVisible()
    await expect(page.getByText('Presentation notes')).not.toBeVisible()
    await expect(page.locator('body')).not.toContainText('What the platform does')
    await expect(page.locator('body')).not.toContainText('Customer flow')
    await expect(page.locator('body')).not.toContainText('Business flow')
    await expect(page.locator('body')).not.toContainText('Admin flow')
    await expect(page.getByText('Guia de la plataforma')).not.toBeVisible()
    await expect(page.getByText('Guion en espanol')).not.toBeVisible()
    await expect(page.locator('body')).not.toContainText('Experiencia del cliente')

    await expect(page.getByRole('link', { name: 'View map' })).toHaveAttribute('href', '/shop')
    await expect(page.getByRole('link', { name: 'Business portal' })).toHaveAttribute('href', '/business/dashboard')
    await expect(page.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/portal#members')
  })

  test('public navigation exposes the guide link', async ({ page }) => {
    await page.goto('/business')

    await expect(page.getByRole('link', { name: 'Guia' })).toHaveAttribute('href', '/guide')
    await page.getByRole('link', { name: 'Guia' }).click()
    await expect(page).toHaveURL(/\/guide$/)
    await expect(page.getByRole('heading', { name: 'Guia de la plataforma' })).toBeVisible()
  })

})
