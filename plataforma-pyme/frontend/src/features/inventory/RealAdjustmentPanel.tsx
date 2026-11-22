import { useEffect, useMemo, useState } from 'react'
import { ApiHttpError } from '../../api/httpClient.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import type { LocationRecord } from '../businesses/realOperationsGateway.ts'
import type { CatalogItem } from '../catalog/realCatalogGateway.ts'
import { createInventoryGateway, formatDelta, formatMilli, inventoryErrorMessage } from './realInventoryGateway.ts'
import type { StockBalance } from './realInventoryGateway.ts'
import {
  adjustmentErrorMessage, adjustmentFromCount,
  adjustmentMilli, countedMilli, createAdjustmentGateway,
  mayAdjustInventory, mayInitializeInventory, MAX_STOCK_BALANCE_MILLI, validateAdjustment,
} from './realAdjustmentGateway.ts'
import type { AdjustmentCommand, AdjustmentKind, AdjustmentReceipt } from './realAdjustmentGateway.ts'
import { transferReason } from './realTransferGateway.ts'
import {
  adjustmentJournal, adjustmentScope, newAdjustmentIntent,
} from './adjustmentPendingJournal.ts'
import type { PendingAdjustment } from './adjustmentPendingJournal.ts'

type Mode=AdjustmentKind|'CONTEO'
type Props={
 token:string;actorId:string;business:RealBusiness
 locations:LocationRecord[];catalog:CatalogItem[]
 onUnauthorized:()=>void;onClose:()=>void;onConfirmed:()=>void;onReview:()=>void
}
function date(value:string):string {
 return new Intl.DateTimeFormat('es-AR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))
}
export function RealAdjustmentPanel({
 token,actorId,business,locations,catalog,onUnauthorized,onClose,onConfirmed,onReview,
}:Props){
 const api=useMemo(()=>createAdjustmentGateway(token,business.id),[token,business.id])
 const inventoryApi=useMemo(()=>createInventoryGateway(token,business.id),[token,business.id])
 const scope=useMemo(()=>adjustmentScope(actorId,business.id),[actorId,business.id])
 const canAdjust=mayAdjustInventory(business.membership.role,business.membership.status,business.status)
 const canInitial=mayInitializeInventory(business.membership.role,business.membership.status,business.status)
 const sites=locations.filter(x=>x.status==='ACTIVA'&&x.can_store)
 const items=catalog.filter(x=>x.item_type==='BIEN'&&x.status==='ACTIVO')
 const [itemId,setItemId]=useState('')
 const [locationId,setLocationId]=useState('')
 const [mode,setMode]=useState<Mode>('CONTEO')
 const [quantity,setQuantity]=useState('')
 const [reason,setReason]=useState('')
 const [consent,setConsent]=useState(false)
 const [balance,setBalance]=useState<StockBalance|null|undefined>(undefined)
 const [balanceLoading,setBalanceLoading]=useState(false)
 const [balanceError,setBalanceError]=useState('')
 const [balanceRefresh,setBalanceRefresh]=useState(0)
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [pending,setPending]=useState<PendingAdjustment|null>(null)
 const [confirmed,setConfirmed]=useState<AdjustmentReceipt|null>(null)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [checkedToDiscard,setCheckedToDiscard]=useState(false)
 const selectedItem=items.find(x=>x.id===itemId)
 const selectedLocation=sites.find(x=>x.id===locationId)
 const pendingItem=pending&&catalog.find(x=>x.id===pending.body.catalog_item_id)
 const pendingSite=pending&&locations.find(x=>x.id===pending.body.location_id)
 const currentMilli=balance?.quantity_milli??0
 const version=balance?.version??0
 const isInitial=mode==='STOCK_INICIAL'
 const isCount=mode==='CONTEO'
 const hasExisting=balance!==null&&balance!==undefined
 const roleAllowed=canAdjust&&(!isInitial||canInitial)
 let preview:{kind:AdjustmentKind;quantity_milli:number;next:number}|null=null
 let draftError=''
 if(quantity.trim()&&selectedItem&&balance!==undefined){
  try{
   const amount=isCount?countedMilli(quantity,selectedItem.unit):adjustmentMilli(quantity,selectedItem.unit)
   if(isCount){
    if(!balance)throw new RangeError('The correct counting requires an existing balance. For a location without history use initial Stock.')
    const delta=adjustmentFromCount(amount,currentMilli,version)
    if(delta)preview={...delta,next:amount}
   }else{
    const kind=mode
    if(isInitial&&hasExisting)throw new RangeError('This combination already has historical stock. It cannot be initialized again.')
    if(!isInitial&&!hasExisting)throw new RangeError('To adjust an existing balance and its version are required.')
    if(kind==='AJUSTE_SALIDA'&&amount>currentMilli)throw new RangeError('You can\'t discount more from the stocks consulted.')
    if(kind!=='AJUSTE_SALIDA'&&currentMilli+amount>MAX_STOCK_BALANCE_MILLI)
      throw new RangeError('The final amount exceeds the backend limit.')
    preview={kind,quantity_milli:amount,next:isInitial?amount:currentMilli+(kind==='AJUSTE_SALIDA'?-amount:amount)}
   }
  }catch(e){draftError=e instanceof Error?e.message:'Invalid amount'}
 }
 useEffect(()=>{
  let alive=true
  void adjustmentJournal.load(scope).then(found=>{
    if(!alive)return
    setPending(found)
    if(found)setNotice('We recover an outstanding browser setting. No operation was sent automatically.')
  }).catch((err:unknown)=>{if(alive)setError(adjustmentErrorMessage(err))})
    .finally(()=>{if(alive)setLoading(false)})
  return ()=>{alive=false}
 },[scope])
 useEffect(()=>{
  if(!itemId||!locationId||!selectedItem||!selectedLocation)return
  const abort=new AbortController()
  void inventoryApi.balances(0,2,{catalogItemId:itemId,locationId},abort.signal)
   .then(rows=>{
      if(abort.signal.aborted)return
      if(rows.length>1)throw new Error('The API returned more than one balance for the same item/headquarters.')
      setBalance(rows[0]??null);setBalanceError('')
   }).catch((err:unknown)=>{
      if(abort.signal.aborted)return
      if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
      setBalance(undefined);setBalanceError(inventoryErrorMessage(err))
   }).finally(()=>{if(!abort.signal.aborted)setBalanceLoading(false)})
  return ()=>{abort.abort()}
 },[inventoryApi,itemId,locationId,selectedItem,selectedLocation,balanceRefresh,onUnauthorized])
 function changeItem(value:string){setItemId(value);setBalance(undefined);setBalanceLoading(!!value&&!!locationId);setBalanceError('');setQuantity('');setError('')}
 function changeSite(value:string){setLocationId(value);setBalance(undefined);setBalanceLoading(!!value&&!!itemId);setBalanceError('');setQuantity('');setError('')}
 function refreshBalance(){
   if(!itemId||!locationId)return
   setBalance(undefined);setBalanceLoading(true);setBalanceError('')
   setBalanceRefresh(x=>x+1)
 }
 function command():AdjustmentCommand{
  if(!selectedItem||!selectedLocation||balance===undefined||!preview)
    throw new RangeError('Check article, seat, balance and quantity before confirming.')
  if(!roleAllowed)throw new RangeError('Your role does not allow this operation.')
  const cmd={
   ...preview, // Remove local projection below: backend accepts only the exact command contract.
   catalog_item_id:selectedItem.id,location_id:selectedLocation.id,
   expected_version:version,reason:transferReason(reason),
  }
  const {next: _next,...payload}=cmd
  void _next
  return validateAdjustment(payload)
 }
 async function send(row:PendingAdjustment){
  setBusy(true);setError('');setNotice('')
  try{
   const result=await api.create(row.body,row.key)
   setConfirmed(result)
   try {
    const got=await api.get(result.id)
    setConfirmed(got)
    setNotice('Operation confirmed and verified by GET by its identifier. Inventory updated from FastAPI.')
   }catch{
    setNotice('Operation confirmed by POST. Check query failed; DO NOT run it again.')
   }
   onConfirmed()
   try{
    await adjustmentJournal.discard(row.scope,row.key)
    setPending(null)
   }catch{
    setNotice('Operation confirmed, but the identity persisted could not be cleaned. Keep ID; do not repeat POST.')
   }
  }catch(err){
   setPending(row)
   if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
   setError(adjustmentErrorMessage(err))
  }finally{setBusy(false)}
 }
 async function submit(){
  if(busy||loading||pending||confirmed||balanceLoading||!consent||!roleAllowed)return
  try{
   const cmd=command()
   const action=cmd.kind==='STOCK_INICIAL'?'register INITIAL STOCK':
     cmd.kind==='AJUSTE_ENTRADA'?'AGREGAR':'QUITAR'
   const signed=cmd.kind==='AJUSTE_SALIDA'?'−':'+'
   const statement=[
    'Confirm REAL operation: '+action+' '+formatMilli(cmd.quantity_milli)+' '+(selectedItem?.unit??'')+' ('+signed+')',
    'Artículo: '+(selectedItem?.name??cmd.catalog_item_id),
    'Location: '+(selectedLocation?.name??cmd.location_id),
    'Balance read: '+(balance?formatMilli(balance.quantity_milli):'WITHOUT REGISTRATED BAIL')+' · expected_version='+cmd.expected_version,
    'Expected balance if no one operates before: '+formatMilli(preview?.next??0),
    'Motivo: '+cmd.reason,
    'A historic movement will be generated; no changes in prices or purchases.',
   ].join('\n')
   if(!window.confirm(statement))return
   setBusy(true)
   const row=await adjustmentJournal.reserve(newAdjustmentIntent(actorId,business.id,cmd))
   setPending(row)
   await send(row)
  }catch(e){setError(e instanceof Error?e.message:'The adjustment could not be prepared; POST was not sent.')}
  finally{setBusy(false)}
 }
 async function discard(){
  if(!pending||busy||!checkedToDiscard)return
  if(!window.confirm('Do you confirm that you reviewed balances and history before discarding this key? A new key could duplicate a confirmed setting.'))return
  setBusy(true);setError('')
  try{
   await adjustmentJournal.discard(scope,pending.key)
   setPending(null);setCheckedToDiscard(false)
   setBalance(undefined);setBalanceLoading(!!itemId&&!!locationId)
   setBalanceRefresh(x=>x+1)
   setNotice('Try discarded after verification. Checked the balance version again; no new adjustment was sent.')
  }catch(e){setError(e instanceof Error?e.message:'Could not be ruled out.')}
  finally{setBusy(false)}
 }
 const canSubmit=canAdjust&&roleAllowed&&!!selectedItem&&!!selectedLocation
   &&balance!==undefined&&!balanceLoading&&!loading&&!busy&&!pending&&!confirmed
   &&!!preview&&!draftError&&!!reason.trim()&&consent
 const pendingLabel=pending?.body.kind==='STOCK_INICIAL'?'Stock inicial':
   pending?.body.kind==='AJUSTE_ENTRADA'?'Input adjustment':'Output setting'
 return <section className="real-transfer-panel real-adjustment-panel" aria-label="Initial stock and real adjustments">
  <div className="real-transfer-top">
   <div><h2>Stock inicial y ajustes</h2>
    <p>The transactions are recorded in FastAPI and PostgreSQL, with traceability and balance version. They do not replace previous purchases or movements.</p>
   </div>
   <button type="button" className="real-auth-secondary" disabled={busy} onClick={onClose}>Back to inventory</button>
  </div>
  <p className="real-auth-note">Holder and administrator only can register initial stock. The assigned managers can adjust stocks. Workers: read only. API checks the role and permission STORE at headquarters.</p>
  <p className="real-auth-note">If you accept, the identity of the attempt and its commercial data (no token or password) are saved <strong>unencrypted</strong> In IndexedDB of this browser until they are resolved. Avoid shared devices.</p>
  {loading&&<p role="status">Checking pending attempts...</p>}
  {error&&<p role="alert" className="real-auth-error">{error}</p>}
  {notice&&<p role="status" className="real-auth-success">{notice}</p>}
  {!canAdjust&&!loading&&<p role="status" className="real-auth-note">Your role only allows you to check balances and history. No settings or initialization are enabled.</p>}
  {!loading&&confirmed&&<div className="real-transfer-confirmed">
   <h3>Operation confirmed: {confirmed.kind.replaceAll('_',' ')}</h3>
   <p>{catalog.find(x=>x.id===confirmed.catalog_item_id)?.name??confirmed.catalog_item_id} · {locations.find(x=>x.id===confirmed.location_id)?.name??confirmed.location_id}</p>
   <p>Motivo: {confirmed.reason}</p>
   <div className="real-transfer-movements">{confirmed.movements.map(m=><div key={m.id}>
    <span>{m.event_type.replaceAll('_',' ')}</span>
    <strong className={m.delta_milli<0?'real-inventory-negative':'real-inventory-positive'}>{formatDelta(m.delta_milli)} {confirmed.unit_snapshot}</strong>
   </div>)}</div>
   <p>Responsable: <code>{confirmed.actor_id}</code> · {date(confirmed.created_at)}</p>
   <details><summary>Audit identifiers</summary><p>Operation: <code>{confirmed.id}</code></p>
    <p>Movimiento: <code>{confirmed.movements[0].id}</code></p></details>
   <button type="button" className="real-auth-primary" onClick={onReview}>Review balances and history from API</button>
  </div>}
  {!loading&&!confirmed&&pending&&<div className="real-transfer-pending">
   <h3>Operation pending saved: {pendingLabel}</h3>
   <p>{pendingItem?.name??pending.body.catalog_item_id} · {pendingSite?.name??pending.body.location_id}</p>
   <p>Difference: {pending.body.kind==='AJUSTE_SALIDA'?'−':'+'}{formatMilli(pending.body.quantity_milli)}
    {' '}· Original version: <strong>{pending.body.expected_version}</strong></p>
   <p>Motivo: {pending.body.reason} · Date of attempt: {date(pending.createdAt)}</p>
   <p className="real-auth-note">First check balances and history. If you received 409 by outdated version, review the new status; the key SAME always retains the previous version. It is not automatically recalculated or forwarded.</p>
   <div className="real-transfer-actions">
    <button type="button" className="real-auth-secondary" disabled={busy} onClick={onReview}>Checking for balances and history</button>
    <button type="button" className="real-auth-primary" disabled={busy} onClick={()=>{
      if(window.confirm('Exactly forward the same operation with the same key and specified_version? Check before the existence of a confirmed movement.'))void send(pending)
    }}>{busy?'Consultando…':'Retry Same Operation'}</button>
   </div>
   <label className="real-transfer-accept"><input type="checkbox" checked={checkedToDiscard} disabled={busy}
     onChange={e=>setCheckedToDiscard(e.target.checked)}/>I checked the history and balances and decided to discard this attempt.</label>
   <button type="button" className="real-auth-secondary" disabled={!checkedToDiscard||busy} onClick={()=>void discard()}>Discard after verification</button>
  </div>}
  {!loading&&!confirmed&&!pending&&canAdjust&&<div className="real-transfer-form">
   <div className="real-transfer-grid">
    <label>Active physical article
     <select value={itemId} disabled={busy} onChange={e=>changeItem(e.target.value)}>
      <option value="">Choose article</option>
      {items.map(x=><option key={x.id} value={x.id}>{x.name} · {x.unit}</option>)}
     </select>
    </label>
    <label>Location with storage
     <select value={locationId} disabled={busy} onChange={e=>changeSite(e.target.value)}>
      <option value="">Elegir sede</option>
      {sites.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
     </select>
    </label>
    <label>Type of operation
     <select value={mode} disabled={busy} onChange={e=>{setMode(e.target.value as Mode);setQuantity('');setError('')}}>
      <option value="CONTEO">Physical count · indicate final balance</option>
      <option value="AJUSTE_ENTRADA">Input adjustment · add units</option>
      <option value="AJUSTE_SALIDA">Output setting · discount units</option>
      {canInitial&&<option value="STOCK_INICIAL">Initial stock · first load</option>}
     </select>
    </label>
    <label>{isCount?'Counted amount (final balance)':isInitial?'Cantidad inicial':'Cantidad a '+(mode==='AJUSTE_SALIDA'?'quitar':'agregar')}
     <input inputMode="decimal" maxLength={18} value={quantity} disabled={busy} onChange={e=>setQuantity(e.target.value)}
       placeholder={isCount?'Ej.: 0 o 12,500':'Ej.: 1 o 0,500'}/>
    </label>
   </div>
   <div className="real-transfer-balance">
    <div><strong>Current balance from API</strong><p>The version is checked again in FastAPI when confirming. It is not a reservation.</p></div>
    <div>{balanceLoading?'Consultando…':balance===undefined?'Select article and venue':
      balance===null?<strong>No balance recorded · version 0</strong>:
      <strong>{formatMilli(balance.quantity_milli)} {selectedItem?.unit} · version {balance.version}</strong>}</div>
    <button type="button" className="real-auth-secondary" disabled={!itemId||!locationId||busy} onClick={refreshBalance}>Update balance</button>
   </div>
   {balanceError&&<p role="alert" className="real-auth-error">{balanceError}</p>}
   {isInitial&&<p className="real-auth-note">Starting stock only when there is NO previous balance or movements of this article at this venue. An empty listing does not guarantee that there is no history: the backend will check both conditions. It cannot be used on an existing balance, even if it is zero.</p>}
   {isCount&&<p className="real-auth-note">The physical count is the observed final balance. The application converts the difference from the consulted balance into an input or output; it does not replace historical movements or modify the catalog. If it matches, no operation is sent.</p>}
   {draftError&&<p className="real-auth-error" role="alert">{draftError}</p>}
   {preview&&selectedItem&&<div className="real-adjustment-preview">
     <div><span>Observed balance</span><strong>{balance?formatMilli(balance.quantity_milli):'No balance'}</strong></div>
     <div><span>Movement to register</span>
       <strong className={preview.kind==='AJUSTE_SALIDA'?'real-inventory-negative':'real-inventory-positive'}>
        {preview.kind==='AJUSTE_SALIDA'?'−':'+'}{formatMilli(preview.quantity_milli)} {selectedItem.unit}</strong>
     </div>
     <div><span>Expected balance</span><strong>{formatMilli(preview.next)} {selectedItem.unit}</strong></div>
   </div>}
   {isCount&&quantity.trim()&&!draftError&&!preview&&balance!==undefined&&<p className="real-auth-note">The count matches the current balance: no movement is required.</p>}
   <label className="real-transfer-reason">Required reason (3 to 500 characters)
    <textarea rows={3} maxLength={500} disabled={busy} value={reason} onChange={e=>setReason(e.target.value)}
      placeholder="Ex.: Physical count and missing correction / initial inventory in stock"/>
   </label>
   <label className="real-transfer-accept"><input type="checkbox" disabled={busy} checked={consent}
    onChange={e=>setConsent(e.target.checked)}/>I agree to keep this unencrypted attempt in this browser until it is resolved.</label>
   <button type="button" className="real-auth-primary" disabled={!canSubmit} onClick={()=>void submit()}>
    {busy?'Confirmando…':'Confirm REAL operation'}
   </button>
  </div>}
 </section>
}
