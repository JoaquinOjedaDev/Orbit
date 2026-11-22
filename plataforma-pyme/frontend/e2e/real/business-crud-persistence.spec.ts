import { test, expect, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api = 'http://127.0.0.1:18001/api/v1'
test.beforeAll(() => {
  if (process.env.PYME_DISPOSABLE_QA !== '1')
    throw new Error('T11-F: operaciones REAL solo sobre PostgreSQL efímero')
})

async function signIn(page: Page, actor: { email: string; password: string }) {
  await page.getByLabel('Email', { exact: true }).fill(actor.email)
  await page.getByLabel('Password', { exact: true }).fill(actor.password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
}

test('T11-F: UI sede, catálogo y proveedor con estados persistentes después de F5', async ({ page, request }) => {
  const email = 't11-persistence-' + randomUUID() + '@example.com'
  const password = 'Orbit-1-' + globalThis.crypto.randomUUID()
  const signup = await request.post(api + '/auth/register', {
    data: { email, password, display_name: 'T11-F QA' },
  })
  expect(signup.status(), await signup.text()).toBe(201)
  const login = await request.post(api + '/auth/login', { data: { email, password } })
  expect(login.status(), await login.text()).toBe(200)
  const headers = { Authorization: 'Bearer ' + (await login.json()).access_token }
  const companyResponse = await request.post(api + '/businesses', {
    headers: { ...headers, 'Idempotency-Key': randomUUID() },
    data: { name: 'QA CRUD ' + randomUUID().slice(0, 8), category: 'QA', activity_kind: 'MIXTO' },
  })
  expect(companyResponse.status(), await companyResponse.text()).toBe(201)
  const company = await companyResponse.json()
  const root = '/businesses/' + company.id
  const get = async (resource: string) => {
    const response = await request.get(api + root + resource, { headers })
    expect(response.status(), await response.text()).toBe(200)
    return response.json()
  }

  await page.goto('/real/empresas/' + company.id + '/ubicaciones')
  await signIn(page, { email, password })
  await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible()
  await page.getByRole('button', { name: 'Create real location' }).click()
  await page.getByLabel('Name', { exact: true }).fill('Sede T11-F CRUD')
  await page.getByLabel('Allow sales').check()
  await page.getByLabel('Allow inventory').check()
  await page.getByRole('button', { name: 'Guardar en PostgreSQL' }).click()
  const site = page.locator('article.real-ops-tile').filter({ hasText: 'Sede T11-F CRUD' })
  await expect(site).toContainText('ACTIVA')
  expect(await get('/locations')).toHaveLength(1)

  page.once('dialog', dialog => void dialog.accept())
  await site.getByRole('button', { name: 'Pausar' }).click()
  await expect(site).toContainText('PAUSADA')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Log in real' })).toBeVisible()
  await signIn(page, { email, password })
  await expect(site).toContainText('PAUSADA')
  expect((await get('/locations'))[0].status).toBe('PAUSADA')
  page.once('dialog', dialog => void dialog.accept())
  await site.getByRole('button', { name: 'Reactivar' }).click()
  await expect(site).toContainText('ACTIVA')
  expect((await get('/locations'))[0].status).toBe('ACTIVA')

  await page.getByRole('button', { name: 'Company', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir Catálogo' }).click()
  await expect(page.getByRole('heading', { name: 'Catalogue of articles' })).toBeVisible()
  for (const [name, kind, price] of [
    ['Bien T11-F CRUD', 'REVENTA', '1500'],
    ['Servicio T11-F CRUD', 'SERVICIO', '2300'],
  ]) {
    await page.getByRole('button', { name: 'Create REAL article' }).click()
    await page.getByLabel('Name', { exact: true }).fill(name)
    await page.locator('form.real-ops-form select').first().selectOption(kind)
    await page.getByLabel('Category').fill('QA pruebas')
    await page.getByLabel('Price (weights, optional)').fill(price)
    await page.getByRole('button', { name: 'Save Item' }).click()
    await expect(page.locator('article.real-catalog-tile').filter({ hasText: name }))
      .toContainText('ACTIVO')
  }
  const good = page.locator('article.real-catalog-tile').filter({ hasText: 'Bien T11-F CRUD' })
  page.once('dialog', dialog => void dialog.accept())
  await good.getByRole('button', { name: 'Desactivar' }).click()
  await expect(good).toContainText('INACTIVO')
  await page.reload()
  await signIn(page, { email, password })
  await expect(good).toContainText('INACTIVO')
  const catalog = await get('/catalog')
  expect(catalog).toHaveLength(2)
  expect(catalog.find((x: { name: string }) => x.name === 'Bien T11-F CRUD').status).toBe('INACTIVO')
  expect(catalog.find((x: { name: string }) => x.name === 'Servicio T11-F CRUD').status).toBe('ACTIVO')
  page.once('dialog', dialog => void dialog.accept())
  await good.getByRole('button', { name: 'Reactivar' }).click()
  await expect(good).toContainText('ACTIVO')

  await page.getByRole('button', { name: 'Company', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir Proveedores' }).click()
  await expect(page.getByRole('heading', { name: 'Suppliers' })).toBeVisible()
  await page.getByRole('button', { name: 'Add REAL Provider' }).click()
  await expect(page.getByRole('heading', { name: 'New supplier' })).toBeVisible()
  await page.getByLabel('Trade name').fill('Proveedor T11-F CRUD')
  await page.getByRole('button', { name: 'Create Provider' }).click()
  const supplier = page.locator('article.real-ops-tile').filter({ hasText: 'Proveedor T11-F CRUD' })
  await expect(supplier).toContainText('ACTIVO')
  page.once('dialog', dialog => void dialog.accept())
  await supplier.getByRole('button', { name: 'Desactivar' }).click()
  await expect(supplier).toContainText('INACTIVO')
  await page.reload()
  await signIn(page, { email, password })
  await expect(supplier).toContainText('INACTIVO')
  expect((await get('/suppliers'))[0].status).toBe('INACTIVO')
  page.once('dialog', dialog => void dialog.accept())
  await supplier.getByRole('button', { name: 'Reactivar' }).click()
  await expect(supplier).toContainText('ACTIVO')
  expect((await get('/suppliers'))[0].status).toBe('ACTIVO')

  // CRUD on catalog/suppliers/locations must not synthesize inventory or sales.
  expect(await get('/sales')).toEqual([])
  expect(await get('/inventory/balances')).toEqual([])
  expect(await get('/inventory/movements')).toEqual([])
})
