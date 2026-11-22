import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api='http://127.0.0.1:18001/api/v1'
test.beforeAll(()=>{
  if(process.env.PYME_DISPOSABLE_QA!=='1')
    throw new Error('E3-1H1 exige API y PostgreSQL descartables: nunca usar datos personales.')
})

test('E3-1H1: pasos REAL, actualización GET y aislamiento de dos empresas',async({page,request})=>{
  const email='e3-h1-'+randomUUID()+'@example.com'
  const password='Orbit-1-' + globalThis.crypto.randomUUID()
  const register=await request.post(api+'/auth/register',{
    data:{email,password,display_name:'QA onboarding'},
  })
  expect(register.status(),await register.text()).toBe(201)
  const login=await request.post(api+'/auth/login',{data:{email,password}})
  expect(login.status(),await login.text()).toBe(200)
  const headers={Authorization:'Bearer '+(await login.json()).access_token}
  async function createCompany(name:string):Promise<{id:string}>{
    const response=await request.post(api+'/businesses',{
      headers:{...headers,'Idempotency-Key':randomUUID()},
      data:{name,category:'Comercio QA',activity_kind:'MIXTO'},
    })
    expect(response.status(),await response.text()).toBe(201)
    return response.json()
  }
  const a=await createCompany('Onboarding A '+randomUUID().slice(0,6))
  const b=await createCompany('Onboarding B '+randomUUID().slice(0,6))
  const base='/businesses/'+a.id

  let writes=0
  page.on('request',req=>{
    if(req.method()!=='GET'&&new URL(req.url()).pathname.startsWith('/api/v1/businesses/'))writes++
  })
  await page.goto('/real/empresas/'+a.id+'/inicio')
  await page.getByLabel('Email',{exact:true}).fill(email)
  await page.getByLabel('Password',{exact:true}).fill(password)
  await page.getByRole('button',{name:'Ingresar',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible()
  await expect(page.getByText(a.id,{exact:true})).toHaveCount(0)
  const progress=page.getByRole('progressbar',{name:'Observed initial configuration'})
  await expect(progress).toHaveAttribute('aria-valuenow','0')
  await expect(page.getByRole('region',{name:'REAL Configuration Guide'})).toContainText('Pending')
  expect(writes).toBe(0)

  const location=await request.post(api+base+'/locations',{
    headers,data:{name:'Sede QA H1',kind:'LOCAL',can_sell:true,can_store:true},
  })
  expect(location.status(),await location.text()).toBe(201)
  const locationId=(await location.json()).id
  const item=await request.post(api+base+'/catalog',{
    headers,data:{name:'Artículo QA H1',kind:'REVENTA',unit:'UNIDAD',
      sellable:true,price_cents:100000},
  })
  expect(item.status(),await item.text()).toBe(201)
  const itemId=(await item.json()).id
  await page.getByRole('button',{name:'Update from API'}).click()
  await expect(progress).toHaveAttribute('aria-valuenow','2')
  await expect(page.getByRole('region',{name:'REAL Configuration Guide'}))
    .toContainText('No encontramos existencias positivas')
  expect(writes).toBe(0)

  const stock=await request.post(api+base+'/inventory/adjustments',{
    headers:{...headers,'Idempotency-Key':randomUUID()},
    data:{kind:'STOCK_INICIAL',catalog_item_id:itemId,location_id:locationId,
      quantity_milli:3000,expected_version:0,reason:'Onboarding REAL QA'},
  })
  expect(stock.status(),await stock.text()).toBe(201)
  await page.getByRole('button',{name:'Update from API'}).click()
  await expect(progress).toHaveAttribute('aria-valuenow','3')
  await expect(page.getByText('Primeros pasos comprobados.',{exact:false})).toBeVisible()

  await page.getByLabel('Change of company REAL').selectOption(b.id)
  await expect(page).toHaveURL(new RegExp('/real/empresas/'+b.id+'$'))
  await page.getByRole('button',{name:'Home',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Home',exact:true})).toBeVisible()
  await expect(progress).toHaveAttribute('aria-valuenow','0')
  await expect(page.locator('.e3-onboard-business-strip')).toContainText('Onboarding B')
  await expect(page.locator('.e3-onboard-business-strip')).not.toContainText('Onboarding A')
  expect(writes).toBe(0)

  await page.setViewportSize({width:390,height:844})
  const viewport=await page.evaluate(()=>
    Math.max(document.documentElement.scrollWidth,document.body.scrollWidth))
  expect(viewport,'Inicio REAL no debe desbordar la pantalla móvil')
    .toBeLessThanOrEqual(391)
  await page.reload()
  await expect(page.getByRole('heading',{name:'Log in real'})).toBeVisible()
  expect(writes).toBe(0)
})
