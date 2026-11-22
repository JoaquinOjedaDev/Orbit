import { ApiHttpError, ApiTransportError, createApiClient } from '../../api/httpClient.ts'
import { UUID_PATTERN } from '../businesses/businessGateway.ts'

export type CatalogKind = 'ELABORADO'|'REVENTA'|'INSUMO'|'SERVICIO'
export type CatalogUnit = 'UNIDAD'|'GRAMO'|'KILOGRAMO'|'MILILITRO'|'LITRO'|'PAQUETE'|'CAJA'|'SERVICIO'
export type CatalogStatus = 'ACTIVO'|'INACTIVO'
export type CatalogItem = {
  id:string; business_id:string; name:string; kind:CatalogKind; item_type:'BIEN'|'SERVICIO'
  category:string; sku:string|null; unit:CatalogUnit; description:string; observations:string
  sellable:boolean; price_cents:number|null; reference_cost_cents:number|null
  status:CatalogStatus; created_at:string; updated_at:string
}
export type CatalogCreate = {
  name:string; kind:CatalogKind; category:string; sku:string|null; unit:CatalogUnit
  description:string; observations:string; sellable:boolean
  price_cents:number|null; reference_cost_cents:number|null
}
export type CatalogPatch = Partial<CatalogCreate>
export const CATALOG_PAGE_SIZE = 100
export const CATALOG_KINDS:CatalogKind[] = ['ELABORADO','REVENTA','INSUMO','SERVICIO']
export const CATALOG_UNITS:CatalogUnit[] = ['UNIDAD','GRAMO','KILOGRAMO','MILILITRO','LITRO','PAQUETE','CAJA','SERVICIO']
export const MAX_CENTS = 99_999_999_999
const kinds = new Set<string>(CATALOG_KINDS)
const units = new Set<string>(CATALOG_UNITS)
const integerCents = (v:unknown) => v === null || (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= MAX_CENTS)
const obj = (v:unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)
function invalid():never { throw new ApiTransportError('invalid-response', false) }

export function parseCatalogItem(v:unknown, businessId:string):CatalogItem {
  if (!obj(v) || !UUID_PATTERN.test(String(v.id)) || v.business_id !== businessId
    || typeof v.name !== 'string' || v.name.trim().length < 2 || !kinds.has(String(v.kind))
    || !units.has(String(v.unit))
    || (v.item_type !== 'BIEN' && v.item_type !== 'SERVICIO')
    || (v.kind === 'SERVICIO') !== (v.unit === 'SERVICIO')
    || (v.item_type === 'SERVICIO') !== (v.kind === 'SERVICIO')
    || typeof v.category !== 'string' || typeof v.description !== 'string'
    || typeof v.observations !== 'string'
    || !(v.sku === null || typeof v.sku === 'string')
    || typeof v.sellable !== 'boolean'
    || !integerCents(v.price_cents) || !integerCents(v.reference_cost_cents)
    || (v.status !== 'ACTIVO' && v.status !== 'INACTIVO')
    || typeof v.created_at !== 'string' || !Number.isFinite(Date.parse(v.created_at))
    || typeof v.updated_at !== 'string' || !Number.isFinite(Date.parse(v.updated_at))) return invalid()
  return v as CatalogItem
}
export function parseCatalogPage(v:unknown, businessId:string):CatalogItem[] {
  if (!Array.isArray(v)) return invalid()
  const page = v.map((item) => parseCatalogItem(item, businessId))
  if (new Set(page.map((x)=>x.id)).size !== page.length) return invalid()
  return page
}

/** ARS decimal text -> integer cents, without floating-point multiplication. */
export function pesosToCents(input:string):number|null {
  const raw=input.trim()
  if (!raw) return null
  if (!/^(?:0|[1-9]\d*)(?:[.,]\d{1,2})?$/.test(raw)) throw new RangeError('Use unseparated weights of thousands and up to two decimal places.')
  const [whole,frac=''] = raw.replace(',','.').split('.')
  const result=Number(whole)*100+Number(frac.padEnd(2,'0'))
  if (!Number.isSafeInteger(result) || result>MAX_CENTS) throw new RangeError('The amount exceeds the maximum amount admitted.')
  return result
}
export function centsToPesos(cents:number|null):string {
  if (cents === null) return ''
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_CENTS) throw new RangeError('Invalid cents')
  return String(Math.floor(cents / 100)) + ',' + String(cents % 100).padStart(2,'0')
}
export function canManageCatalog(role:string,status:string,businessStatus:string):boolean {
  return status==='ACTIVA' && businessStatus==='ACTIVA' && (role==='TITULAR_ADMINISTRATIVO'||role==='ADMINISTRADOR')
}
export function validateCatalogDraft(v:CatalogCreate) {
  if (v.name.trim().length < 2 || v.name.trim().length>90) throw new RangeError('Name: 2 to 90 characters.')
  if (v.category.trim().length<2 || v.category.trim().length>60) throw new RangeError('Rubre: 2 to 60 characters.')
  if ((v.kind==='SERVICIO') !== (v.unit==='SERVICIO')) throw new RangeError('The SERVICE unit is exclusive for services.')
  if (v.sku && !/^[A-Za-z0-9._-]{1,32}$/.test(v.sku)) throw new RangeError('SKU: up to 32 characters, no spaces.')
  if (v.description.length>450 || v.observations.length>600) throw new RangeError('Description or observations exceed the maximum.')
  if (!integerCents(v.price_cents) || !integerCents(v.reference_cost_cents)) throw new RangeError('Invalid amounts.')
}
export function createCatalogGateway(token:string, businessId:string, fetchImpl?:typeof fetch) {
  if (!token || !UUID_PATTERN.test(businessId)) throw new TypeError('Invalid session or company')
  const api=createApiClient({ getAccessToken:()=>token, fetchImpl })
  const root='/businesses/'+businessId+'/catalog'
  const at=(id:string) => { if (!UUID_PATTERN.test(id)) throw new TypeError('Invalid article ID'); return root+'/'+id }
  return {
    async page(offset:number,limit:number=CATALOG_PAGE_SIZE,signal?:AbortSignal):Promise<CatalogItem[]> {
      if (!Number.isSafeInteger(offset)||offset<0 || !Number.isSafeInteger(limit)||limit<1||limit>500) throw new RangeError('Invalidity')
      const raw=await api.request<unknown>(root+'?offset='+offset+'&limit='+limit,{signal})
      const result=parseCatalogPage(raw,businessId)
      if (result.length>limit) return invalid()
      return result
    },
    async get(id:string,signal?:AbortSignal):Promise<CatalogItem> {
      return parseCatalogItem(await api.request<unknown>(at(id),{signal}),businessId)
    },
    async create(input:CatalogCreate):Promise<CatalogItem> {
      validateCatalogDraft(input)
      return parseCatalogItem(await api.request<unknown>(root,{method:'POST',body:input}),businessId)
    },
    async update(id:string,changes:CatalogPatch):Promise<CatalogItem> {
      if (Object.keys(changes).length===0) throw new TypeError('Empty PATCH')
      return parseCatalogItem(await api.request<unknown>(at(id),{method:'PATCH',body:changes}),businessId)
    },
    async status(id:string,status:CatalogStatus):Promise<CatalogItem> {
      return parseCatalogItem(await api.request<unknown>(at(id)+'/status',{method:'PATCH',body:{status}}),businessId)
    },
  }
}
export function catalogErrorMessage(error:unknown):string {
  if (error instanceof ApiHttpError) {
    if (error.status===401) return 'The session expired or was revoked. It began again.'
    if (error.status===403) return 'You don\'t have permission to manage this catalog.'
    if (error.status===404) return 'Item or company not available for this account.'
    if (error.status===409) return 'Conflict: duplicate name/SKU, suspended company or protected historical changes.'
    if (error.status===422) return 'The API rejected the formatting or combination of type, drive and fields.'
    return 'FastAPI was unable to complete the operation.'
  }
  if (error instanceof ApiTransportError) {
    return error.outcomeUnknown ? 'Uncertain result: the change may have been confirmed. I consulted again before repeating.'
      : 'Could not see FastAPI. Check the connection.'
  }
  if (error instanceof Error) return error.message
  return 'Operation not completed.'
}
