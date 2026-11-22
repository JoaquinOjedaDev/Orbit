import { ApiHttpError, ApiTransportError, createApiClient } from '../../api/httpClient.ts'
import { UUID_PATTERN, UUID_V4_PATTERN } from '../businesses/businessGateway.ts'
import type { InventoryMovement } from './realInventoryGateway.ts'
import { parseMovement } from './realInventoryGateway.ts'
import { transferMilli, transferReason } from './realTransferGateway.ts'

export type AdjustmentKind = 'STOCK_INICIAL' | 'AJUSTE_ENTRADA' | 'AJUSTE_SALIDA'
export type AdjustmentCommand = {
  kind:AdjustmentKind
  catalog_item_id:string
  location_id:string
  quantity_milli:number
  expected_version:number
  reason:string
}
export type AdjustmentReceipt = Omit<AdjustmentCommand,'expected_version'> & {
  id:string;business_id:string;actor_id:string;unit_snapshot:string;created_at:string
  movements:[InventoryMovement]
}
const uuid=(v:unknown):v is string=>typeof v==='string'&&UUID_PATTERN.test(v)
const obj=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v)
const fail=():never=>{throw new ApiTransportError('invalid-response',false)}
const knownKinds=new Set<AdjustmentKind>(['STOCK_INICIAL','AJUSTE_ENTRADA','AJUSTE_SALIDA'])
const validUnit=(unit:string)=>['UNIDAD','GRAMO','KILOGRAMO','MILILITRO','LITRO','PAQUETE','CAJA'].includes(unit)
export function mayAdjustInventory(role:string,membership:string,business:string):boolean{
  return membership==='ACTIVA'&&business==='ACTIVA'&&['TITULAR_ADMINISTRATIVO','ADMINISTRADOR','ENCARGADO'].includes(role)
}
export function mayInitializeInventory(role:string,membership:string,business:string):boolean{
  return membership==='ACTIVA'&&business==='ACTIVA'&&['TITULAR_ADMINISTRATIVO','ADMINISTRADOR'].includes(role)
}
export function validateAdjustment(value:AdjustmentCommand):AdjustmentCommand{
  if(!obj(value)||Object.keys(value).sort().join('|')!==
    ['kind','catalog_item_id','location_id','quantity_milli','expected_version','reason'].sort().join('|'))
    throw new TypeError('Invalid adjustment fields.')
  if(!knownKinds.has(value.kind)||!uuid(value.catalog_item_id)||!uuid(value.location_id))
    throw new TypeError('Type of adjustment, invalid article or venue.')
  if(!Number.isSafeInteger(value.quantity_milli)||value.quantity_milli<1||value.quantity_milli>999999999)
    throw new RangeError('Out of range.')
  if(!Number.isSafeInteger(value.expected_version)||value.expected_version<0
    ||value.expected_version>Number.MAX_SAFE_INTEGER)
    throw new RangeError('Invalid balance version.')
  if(value.kind==='STOCK_INICIAL'&&value.expected_version!==0)
    throw new RangeError('Starting stock requires version 0 and no prior balance.')
  if(value.kind!=='STOCK_INICIAL'&&value.expected_version===0)
    throw new RangeError('To adjust there must be a balance with version 1 or later.')
  if(typeof value.reason!=='string'||transferReason(value.reason)!==value.reason)
    throw new RangeError('Invalid adjustment reason.')
  return value
}
/** Backend StockBalance.MAX_BALANCE_MILLI is larger than the per-command quantity limit. */
export const MAX_STOCK_BALANCE_MILLI=999_999_999_999_999
export const MAX_ADJUSTMENT_DELTA_MILLI=999_999_999
export function adjustmentMilli(input:string,unit:string):number{
  if(!validUnit(unit))throw new TypeError('A physical article is required.')
  return transferMilli(input,unit)
}
/** A counted *final stock* can be zero or greater than the per-command delta cap. */
export function countedMilli(input:string,unit:string):number{
  if(!validUnit(unit))throw new TypeError('A physical article is required.')
  const text=input.trim()
  if(!/^(?:0|[1-9]\d*)(?:[.,]\d{1,3})?$/.test(text))
    throw new RangeError('Count: non-negative amount, up to three decimals and without thousands.')
  const [whole,frac='']=text.replace(',','.').split('.')
  const amount=BigInt(whole)*1000n+BigInt(frac.padEnd(3,'0'))
  if(amount>BigInt(MAX_STOCK_BALANCE_MILLI))
    throw new RangeError('Counting exceeds the maximum allowed balance.')
  if(['UNIDAD','PAQUETE','CAJA'].includes(unit)&&amount%1000n!==0n)
    throw new RangeError('The discrete article requires whole quantities.')
  return Number(amount)
}
/** A count is converted to a delta. Never replaces the historical ledger. */
export function adjustmentFromCount(targetMilli:number,currentMilli:number,version:number):{
  kind:'AJUSTE_ENTRADA'|'AJUSTE_SALIDA';quantity_milli:number
}|null{
  if(![targetMilli,currentMilli,version].every(Number.isSafeInteger)
    ||targetMilli<0||targetMilli>MAX_STOCK_BALANCE_MILLI
    ||currentMilli<0||currentMilli>MAX_STOCK_BALANCE_MILLI||version<1)
    throw new RangeError('Invalid count, balance or version.')
  const delta=targetMilli-currentMilli
  if(delta===0)return null
  if(Math.abs(delta)>MAX_ADJUSTMENT_DELTA_MILLI)
    throw new RangeError('Difference too big for a single setting; check the count.')
  return {kind:delta>0?'AJUSTE_ENTRADA':'AJUSTE_SALIDA',quantity_milli:Math.abs(delta)}
}
export function parseAdjustment(value:unknown,businessId:string):AdjustmentReceipt{
  if(!obj(value)||!uuid(value.id)||value.business_id!==businessId||!uuid(value.actor_id)
    ||typeof value.created_at!=='string'||!Number.isFinite(Date.parse(value.created_at))
    ||typeof value.unit_snapshot!=='string'||!validUnit(value.unit_snapshot)
    ||!Array.isArray(value.movements)||value.movements.length!==1)return fail()
  const core={
    kind:value.kind,catalog_item_id:value.catalog_item_id,location_id:value.location_id,
    quantity_milli:value.quantity_milli,reason:value.reason,
  }
  const kind=core.kind
  if(!knownKinds.has(kind as AdjustmentKind)||!uuid(core.catalog_item_id)||!uuid(core.location_id)
    ||typeof core.reason!=='string'||transferReason(core.reason)!==core.reason
    ||!Number.isSafeInteger(core.quantity_milli)||(core.quantity_milli as number)<1
    ||(core.quantity_milli as number)>999999999)return fail()
  if(['UNIDAD','PAQUETE','CAJA'].includes(value.unit_snapshot)
    &&(core.quantity_milli as number)%1000!==0)return fail()
  const movement=parseMovement(value.movements[0],businessId)
  const signed=kind==='AJUSTE_SALIDA'?-(core.quantity_milli as number):core.quantity_milli as number
  if(movement.inventory_operation_id!==value.id||movement.operation_kind!==kind
    ||movement.event_type!==kind||movement.delta_milli!==signed
    ||movement.actor_id!==value.actor_id||movement.location_id!==core.location_id
    ||movement.catalog_item_id!==core.catalog_item_id)return fail()
  return {...value,...core,movements:[movement]} as AdjustmentReceipt
}
export function createAdjustmentGateway(token:string,businessId:string,fetchImpl?:typeof fetch){
  if(!token||!uuid(businessId))throw new TypeError('Invalid session or company.')
  const api=createApiClient({getAccessToken:()=>token,fetchImpl})
  const root='/businesses/'+businessId+'/inventory/adjustments'
  return {
    async create(body:AdjustmentCommand,key:string):Promise<AdjustmentReceipt>{
      validateAdjustment(body)
      if(!UUID_V4_PATTERN.test(key))throw new TypeError('Idempotency-Key debe ser UUID4.')
      try {
        return parseAdjustment(await api.request<unknown>(root,{
          method:'POST',body,idempotencyKey:key,
        }),businessId)
      }catch(err){
        if(err instanceof ApiTransportError&&err.reason==='invalid-response')
          throw new ApiTransportError('invalid-response',true)
        throw err
      }
    },
    async get(id:string,signal?:AbortSignal):Promise<AdjustmentReceipt>{
      if(!uuid(id))throw new TypeError('Invalid operation ID.')
      return parseAdjustment(await api.request<unknown>(root+'/'+id,{signal}),businessId)
    },
  }
}
export function adjustmentErrorMessage(error:unknown):string{
  if(error instanceof ApiHttpError){
    if(error.status===401)return 'Invalid session.'
    if(error.status===403)return 'You don\'t have permission to adjust or initialize stock at this headquarters.'
    if(error.status===404)return 'Article, location or operation not available in this company.'
    if(error.status===409)return 'Conflict: changed balance or version, previous stock, insufficient stock or incompatible location. No new adjustment applied. Check the version and history before deciding how to continue.'
    if(error.status===422)return 'The API rejected the amount, motive, drive, key or version.'
    return 'FastAPI could not confirm the adjustment.'
  }
  if(error instanceof ApiTransportError){
    if(error.outcomeUnknown)return 'Uncertain result: the operation could have been confirmed. We keep the same key and data; don\'t generate another adjustment without checking the history.'
    return 'FastAPI query or response error. Check the connection.'
  }
  return error instanceof Error?error.message:'Could not close temporary folder: %s'
}
