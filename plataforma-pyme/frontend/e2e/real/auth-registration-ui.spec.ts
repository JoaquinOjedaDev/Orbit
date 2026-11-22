import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api = 'http://127.0.0.1:18001/api/v1'
test.beforeAll(() => {
  if (process.env.PYME_DISPOSABLE_QA !== '1')
    throw new Error('T11-F auth UI solo en DB efímera')
})

test('E27-AUTH-01: registro por UI, login explícito y GET /me de PostgreSQL', async ({ page, request }) => {
  const email = 't11-register-' + randomUUID() + '@example.com'
  const password = 'Orbit-1-' + globalThis.crypto.randomUUID()
  const name = 'QA Registro T11-F'
  let registrations = 0
  page.on('request', req => {
    if (req.method() === 'POST' && new URL(req.url()).pathname.endsWith('/api/v1/auth/register'))
      registrations++
  })

  await page.goto('/real/registro')
  await expect(page.getByRole('heading', { name: 'Create real account' })).toBeVisible()
  await page.getByLabel('Visible name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password (minimum 15 characters)').fill(password)
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page.getByRole('heading', { name: 'Log in real' })).toBeVisible()
  await expect(page.getByText('Cuenta registrada. Iniciá sesión', { exact: false })).toBeVisible()
  expect(registrations).toBe(1)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await expect(page.getByText(email, { exact: true })).toBeVisible()

  // E3-1H3: abrir el formulario no acepta ninguna invitación ni emite escrituras.
  await page.getByRole('button', { name: 'Enter invitation code' }).click()
  await expect(page.getByRole('heading', { name: 'Enter invitation code' })).toBeVisible()
  await expect(page.getByLabel('43 character code')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accept invitation' })).toBeDisabled()
  await page.getByRole('button', { name: 'My real profile' }).click()
  await expect(page.getByRole('heading', { name: 'My profile' })).toBeVisible()

  const login = await request.post(api + '/auth/login', { data: { email, password } })
  expect(login.status(), await login.text()).toBe(200)
  const token = (await login.json()).access_token
  const me = await request.get(api + '/auth/me', {
    headers: { Authorization: 'Bearer ' + token },
  })
  expect(me.status(), await me.text()).toBe(200)
  expect(await me.json()).toMatchObject({ email, display_name: name, status: 'ACTIVO' })
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Log in real' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Log in real' })).toBeVisible()
  expect(registrations).toBe(1)
})
