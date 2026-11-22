import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api='http://127.0.0.1:18001/api/v1'
test.beforeAll(()=>{
  if(process.env.PYME_DISPOSABLE_QA!=='1')
    throw new Error('E3-2A requiere PostgreSQL exclusivamente descartable')
})

test('E3-2A: foto perfil, empresa, galería servicios y proveedor con POS, sin cruzar tenants',async({page,request})=>{
  const email='e32a-'+randomUUID()+'@example.com'
  const password='Orbit-1-' + globalThis.crypto.randomUUID()
  const reg=await request.post(api+'/auth/register',{data:{email,password,display_name:'Actor Fotos E3'}})
  expect(reg.status(),await reg.text()).toBe(201)
  const login=await request.post(api+'/auth/login',{data:{email,password}})
  expect(login.status(),await login.text()).toBe(200)
  const headers={Authorization:'Bearer '+(await login.json()).access_token}
  const create=await request.post(api+'/businesses',{headers:{...headers,'Idempotency-Key':randomUUID()},
    data:{name:'Empresa imágenes E3',category:'Servicios',activity_kind:'MIXTO'}})
  expect(create.status(),await create.text()).toBe(201)
  const bid=(await create.json()).id as string
  const catalog=await request.post(api+'/businesses/'+bid+'/catalog',{headers,
    data:{name:'Servicio fotos E3',kind:'SERVICIO',unit:'SERVICIO',sellable:true,price_cents:4000}})
  expect(catalog.status(),await catalog.text()).toBe(201)
  const item=(await catalog.json()).id as string
  const supplier=await request.post(api+'/businesses/'+bid+'/suppliers',{headers,
    data:{name:'Proveedor visual E3'}})
  expect(supplier.status(),await supplier.text()).toBe(201)
  const sid=(await supplier.json()).id as string

  await page.goto('/real/perfil')
  await page.getByLabel('Email',{exact:true}).fill(email)
  await page.getByLabel('Password',{exact:true}).fill(password)
  await page.getByRole('button',{name:'Ingresar',exact:true}).click()
  await expect(page.getByRole('heading',{name:'My profile',exact:true})).toBeVisible()

  const png64=await page.evaluate(()=>{
    const canvas=document.createElement('canvas')
    canvas.width=36;canvas.height=28
    const context=canvas.getContext('2d')
    if(!context)throw new Error('Canvas no disponible')
    context.fillStyle='#2463ad';context.fillRect(0,0,36,28)
    return canvas.toDataURL('image/png').split(',')[1]
  })
  const image={name:'foto-qa.png',mimeType:'image/png',buffer:Buffer.from(png64,'base64')}
  const profile=page.getByRole('region',{name:'Imágenes de Foto de perfil'})
  await profile.locator('input[type=file]').setInputFiles(image)
  await expect(profile.getByText('Photo saved in PostgreSQL.')).toBeVisible()
  await expect(profile.locator('img')).toHaveCount(1)
  const publicPhoto=(await (await request.get(api+'/photos/me',{headers})).json())[0]
  expect(publicPhoto.byte_size).toBeGreaterThan(0)
  const content=await request.get(api+'/photos/'+publicPhoto.id+'/content',{headers})
  expect(content.status()).toBe(200)
  expect(content.headers()['content-type']).toContain('image/webp')
  // Reemplazo personal real: no mantiene fotos anteriores ni URLs activas.
  await profile.locator('input[type=file]').setInputFiles(image)
  await expect.poll(async()=>{
    const result=await request.get(api+'/photos/me',{headers})
    return (await result.json())[0]?.id
  }).not.toBe(publicPhoto.id)
  const replaced=await request.get(api+'/photos/'+publicPhoto.id+'/content',{headers})
  expect(replaced.status()).toBe(404)

  await page.getByRole('button',{name:'My companies',exact:true}).first().click()
  const companyCard=page.getByRole('button',{name:/Empresa imágenes E3/})
  await expect(companyCard).toBeVisible()
  await companyCard.click()
  // La modificación del logo sólo se habilita dentro de Editar datos.
  await page.getByRole('button',{name:'Edit Data'}).click()
  const company=page.getByRole('region',{name:'Imágenes de Foto o logo de la empresa'})
  await company.locator('input[type=file]').setInputFiles(image)
  await expect(company.getByText('Photo saved in PostgreSQL.')).toBeVisible()

  // Navegación dentro de la SPA: no usar page.goto(), que borra la sesión en memoria.
  await page.getByRole('navigation',{name:'Sections available in REAL'})
    .getByRole('button',{name:'Catalog',exact:true}).click()
  const card=page.locator('.e3-catalog-tile').filter({hasText:'Servicio fotos E3'})
  await card.getByRole('button',{name:'Ver ficha'}).click()
  const gallery=page.getByRole('region',{name:'Imágenes de Fotografías de Servicio fotos E3'})
  await gallery.locator('input[type=file]').setInputFiles([image,image])
  await expect(gallery.getByText('Photographs saved in PostgreSQL.')).toBeVisible()
  await expect(gallery.locator('img')).toHaveCount(2)
  const photos=await request.get(api+'/photos/businesses/'+bid+'/catalog/'+item,{headers})
  expect(photos.status()).toBe(200)
  expect(await photos.json()).toHaveLength(2)

  // Alta con imagen OPCIONAL en el mismo flujo; el producto existe antes del upload.
  await page.getByRole('button',{name:'Back to Catalogue'}).click()
  await page.getByRole('button',{name:'Create REAL article'}).click()
  const createCatalog=page.getByRole('region',{name:'Article form'})
  await createCatalog.getByLabel('Name',{exact:true}).fill('Artículo con foto al crear E3')
  await createCatalog.getByLabel('Price (weights, optional)').fill('2800')
  await createCatalog.locator('.e3-photo-draft input[type=file]').setInputFiles(image)
  await createCatalog.locator('.e3-photo-draft input[type=file]').setInputFiles(image)
  await expect(createCatalog.getByText('2/8 fotos preparadas')).toBeVisible()
  await createCatalog.getByRole('button',{name:'Save Item'}).click()
  const catalogCreatedCard=page.locator('.e3-catalog-tile').filter({hasText:'Artículo con foto al crear E3'})
  await expect(catalogCreatedCard).toBeVisible()
  await catalogCreatedCard.getByRole('button',{name:'Ver ficha'}).click()
  const createdGallery=page.getByRole('region',{name:'Imágenes de Fotografías de Artículo con foto al crear E3'})
  await expect(createdGallery.getByText('2/8')).toBeVisible()
  await expect(createdGallery.locator('img')).toHaveCount(2)
  await page.getByRole('button',{name:'Edit Article'}).click()
  await expect(page.getByRole('region',{name:'Imágenes de Fotografías del artículo (edición)'})
    .locator('input[type=file]')).toBeVisible()

  await page.getByRole('navigation',{name:'Sections available in REAL'})
    .getByRole('button',{name:'Suppliers',exact:true}).click()
  const supplierCard=page.locator('.e3-supplier-tile').filter({hasText:'Proveedor visual E3'})
  await supplierCard.getByRole('button',{name:'Ver ficha'}).click()
  const provider=page.getByRole('region',{name:'Imágenes de Foto de Proveedor visual E3'})
  await provider.locator('input[type=file]').setInputFiles(image)
  await expect(provider.getByText('Photo saved in PostgreSQL.')).toBeVisible()
  const providerPhotos=await request.get(api+'/photos/businesses/'+bid+'/suppliers/'+sid,{headers})
  expect((await providerPhotos.json())).toHaveLength(1)
  page.once('dialog',dialog=>{ void dialog.accept() })
  await provider.getByRole('button',{name:'Remove Photo'}).click()
  await expect(provider.getByText('Photo removed correctly.')).toBeVisible()
  const afterDelete=await request.get(api+'/photos/businesses/'+bid+'/suppliers/'+sid,{headers})
  expect(await afterDelete.json()).toHaveLength(0)

  // Alta opcional de proveedor con foto y acceso posterior desde Editar.
  await page.getByRole('button',{name:'Return to suppliers'}).click()
  await page.getByRole('button',{name:'Add REAL Provider'}).click()
  const createSupplier=page.getByRole('region',{name:'Provider Form'})
  await createSupplier.getByLabel('Trade name *').fill('Proveedor con foto al crear E3')
  await createSupplier.locator('.e3-photo-draft input[type=file]').setInputFiles(image)
  await createSupplier.getByRole('button',{name:'Create Provider'}).click()
  const supplierCreatedCard=page.locator('.e3-supplier-tile').filter({hasText:'Proveedor con foto al crear E3'})
  await expect(supplierCreatedCard).toBeVisible()
  await supplierCreatedCard.getByRole('button',{name:'Ver ficha'}).click()
  const createdSupplier=page.getByRole('region',{name:'Imágenes de Foto de Proveedor con foto al crear E3'})
  await expect(createdSupplier.getByText('1/1')).toBeVisible()
  await expect(createdSupplier.locator('img')).toHaveCount(1)
  await page.getByRole('button',{name:'Edit Provider'}).click()
  await expect(page.getByRole('region',{name:'Imágenes de Foto del proveedor (edición)'})
    .locator('input[type=file]')).toBeVisible()

  await page.getByRole('navigation',{name:'Sections available in REAL'})
    .getByRole('button',{name:'Point of sale',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Point of sale'})).toBeVisible()
  const posCard=page.locator('.e3-pos-product-card').filter({hasText:'Servicio fotos E3'})
  // La portada se solicita de forma perezosa cuando la tarjeta entra al viewport.
  await posCard.scrollIntoViewIfNeeded()
  await expect(posCard.locator('img')).toHaveCount(1)
  const width=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth))
  expect(width).toBeLessThanOrEqual(1366)
  // La portada también debe adaptarse a una pantalla móvil sin overflow horizontal.
  await page.setViewportSize({width:390,height:844})
  await posCard.scrollIntoViewIfNeeded()
  await expect(posCard.locator('img')).toHaveCount(1)
  const mobileWidth=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth))
  expect(mobileWidth).toBeLessThanOrEqual(390)
})
