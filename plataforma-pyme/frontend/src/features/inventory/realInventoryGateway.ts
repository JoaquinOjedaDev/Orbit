import { ApiHttpError, ApiTransportError, createApiClient } from '../../api/httpClient.ts'
import { UUID_PATTERN } from '../businesses/businessGateway.ts'

/** Matches backend receipt_schemas.StockBalanceView and InventoryMovementView. */
export type StockBalance = {
  business_id: string; location_id: string; catalog_item_id: string
  quantity_milli: number; version: number; updated_at: string
}
export type InventoryEvent =
  'COMPRA_RECEPCION' | 'TRASLADO_ENTRADA' | 'TRASLADO_SALIDA'
  | 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA' | 'STOCK_INICIAL' | 'VENTA_SALIDA'
export type InventoryMovement = {
  id: string; business_id: string; location_id: string; catalog_item_id: string
  actor_id: string; event_type: InventoryEvent; delta_milli: number; occurred_at: string
  receipt_id?: string | null; purchase_line_id?: string | null
  inventory_operation_id?: string | null; operation_kind?: string | null
  sale_id?: string | null; sale_line_id?: string | null
}
export type InventoryQuery = { locationId?: string; catalogItemId?: string }
export const INVENTORY_PAGE_SIZE = 100
export const INVENTORY_EVENTS: Record<InventoryEvent,string> = {
  COMPRA_RECEPCION: 'Purchase receipt',
  TRASLADO_ENTRADA: 'Traslado recibido',
  TRASLADO_SALIDA: 'Traslado enviado',
  AJUSTE_ENTRADA: 'Input adjustment',
  AJUSTE_SALIDA: 'Output setting',
  STOCK_INICIAL: 'Stock inicial',
  VENTA_SALIDA: 'Output per sale',
}
const events = new Set(Object.keys(INVENTORY_EVENTS))
const obj = (v: unknown): v is Record<string,unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const uuid = (v:unknown):v is string => typeof v === 'string' && UUID_PATTERN.test(v)
const safeInt = (v:unknown):v is number => typeof v === 'number' && Number.isSafeInteger(v)
const validDate = (v:unknown):v is string => typeof v === 'string' && Number.isFinite(Date.parse(v))
function invalid():never { throw new ApiTransportError('invalid-response',false) }

export function parseBalance(v:unknown,businessId:string):StockBalance {
  if (!obj(v)||v.business_id!==businessId||!uuid(v.location_id)||!uuid(v.catalog_item_id)
    ||!safeInt(v.quantity_milli)||v.quantity_milli<0
    ||!safeInt(v.version)||v.version<1||!validDate(v.updated_at)) return invalid()
  return v as StockBalance
}
export function parseMovement(v:unknown,businessId:string):InventoryMovement {
  if (!obj(v)||!uuid(v.id)||v.business_id!==businessId||!uuid(v.location_id)
    ||!uuid(v.catalog_item_id)||!uuid(v.actor_id)||!events.has(String(v.event_type))
    ||!safeInt(v.delta_milli)||v.delta_milli===0||!validDate(v.occurred_at)) return invalid()
  const positive = ['COMPRA_RECEPCION','TRASLADO_ENTRADA','AJUSTE_ENTRADA','STOCK_INICIAL'].includes(String(v.event_type))
  if ((v.delta_milli>0)!==positive) return invalid()
  for (const field of ['receipt_id','purchase_line_id','inventory_operation_id','sale_id','output_line_id']) {
    if (v[field]!==undefined && v[field]!==null && !uuid(v[field])) return invalid()
  }
  if (v.operation_kind!==undefined&&v.operation_kind!==null&&typeof v.operation_kind!=='string')return invalid()
  return v as InventoryMovement
}
function parsePage<T>(raw:unknown,limit:number,parse:(v:unknown)=>T,key:(v:T)=>string):T[] {
  if(!Array.isArray(raw)||raw.length>limit)return invalid()
  const records=raw.map(parse)
  if(new Set(records.map(key)).size!==records.length)return invalid()
  return records
}
export function formatMilli(value:number):string {
  if(!safeInt(value))throw new RangeError('Safe out-of-precision quantity')
  const sign=value<0?'-':''
  const abs=Math.abs(value)
  return sign+Math.floor(abs/1000).toLocaleString('es-AR')
    +(abs%1000===0?'':','+String(abs%1000).padStart(3,'0').replace(/0+$/,''))
}
export function formatDelta(value:number):string {
  if(!safeInt(value)||value===0)throw new RangeError('Invalid movement')
  return (value>0?'+':'')+formatMilli(value)
}
export function createInventoryGateway(token:string,businessId:string,fetchImpl?:typeof fetch) {
  if(!token||!UUID_PATTERN.test(businessId))throw new TypeError('Invalid session or company')
  const api=createApiClient({getAccessToken:()=>token,fetchImpl})
  function url(kind:'balances'|'movements',offset:number,limit:number,query:InventoryQuery) {
    if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>500)
      throw new RangeError('Invalid inventory page')
    if(query.locationId!==undefined&&!UUID_PATTERN.test(query.locationId))
      throw new TypeError('Invalid Headquarters')
    if(query.catalogItemId!==undefined&&!UUID_PATTERN.test(query.catalogItemId))
      throw new TypeError('Invalid Article')
    const params=new URLSearchParams({offset:String(offset),limit:String(limit)})
    if(query.locationId)params.set('location_id',query.locationId)
    if(query.catalogItemId)params.set('catalog_item_id',query.catalogItemId)
    return '/businesses/'+businessId+'/inventory/'+kind+'?'+params.toString()
  }
  return {
    async balances(offset=0,limit=INVENTORY_PAGE_SIZE,query:InventoryQuery={},signal?:AbortSignal):Promise<StockBalance[]> {
      const raw=await api.request<unknown>(url('balances',offset,limit,query),{signal})
      const rows=parsePage(raw,limit,x=>parseBalance(x,businessId),x=>x.location_id+':'+x.catalog_item_id)
      if(query.locationId&&rows.some(x=>x.location_id!==query.locationId))return invalid()
      if(query.catalogItemId&&rows.some(x=>x.catalog_item_id!==query.catalogItemId))return invalid()
      return rows
    },
    async movements(offset=0,limit=INVENTORY_PAGE_SIZE,query:InventoryQuery={},signal?:AbortSignal):Promise<InventoryMovement[]> {
      const raw=await api.request<unknown>(url('movements',offset,limit,query),{signal})
      const rows=parsePage(raw,limit,x=>parseMovement(x,businessId),x=>x.id)
      if(query.locationId&&rows.some(x=>x.location_id!==query.locationId))return invalid()
      if(query.catalogItemId&&rows.some(x=>x.catalog_item_id!==query.catalogItemId))return invalid()
      return rows
    },
  }
}
export function inventoryErrorMessage(err:unknown):string {
  if(err instanceof ApiHttpError){
    if(err.status===401)return 'The session expired or was revoked. I re-entered.'
    if(err.status===403)return 'You don\'t have permission to check the inventory of this company.'
    if(err.status===404)return 'Company or inventory not available for this account.'
    if(err.status===422)return 'The API rejected the inventory filters.'
    return 'FastAPI was unable to consult the inventory.'
  }
  if(err instanceof ApiTransportError){
    if(err.reason==='invalid-response')return 'FastAPI returned inventory data incompatible with the contract.'
    if(err.reason==='timeout')return 'The inventory consultation exceeded the waiting time.'
    return 'We couldn\'t consult FastAPI. Check the connection and try again.'
  }
  return err instanceof Error?err.message:'Could not close temporary folder: %s'
}
