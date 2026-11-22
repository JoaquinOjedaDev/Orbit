import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api = 'http://127.0.0.1:18001/api/v1'
test.beforeAll(() => {
  if (process.env.PYME_DISPOSABLE_QA !== '1') throw new Error('E3-1C2 exige PostgreSQL descartable')
})

test('E3-1C2: ficha, edición, persistencia y móvil', async ({ page, request }) => {
  const email = 'e3-c2-' + randomUUID() + '@example.com'
  const password = 'Orbit-1-' + globalThis.crypto.randomUUID()
  const name = 'Empresa C2 ' + randomUUID().slice(0, 8)
  const revised = name + ' Renovada'
  const reg = await request.post(api + '/auth/register', {
    data: { email, password, display_name: 'QA E3 C2' },
  })
  expect(reg.status(), await reg.text()).toBe(201)
  const auth = await request.post(api + '/auth/login', { data: { email, password } })
  expect(auth.status(), await auth.text()).toBe(200)
  const headers = { Authorization: 'Bearer ' + (await auth.json()).access_token }
  const create = await request.post(api + '/businesses', {
    headers: { ...headers, 'Idempotency-Key': randomUUID() },
    data: { name, category: 'Comercio minorista', activity_kind: 'MIXTO' },
  })
  expect(create.status(), await create.text()).toBe(201)
  const company = await create.json()
  await page.goto('/real/empresas/' + company.id)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Company details' })).toBeVisible()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Company information' })).toContainText('Products and services')
  await page.getByText('Technical information', { exact: true }).click()
  await expect(page.getByText(company.id, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Edit Data' }).click()
  const form = page.getByRole('form', { name: 'Company Editing Form' })
  await form.getByLabel('Trade name').fill(revised)
  await form.getByLabel('Rubro').fill('Servicios profesionales')
  await form.getByLabel('Activity').selectOption('SERVICIOS')
  await form.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByRole('heading', { name: revised, exact: true })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Datos de la empresa actualizados' })).toBeVisible()
  // Reopen the editor: it must show the confirmed server values, not the old draft.
  await page.getByRole('button', { name: 'Edit Data' }).click()
  const reopened = page.getByRole('form', { name: 'Company Editing Form' })
  await expect(reopened.getByLabel('Trade name')).toHaveValue(revised)
  await expect(reopened.getByLabel('Rubro')).toHaveValue('Servicios profesionales')
  await expect(reopened.getByLabel('Activity')).toHaveValue('SERVICIOS')
  await reopened.getByRole('button', { name: 'Cancel' }).click()
  const fetched = await request.get(api + '/businesses/' + company.id, { headers })
  expect(fetched.status(), await fetched.text()).toBe(200)
  const saved = await fetched.json()
  expect(saved.name).toBe(revised)
  expect(saved.category).toBe('Servicios profesionales')
  expect(saved.activity_kind).toBe('SERVICIOS')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Abrir Ubicaciones' })).toBeVisible()
  const width = await page.evaluate(() =>
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth))
  expect(width).toBeLessThanOrEqual(391)
  await page.reload()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByRole('heading', { name: revised, exact: true })).toBeVisible()
})
