import { ApiHttpError, ApiTransportError, createApiClient } from '../../api/httpClient.ts'
import { UUID_PATTERN, UUID_V4_PATTERN } from '../businesses/businessGateway.ts'
import { parseMovement } from './realInventoryGateway.ts'
import type { InventoryMovement } from './realInventoryGateway.ts'

export type TransferCommand = {
  catalog_item_id:string
  source_location_id:string
  destination_location_id:string
  quantity_milli:number
  reason:string
}
export type TransferRecord = TransferCommand & {
  id:string;business_id:string;actor_id:string;unit_snapshot:string;created_at:string
  movements:[InventoryMovement,InventoryMovement]
}
const validUuid=(id:unknown):id is string=>typeof id==='string'&&UUID_PATTERN.test(id)
const record=(x:unknown):x is Record<string,unknown>=>typeof x==='object'&&x!==null&&!Array.isArray(x)
const invalid=():never=>{throw new ApiTransportError('invalid-response',false)}
export function transferReason(value:string):string{
  const normalized=value.trim().replace(/\s+/g,' ')
  if(normalized.length<3||normalized.length>500||[...normalized].some(x=>x.charCodeAt(0)<32))
    throw new RangeError('The motif must be between 3 and 500 characters, without controls.')
  return normalized
}
export function transferMilli(input:string,unit:string):number {
  const text=input.trim()
  if(!/^(?:0|[1-9]\d*)(?:[.,]\d{1,3})?$/.test(text))
    throw new RangeError('Quantity: greater than zero and up to three decimal places, without thousands separators.')
  const [whole,fract='']=text.replace(',','.').split('.')
  const n=BigInt(whole)*1000n+BigInt(fract.padEnd(3,'0'))
  if(n<1n||n>999999999n)throw new RangeError('Out-of-range quantity (0.001 to 999999.999).')
  const result=Number(n)
  if(['UNIDAD','PAQUETE','CAJA'].includes(unit)&&result%1000!==0)
    throw new RangeError('This article only supports whole units.')
  return result
}
export function validateTransfer(cmd:TransferCommand):TransferCommand{
  if(!record(cmd)||Object.keys(cmd).sort().join('|')!==
    ['catalog_item_id','destination_location_id','quantity_milli','reason','source_location_id'].sort().join('|'))
    throw new TypeError('The transfer has no fields allowed.')
  if(!validUuid(cmd.catalog_item_id)||!validUuid(cmd.source_location_id)||!validUuid(cmd.destination_location_id))
    throw new TypeError('Invalid article or location.')
  if(cmd.source_location_id===cmd.destination_location_id)throw new RangeError('Origin and destination must be different.')
  if(!Number.isSafeInteger(cmd.quantity_milli)||cmd.quantity_milli<1||cmd.quantity_milli>999999999)
    throw new RangeError('Invalid transfer amount.')
  if(typeof cmd.reason!=='string'||transferReason(cmd.reason)!==cmd.reason)
    throw new RangeError('The motive is not standardized.')
  return cmd
}
export function parseTransfer(value:unknown,businessId:string):TransferRecord{
  if(!record(value)||!validUuid(value.id)||value.business_id!==businessId
    ||!validUuid(value.actor_id)||typeof value.unit_snapshot!=='string'
    ||!['UNIDAD','GRAMO','KILOGRAMO','MILILITRO','LITRO','PAQUETE','CAJA'].includes(value.unit_snapshot)
    ||typeof value.created_at!=='string'||!Number.isFinite(Date.parse(value.created_at))
    ||!Array.isArray(value.movements)||value.movements.length!==2)return invalid()
  const cmd={
    catalog_item_id:value.catalog_item_id,
    source_location_id:value.source_location_id,
    destination_location_id:value.destination_location_id,
    quantity_milli:value.quantity_milli,
    reason:value.reason,
  }
  try{validateTransfer(cmd as TransferCommand)}catch{return invalid()}
  if(['UNIDAD','PAQUETE','CAJA'].includes(value.unit_snapshot)&&(cmd.quantity_milli as number)%1000!==0)return invalid()
  const parsed=value.movements.map((x:unknown)=>parseMovement(x,businessId))
  const [out,inc]=parsed
  if(out.id===inc.id||out.event_type!=='TRASLADO_SALIDA'||inc.event_type!=='TRASLADO_ENTRADA'
    ||out.delta_milli!==-(cmd.quantity_milli as number)||inc.delta_milli!==cmd.quantity_milli
    ||out.location_id!==cmd.source_location_id||inc.location_id!==cmd.destination_location_id
    ||out.catalog_item_id!==cmd.catalog_item_id||inc.catalog_item_id!==cmd.catalog_item_id
    ||out.actor_id!==value.actor_id||inc.actor_id!==value.actor_id
    ||out.inventory_operation_id!==value.id||inc.inventory_operation_id!==value.id
    ||out.operation_kind!=='TRASLADO'||inc.operation_kind!=='TRASLADO')
    return invalid()
  return {...value, ...cmd,movements:[out,inc]} as TransferRecord
}
export function createTransferGateway(token:string,businessId:string,fetchImpl?:typeof fetch){
  if(!token||!validUuid(businessId))throw new TypeError('Invalid session or company.')
  const api=createApiClient({getAccessToken:()=>token,fetchImpl})
  const root='/businesses/'+businessId+'/inventory/transfers'
  return {
    async create(body:TransferCommand,key:string):Promise<TransferRecord>{
      validateTransfer(body)
      if(!UUID_V4_PATTERN.test(key))throw new TypeError('La Idempotency-Key debe ser UUID v4.')
      try{
        return parseTransfer(await api.request<unknown>(root,{method:'POST',body,idempotencyKey:key}),businessId)
      }catch(err){
        // A valid HTTP success with a malformed DTO may still have committed stock.
        // The exact same key/body must be preserved for an explicit replay.
        if(err instanceof ApiTransportError&&err.reason==='invalid-response')
          throw new ApiTransportError('invalid-response',true)
        throw err
      }
    },
    async get(transferId:string,signal?:AbortSignal):Promise<TransferRecord>{
      if(!validUuid(transferId))throw new TypeError('Invalid transfer ID.')
      return parseTransfer(await api.request<unknown>(root+'/'+transferId,{signal}),businessId)
    },
  }
}
export function transferErrorMessage(err:unknown):string {
  if(err instanceof ApiHttpError){
    if(err.status===401)return 'Session expired.'
    if(err.status===403)return 'Without permission STORE at one or both locations. Check the active assignment.'
    if(err.status===404)return 'Article, headquarters, transfer or company not available for this account.'
    if(err.status===409)return 'Transfer conflict: insufficient stock, unfit headquarters, suspended company or key already used with other data. Consult balances and history before attempting another operation.'
    if(err.status===422)return 'The API rejected the motive, quantity, UUIDs or unit type.'
    return 'FastAPI could not confirm the transfer. Please consult the history before repeating.'
  }
  if(err instanceof ApiTransportError){
    if(err.outcomeUnknown)return 'Uncertain result: the transfer could have been confirmed. Don’t generate another key. Consult balances and history and only retry the SAME request when applicable.'
    return 'Could not connect to FastAPI. No new operation was performed automatically.'
  }
  return err instanceof Error?err.message:'The transfer was not completed.'
}
