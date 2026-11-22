import { test, expect, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

// Exclusivamente datos y base QA descartables.
const api='http://127.0.0.1:18001/api/v1'
test.beforeAll(()=>{
  if(process.env.PYME_DISPOSABLE_QA!=='1')throw Error('E3-1D requiere PYME_DISPOSABLE_QA=1 y PostgreSQL efímero')
})

async function loginUI(page:Page,email:string,password:string){
  await page.getByLabel('Email',{exact:true}).fill(email)
  await page.getByLabel('Password',{exact:true}).fill(password)
  await page.getByRole('button',{name:'Ingresar',exact:true}).click()
}

test('E3-1D catálogo/proveedores: fichas, alta aislada, cancelación y móvil',async({page,request})=>{
  const email='e3-1d-'+randomUUID()+'@example.com',password='Orbit-1-' + globalThis.crypto.randomUUID()
  const register=await request.post(api+'/auth/register',{data:{email,password,display_name:'QA E3-D'}})
  expect(register.status(),await register.text()).toBe(201)
  const login=await request.post(api+'/auth/login',{data:{email,password}})
  expect(login.status(),await login.text()).toBe(200)
  const headers={Authorization:'Bearer '+(await login.json()).access_token}
  const company=await request.post(api+'/businesses',{headers:{...headers,'Idempotency-Key':randomUUID()},
    data:{name:'Empresa QA E3-D',category:'QA',activity_kind:'MIXTO'}})
  expect(company.status(),await company.text()).toBe(201)
  const businessId=(await company.json()).id
  const path='/businesses/'+businessId
  const product=await request.post(api+path+'/catalog',{headers:{...headers,'Idempotency-Key':randomUUID()},
    data:{name:'Artículo QA-D',kind:'REVENTA',category:'Test',unit:'UNIDAD',sku:'SKU-QA-D',
      description:'Producto de prueba',observations:'Sin stock inicial',sellable:true,
      price_cents:215000,reference_cost_cents:180000}})
  expect(product.status(),await product.text()).toBe(201)

  await page.setViewportSize({width:390,height:844})
  await page.goto('/real/empresas/'+businessId+'/catalogo')
  await loginUI(page,email,password)
  await expect(page.getByRole('heading',{name:'Catalogue of articles'})).toBeVisible()
  const cards=page.locator('article.e3-catalog-tile')
  await expect(cards).toHaveCount(1)
  await page.getByLabel('Filter catalogue by type').selectOption('SERVICIO')
  await expect(cards).toHaveCount(0)
  await page.getByLabel('Filter catalogue by type').selectOption('TODOS')
  await cards.first().getByRole('button',{name:'Ver ficha'}).click()
  await expect(page.getByRole('heading',{name:'Article sheet'})).toBeVisible()
  await expect(cards).toHaveCount(0)
  await expect(page.getByLabel('Detail of the article')).toContainText('SKU-QA-D')
  await page.getByRole('button',{name:'Back to Catalogue'}).click()
  await expect(cards).toHaveCount(1)

  await cards.first().getByRole('button',{name:'Edit'}).click()
  await expect(page.getByRole('heading',{name:'Edit Article'})).toBeVisible()
  await expect(cards).toHaveCount(0)
  await page.getByLabel('Name',{exact:true}).fill('Cambio no guardado')
  await page.getByRole('button',{name:'Cancel'}).click()
  await expect(cards).toHaveCount(1)
  await cards.first().getByRole('button',{name:'Edit'}).click()
  await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Artículo QA-D')
  await page.getByRole('button',{name:'Back to Catalogue'}).click()

  await page.getByRole('button',{name:'Create REAL article'}).click()
  await expect(page.getByRole('heading',{name:'New article'})).toBeVisible()
  await expect(cards).toHaveCount(0)
  await page.getByRole('button',{name:'Cancel'}).click()
  await expect(cards).toHaveCount(1)
  const catalog=await request.get(api+path+'/catalog',{headers})
  expect(catalog.status(),await catalog.text()).toBe(200)
  expect(await catalog.json()).toHaveLength(1)

  await page.getByRole('navigation',{name:'Company navigation'}).getByRole('button',{name:'Company',exact:true}).click()
  await page.getByRole('button',{name:'Abrir Proveedores'}).click()
  await expect(page.getByRole('heading',{name:'Suppliers',exact:true})).toBeVisible()
  await expect(page.locator('article.e3-supplier-tile')).toHaveCount(0)
  await page.getByRole('button',{name:'Add REAL Provider'}).click()
  await expect(page.getByRole('heading',{name:'New supplier'})).toBeVisible()
  await page.getByLabel('Trade name').fill('Proveedor descartado')
  await page.getByRole('button',{name:'Cancel'}).click()
  const before=await request.get(api+path+'/suppliers',{headers})
  expect(before.status(),await before.text()).toBe(200)
  expect(await before.json()).toHaveLength(0)

  await page.getByRole('button',{name:'Add REAL Provider'}).click()
  await page.getByLabel('Trade name').fill('Proveedor QA-D')
  await page.getByLabel('Contact person (optional)').fill('Mariana QA')
  await page.getByLabel('Products or services offered (optional)').fill('Insumos de prueba')
  await page.getByLabel('Commercial telephone (optional)').fill('+5491112345678')
  await page.getByLabel('Use the commercial phone').check()
  await page.getByLabel('E-mail (optional)').fill('ventas@example.com')
  await page.getByLabel('Address or reference (optional)').fill('Calle QA 123')
  await page.getByLabel('Google Maps (Including HTTPS, optional)').fill('https://www.google.com/maps/place/Calle+QA')
  await page.getByLabel('Website / digital catalog (HTTPS, optional)').fill('https://example.com/catalogo')
  await page.getByLabel('Instagram (user, optional)').fill('@proveedor_qad')
  await page.getByLabel('Notes (optional)').fill('Entrega lunes y miércoles')
  await page.getByRole('checkbox',{name:'Cash'}).check()
  await page.getByRole('checkbox',{name:'Mercado Pago'}).check()
  await page.getByRole('button',{name:'Add Promotion'}).click()
  await page.getByRole('checkbox',{name:'Lunes en promoción 1'}).check()
  await page.getByRole('checkbox',{name:'Miércoles en promoción 1'}).check()
  await page.getByRole('checkbox',{name:'Viernes en promoción 1'}).check()
  await page.getByRole('combobox',{name:'Medio requerido de promoción 1 (opcional)'})
    .selectOption('MERCADO_PAGO')
  await page.getByRole('textbox',{name:'Beneficio informado de promoción 1 *'})
    .fill('20% de reintegro tope $15.000')
  await page.getByRole('button',{name:'Create Provider'}).click()
  const suppliers=page.locator('article.e3-supplier-tile')
  await expect(suppliers).toHaveCount(1)
  await suppliers.first().getByRole('button',{name:'Ver ficha'}).click()
  await expect(page.getByRole('heading',{name:'Supplier data'})).toBeVisible()
  await expect(page.getByLabel('Supplier details')).toContainText('Proveedor QA-D')
  await expect(page.getByLabel('Supplier details')).toContainText('Mariana QA')
  await expect(page.getByLabel('Supplier details')).toContainText('+5491112345678')
  await expect(page.getByLabel('Supplier details')).toContainText('20% de reintegro')
  await expect(page.getByLabel('Supplier details')).toContainText('Lunes · Miércoles · Viernes')
  await expect(page.getByLabel('Supplier details')).toContainText('Mercado Pago')
  await page.getByRole('button',{name:'Edit Provider'}).click()
  await expect(page.getByRole('heading',{name:'Edit Provider'})).toBeVisible()
  await expect(suppliers).toHaveCount(0)
  await expect(page.getByLabel('Contact person (optional)')).toHaveValue('Mariana QA')
  await expect(page.getByRole('checkbox',{name:'Lunes en promoción 1'})).toBeChecked()
  await expect(page.getByRole('checkbox',{name:'Miércoles en promoción 1'})).toBeChecked()
  await expect(page.getByRole('checkbox',{name:'Viernes en promoción 1'})).toBeChecked()
  await page.getByLabel('Contact person (optional)').fill('No guardar')
  await page.getByRole('checkbox',{name:'Domingo en promoción 1'}).check()
  await page.getByRole('button',{name:'Add Promotion'}).click()
  await expect(page.getByRole('button',{name:'Quitar promoción 2'})).toBeVisible()
  await page.getByRole('button',{name:'Cancel'}).click()
  await suppliers.first().getByRole('button',{name:'Ver ficha'}).click()
  await page.getByRole('button',{name:'Edit Provider'}).click()
  await expect(page.getByLabel('Contact person (optional)')).toHaveValue('Mariana QA')
  await expect(page.getByRole('button',{name:'Quitar promoción 2'})).toHaveCount(0)
  await expect(page.getByRole('checkbox',{name:'Domingo en promoción 1'})).not.toBeChecked()
  await page.getByRole('checkbox',{name:'Lunes en promoción 1'}).uncheck()
  await page.getByRole('checkbox',{name:'Jueves en promoción 1'}).check()
  await page.getByRole('textbox',{name:'Beneficio informado de promoción 1 *'})
    .fill('15% por Mercado Pago')
  await page.getByRole('button',{name:'Add Promotion'}).click()
  await page.getByRole('checkbox',{name:'Martes en promoción 2'}).check()
  await page.getByRole('combobox',{name:'Medio requerido de promoción 2 (opcional)'})
    .selectOption('TRANSFERENCIA')
  await page.getByRole('textbox',{name:'Beneficio informado de promoción 2 *'})
    .fill('Envío sin cargo por transferencia')
  await page.getByRole('checkbox',{name:'Transferencia'}).check()
  await page.getByLabel('Contact person (optional)').fill('Mariana Actualizada')
  await page.getByLabel('Notes (optional)').fill('Cambio persistente')
  await page.getByRole('button',{name:'Guardar cambios'}).click()
  await expect(suppliers).toHaveCount(1)
  await page.reload()
  await loginUI(page,email,password)
  await suppliers.first().getByRole('button',{name:'Ver ficha'}).click()
  await expect(page.getByLabel('Supplier details')).toContainText('Mariana Actualizada')
  await expect(page.getByLabel('Supplier details')).toContainText('Cambio persistente')
  await expect(page.getByLabel('Supplier details')).toContainText('15% por Mercado Pago')
  await expect(page.getByLabel('Supplier details')).toContainText('Miércoles · Jueves · Viernes')
  await expect(page.getByLabel('Supplier details')).toContainText('Envío sin cargo por transferencia')
  await expect(page.getByLabel('Supplier details')).toContainText('Martes')
  await page.getByRole('button',{name:'Return to suppliers'}).click()
  await expect(suppliers).toHaveCount(1)
  const width=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth))
  expect(width,'Sin desborde horizontal a 390px').toBeLessThanOrEqual(391)
  const supplierApi=await request.get(api+path+'/suppliers',{headers})
  expect(supplierApi.status(),await supplierApi.text()).toBe(200)
  const stored=await supplierApi.json()
  expect(stored).toHaveLength(1)
  expect(stored[0]).toMatchObject({
    name:'Proveedor QA-D',offerings:'Insumos de prueba',contact_person:'Mariana Actualizada',
    phone:'+5491112345678',whatsapp:'+5491112345678',email:'ventas@example.com',
    address:'Calle QA 123',maps_url:'https://www.google.com/maps/place/Calle+QA',
    website:'https://example.com/catalogo',instagram:'proveedor_qad',notes:'Cambio persistente',
    payment_methods:['EFECTIVO','MERCADO_PAGO','TRANSFERENCIA'],status:'ACTIVO',
  })
  expect(stored[0].promotions).toHaveLength(2)
  expect(stored[0].promotions[0]).toMatchObject({
    days:[2,3,4],payment_method:'MERCADO_PAGO',benefit:'15% por Mercado Pago',
  })
  expect(stored[0].promotions[1]).toMatchObject({
    days:[1],payment_method:'TRANSFERENCIA',benefit:'Envío sin cargo por transferencia',
  })
  expect(stored[0].promotions[0].id).toMatch(/^[0-9a-f-]{36}$/)
  // Ni el alta de proveedor ni la ficha de catálogo generan movimientos comerciales.
  for(const suffix of ['/sales','/inventory/movements']){
    const response=await request.get(api+path+suffix,{headers})
    expect(response.status(),await response.text()).toBe(200)
    expect(await response.json()).toEqual([])
  }
})
