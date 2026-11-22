import { expect, test } from '@playwright/test'

test('navegación personal, tenants, placeholder y URL de empresa ajena', async ({ page }) => {
  await page.goto('/inicio')
  await expect(page.getByRole('heading', { name: 'Welcome to your workspace' })).toBeVisible()

  await page.goto('/b/walos-demo/inicio')
  await expect(page.locator('.business-hero h2')).toHaveText('WALOS')

  await page.goto('/b/comercio-demo/inicio')
  await expect(page.locator('.business-hero h2')).toHaveText('Sample Retail Business')

  await page.goto('/b/walos-demo/analisis')
  await expect(page.getByRole('heading', { name: 'We\'re preparing this section.' })).toBeVisible()

  await page.goto('/b/no-existe/ventas')
  await expect(page.getByRole('heading', { name: 'Company not available' })).toBeVisible()
})

test('drawer: Escape cierra y devuelve foco; páginas sin desborde horizontal', async ({ page }) => {
  await page.goto('/b/walos-demo/inicio')
  const trigger = page.getByRole('button', { name: 'Open Main Menu' })
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Main menu' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Main menu' })).toHaveCount(0)
  await expect(trigger).toBeFocused()

  for (const path of ['/b/walos-demo/catalogo', '/b/walos-demo/ventas', '/b/walos-demo/inventario']) {
    await page.goto(path)
    await expect(page.locator('#main-content')).toBeVisible()
    const overflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }))
    expect(overflow.documentWidth, 'Desborde horizontal en ' + path).toBeLessThanOrEqual(overflow.viewportWidth + 2)
  }
})

test('servicio por empresa y QR DEMO: pendiente, persistencia, cancelación y aprobación única', async ({ page }) => {
  const service = 'Servicio E2E de prueba'
  await page.goto('/b/walos-demo/catalogo')
  await page.getByRole('button', { name: 'Add article or service' }).click()
  await page.getByLabel('Name of article or service *').fill(service)
  await page.getByLabel('Tipo *').selectOption('SERVICIO')
  await page.getByLabel('List price (ARS, optional)').fill('1500,00')
  await page.getByRole('button', { name: 'Add to DEMO Catalogue' }).click()
  await expect(page.getByText(service, { exact: true })).toBeVisible()

  await page.goto('/b/comercio-demo/catalogo')
  await expect(page.getByText(service, { exact: true })).toHaveCount(0)

  async function createQr() {
    await page.goto('/b/walos-demo/ventas')
    await page.getByRole('button', { name: 'New sale' }).click()
    await page.getByLabel('Artículo o servicio 1').selectOption({ label: service + ' · Servicio' })
    await page.locator('.sales-payment-row').first().locator('select').first().selectOption('MERCADO_PAGO_DECLARADO')
    await page.getByLabel('Amount applied ARS').fill('1500')
    await page.getByRole('button', { name: 'Generate QR DEMO' }).click()
    await expect(page.getByRole('region', { name: 'Demonstration QR collection intent' })).toContainText('Outstanding (no charge)')
  }

  await createQr()
  await expect(page.getByRole('heading', { name: 'DEMO sales check' })).toHaveCount(0)

  // El estado sobrevive F5. En otra empresa el QR no debe aparecer.
  await page.reload()
  await page.getByRole('button', { name: 'See QR DEMO' }).click()
  await expect(page.getByRole('region', { name: 'Demonstration QR collection intent' })).toContainText('Outstanding (no charge)')
  await page.goto('/b/comercio-demo/ventas')
  await expect(page.getByRole('heading', { name: 'Intentions QR DEMO' })).toHaveCount(0)

  await page.goto('/b/walos-demo/ventas')
  await page.getByRole('button', { name: 'See QR DEMO' }).click()
  await page.getByRole('button', { name: 'Cancel Intent' }).click()
  await expect(page.getByRole('region', { name: 'Demonstration QR collection intent' })).toContainText('Cancelado')
  await expect(page.locator('.sales-list-row')).toHaveCount(0)

  await createQr()
  await page.getByRole('button', { name: 'Simulate approval (no actual charge)' }).click()
  await expect(page.getByRole('heading', { name: 'DEMO sales check' })).toBeVisible()
  await expect(page.locator('.sales-list-row')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.sales-list-row')).toHaveCount(1)
  await expect(page.locator('.qr-demo-entry')).toHaveCount(2)
})
