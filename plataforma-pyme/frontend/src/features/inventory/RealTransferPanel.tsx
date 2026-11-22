import { useEffect, useMemo, useState } from 'react'
import { ApiHttpError } from '../../api/httpClient.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import type { LocationRecord } from '../businesses/realOperationsGateway.ts'
import type { CatalogItem } from '../catalog/realCatalogGateway.ts'
import { createInventoryGateway, formatDelta, formatMilli, inventoryErrorMessage } from './realInventoryGateway.ts'
import { createTransferGateway, transferErrorMessage, transferMilli, transferReason } from './realTransferGateway.ts'
import type { TransferCommand, TransferRecord } from './realTransferGateway.ts'
import {
  newTransferIntent, transferJournal, transferPendingScope,
} from './transferPendingJournal.ts'
import type { PendingTransfer } from './transferPendingJournal.ts'

type Props={
 token:string;actorId:string;business:RealBusiness
 locations:LocationRecord[];assignedLocationIds:string[];catalog:CatalogItem[]
 onUnauthorized:()=>void;onClose:()=>void;onConfirmed:()=>void;onReview:()=>void
}
function when(value:string):string{return new Intl.DateTimeFormat('es-AR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}
export function RealTransferPanel({token,actorId,business,locations,assignedLocationIds,catalog,onUnauthorized,onClose,onConfirmed,onReview}:Props){
 const gateway=useMemo(()=>createTransferGateway(token,business.id),[token,business.id])
 const balanceGateway=useMemo(()=>createInventoryGateway(token,business.id),[token,business.id])
 const scope=useMemo(()=>transferPendingScope(actorId,business.id),[actorId,business.id])
 const [article,setArticle]=useState('')
 const [source,setSource]=useState('')
 const [destination,setDestination]=useState('')
 const [quantity,setQuantity]=useState('1')
 const [reason,setReason]=useState('')
 const [consent,setConsent]=useState(false)
 const [pending,setPending]=useState<PendingTransfer|null>(null)
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [confirmed,setConfirmed]=useState<TransferRecord|null>(null)
 const [checkedBeforeDiscard,setCheckedBeforeDiscard]=useState(false)
 const [balance,setBalance]=useState<number|null>(null)
 const [balanceLoading,setBalanceLoading]=useState(false)
 const [balanceError,setBalanceError]=useState('')
 const [balanceRefresh,setBalanceRefresh]=useState(0)
 const isManager=['TITULAR_ADMINISTRATIVO','ADMINISTRADOR'].includes(business.membership.role)
 const eligibleSites=locations.filter(x=>x.status==='ACTIVA'&&x.can_store
  &&(isManager||assignedLocationIds.includes(x.id)))
 const eligibleItems=catalog.filter(x=>x.item_type==='BIEN'&&x.status==='ACTIVO')
 const selectedItem=eligibleItems.find(x=>x.id===article)
 const selectedSource=eligibleSites.find(x=>x.id===source)
 const selectedDestination=eligibleSites.find(x=>x.id===destination)
 const pendingItem=pending&&catalog.find(x=>x.id===pending.body.catalog_item_id)
 const pendingSource=pending&&locations.find(x=>x.id===pending.body.source_location_id)
 const pendingDest=pending&&locations.find(x=>x.id===pending.body.destination_location_id)

 useEffect(()=>{
  let active=true
  void transferJournal.load(scope).then(found=>{
   if(!active)return
   setPending(found)
   if(found)setNotice('A pending transfer from this user and company was recovered. No operation was sent automatically.')
  }).catch((err:unknown)=>{if(active)setError(transferErrorMessage(err))})
   .finally(()=>{if(active)setLoading(false)})
  return ()=>{active=false}
 },[scope])

 useEffect(()=>{
  if(!source||!article||!selectedSource||!selectedItem){
   return
  }
  const controller=new AbortController()
  void balanceGateway.balances(0,2,{locationId:source,catalogItemId:article},controller.signal)
   .then(rows=>{
     if(controller.signal.aborted)return
     if(rows.length>1)throw new Error('The API returned more than one balance for article and headquarters.')
     setBalance(rows.length===0?0:rows[0].quantity_milli)
     setBalanceError('')
   }).catch((err:unknown)=>{
     if(controller.signal.aborted)return
     if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
     setBalance(null);setBalanceError(inventoryErrorMessage(err))
   }).finally(()=>{if(!controller.signal.aborted)setBalanceLoading(false)})
  return ()=>{controller.abort()}
 },[balanceGateway,source,article,selectedSource,selectedItem,onUnauthorized,balanceRefresh])

 function changeArticle(id:string){setArticle(id);setBalance(null);setBalanceLoading(!!id&&!!source);setBalanceError('');setNotice('')}
 function changeSource(id:string){setSource(id);setDestination('');setBalance(null);setBalanceLoading(!!id&&!!article);setBalanceError('');setNotice('')}
 function refreshBalance(){
  setBalance(null);setBalanceLoading(true);setBalanceError('')
  setBalanceRefresh(x=>x+1)
 }
 function command():TransferCommand{
  if(!selectedItem||!selectedSource||!selectedDestination)
   throw new RangeError('I chose physical article and both locations with active storage.')
  return {
   catalog_item_id:selectedItem.id,source_location_id:selectedSource.id,
   destination_location_id:selectedDestination.id,
   quantity_milli:transferMilli(quantity,selectedItem.unit),
   reason:transferReason(reason),
  }
 }
 async function sendIntent(row:PendingTransfer){
  setBusy(true);setError('');setNotice('')
  try {
   const result=await gateway.create(row.body,row.key)
   setConfirmed(result)
   // Safe GET detail: the server has returned an operation ID; no extra POST.
   try{
    const checked=await gateway.get(result.id)
    setConfirmed(checked)
    setNotice('Confirmed transfer. Operation verified by ID. Balances and history are being consulted from FastAPI.')
   }catch{
    setNotice('Transfer confirmed by POST; the Detail GET could not be verified. Do not repeat the operation.')
   }
   onConfirmed()
   try{
    await transferJournal.discard(row.scope,row.key)
    setPending(null)
   }catch{
    setNotice('Transfer confirmed, but could not clean the browser log. Do not create another key or repeat the operation; check your ID.')
   }
  }catch(err){
   if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
   setError(transferErrorMessage(err))
   setPending(row) // Keep same key and body for explicit replay or later investigation.
  }finally{setBusy(false)}
 }
 async function create(){
  if(busy||loading||pending||confirmed||!consent||balance===null||balanceLoading)return
  try{
   const cmd=command()
   if(cmd.quantity_milli>balance){setError('The balance consulted is insufficient. Update before continuing.');return}
   const label=selectedItem?.name??'Item'
   const sourceName=selectedSource?.name??'Origen'
   const destName=selectedDestination?.name??'Destino'
   if(!window.confirm(
     'Confirm Real transfer of '+formatMilli(cmd.quantity_milli)+' '+(selectedItem?.unit??'')+
     ' de '+label+' desde '+sourceName+' hacia '+destName+'? The backend will deduct stock in origin and add it to destination in a single operation.'
   ))return
   setBusy(true) // Block a second click while IndexedDB reserves identity before POST.
   const row=newTransferIntent(actorId,business.id,cmd)
   const saved=await transferJournal.reserve(row)
   setPending(saved)
   await sendIntent(saved)
  }catch(err){
   setError(err instanceof Error?err.message:'Could not prepare the operation. POST was not sent.')
  }finally{setBusy(false)}
 }
 async function discard(){
  if(!pending||busy||!checkedBeforeDiscard)return
  if(!window.confirm('Confirms that YA checked the balances and history and you want to rule out the identity of this transfer. If confirmed, a new key could double the move.'))return
  setBusy(true);setError('')
  try{
   await transferJournal.discard(scope,pending.key)
   setPending(null);setCheckedBeforeDiscard(false)
   setNotice('I\'m trying to rule out explicit decision.')
  }catch(err){setError(err instanceof Error?err.message:'Could not be ruled out.')}
  finally{setBusy(false)}
 }
 const active=business.status==='ACTIVA'&&business.membership.status==='ACTIVA'
 const canSubmit=active&&eligibleSites.length>=2&&eligibleItems.length>0&&!busy&&!loading&&!pending
  &&!confirmed&&consent&&!!selectedItem&&!!selectedSource&&!!selectedDestination
  &&source!==destination&&balance!==null&&!balanceLoading&&balance>0

 return <section className="real-transfer-panel" aria-label="Actual transfer between headquarters">
  <div className="real-transfer-top">
   <div>
    <h2>Transfer stock between locations</h2>
    <p>A REAL transfer generates an atomic output and input in PostgreSQL. It does not create purchases, sales or money movements.</p>
   </div>
   <button type="button" className="real-auth-secondary" onClick={onClose} disabled={busy}>Back to inventory</button>
  </div>
  <p className="real-auth-note">Server requires permission <strong>STORE in both locations</strong>. Si sos Encargado o Trabajador, necesitás asignación activa a origen y destino. La interfaz no sustituye esa autorización.</p>
  <p className="real-auth-note">The identity of the application (UUID4, article, locations, quantity, reason and date) is preserved without encrypting in IndexedDB until confirmed or resolved. No tokens or passwords are saved. Avoid shared devices.</p>
  {loading&&<p role="status">Checking for pending transfer in this browser...</p>}
  {error&&<p role="alert" className="real-auth-error">{error}</p>}
  {notice&&<p role="status" className="real-auth-success">{notice}</p>}

  {!loading&&confirmed&&<div className="real-transfer-confirmed">
   <h3>Confirmed transfer</h3>
   <p><strong>{formatMilli(confirmed.quantity_milli)} {confirmed.unit_snapshot}</strong> · {catalog.find(x=>x.id===confirmed.catalog_item_id)?.name??'Item '+confirmed.catalog_item_id}</p>
   <p>{locations.find(x=>x.id===confirmed.source_location_id)?.name??confirmed.source_location_id} → {locations.find(x=>x.id===confirmed.destination_location_id)?.name??confirmed.destination_location_id}</p>
   <p>Responsible ID: <code>{confirmed.actor_id}</code> · {when(confirmed.created_at)}</p>
   <div className="real-transfer-movements">{confirmed.movements.map(m=><div key={m.id}>
    <span>{m.event_type==='TRASLADO_SALIDA'?'Output at source':'Entry into destination'}</span>
    <strong className={m.delta_milli<0?'real-inventory-negative':'real-inventory-positive'}>{formatDelta(m.delta_milli)} {confirmed.unit_snapshot}</strong>
   </div>)}</div>
   <details><summary>See transfer identifiers</summary>
    <p>Operation ID: <code>{confirmed.id}</code></p>
    {confirmed.movements.map(x=><p key={x.id}>{x.event_type}: <code>{x.id}</code></p>)}
   </details>
   <button type="button" className="real-auth-primary" onClick={onReview}>Review updated balances and history</button>
  </div>}

  {!loading&&!confirmed&&pending&&<div className="real-transfer-pending">
   <h3>There is a saved transfer attempt</h3>
   <p><strong>{pendingItem?.name??pending.body.catalog_item_id}</strong> · {formatMilli(pending.body.quantity_milli)} {pendingItem?.unit??'units according to catalogue'}</p>
   <p>{pendingSource?.name??pending.body.source_location_id} → {pendingDest?.name??pending.body.destination_location_id}</p>
   <p>Motivo: {pending.body.reason}</p>
   <p>Creado: {when(pending.createdAt)}. Misma clave y mismo cuerpo guardados para recuperar después de F5.</p>
   <p className="real-auth-note">First check the history and balances. If you can't find the transfer, you can repeat this intention exclusively. Repeating with a new key can double the operation.</p>
   <div className="real-transfer-actions">
    <button type="button" className="real-auth-secondary" disabled={busy} onClick={onReview}>Checking for balances and history</button>
    <button type="button" className="real-auth-primary" disabled={busy} onClick={()=>{
     if(window.confirm('To forward the same transfer with the same key idempotent? The inventory status was verified before.'))void sendIntent(pending)
    }}>{busy?'Procesando…':'Retry Same Transfer'}</button>
   </div>
   <label className="real-transfer-accept"><input type="checkbox" checked={checkedBeforeDiscard}
    disabled={busy} onChange={e=>setCheckedBeforeDiscard(e.target.checked)}/>
    I've already checked the history and balances; I take the decision to rule out this attempt.</label>
   <button type="button" className="real-auth-secondary" disabled={busy||!checkedBeforeDiscard}
    onClick={()=>void discard()}>Discard after verification</button>
  </div>}

  {!loading&&!confirmed&&!pending&&<div className="real-transfer-form">
   {(!active||eligibleSites.length<2||eligibleItems.length===0)&&<p className="real-auth-note">To move you need an active company, two active sites with authorized storage for your role and at least one physical item active in the loaded catalog.</p>}
   <div className="real-transfer-grid">
    <label>Active physical article
     <select value={article} disabled={busy||!active} onChange={e=>changeArticle(e.target.value)}>
      <option value="">Select article</option>
      {eligibleItems.map(x=><option key={x.id} value={x.id}>{x.name} · {x.unit}</option>)}
     </select>
    </label>
    <label>Origin location
     <select value={source} disabled={busy||!active} onChange={e=>changeSource(e.target.value)}>
      <option value="">Select Source</option>
      {eligibleSites.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
     </select>
    </label>
    <label>Destination location
     <select value={destination} disabled={busy||!active} onChange={e=>{setDestination(e.target.value);setNotice('')}}>
      <option value="">Select Destination</option>
      {eligibleSites.filter(x=>x.id!==source).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
     </select>
    </label>
    <label>Number of transfers
     <input inputMode="decimal" value={quantity} maxLength={18} disabled={busy||!active}
      onChange={e=>setQuantity(e.target.value)} placeholder="1 (unit) or 0.500 (fractionable)"/>
    </label>
   </div>
   <div className="real-transfer-balance">
    <div><strong>Balance consulted from origin</strong><p>It's a FastAPI reading, not a stock reservation.</p></div>
    <div>{balanceLoading?'Consultando…':balance===null?'Select article and origin':<strong>{formatMilli(balance)} {selectedItem?.unit}</strong>}</div>
    <button type="button" className="real-auth-secondary" disabled={busy||!article||!source}
      onClick={refreshBalance}>Update balance</button>
   </div>
   {balanceError&&<p className="real-auth-error" role="alert">{balanceError}</p>}
   <label className="real-transfer-reason">Reason for relocation
    <textarea value={reason} maxLength={500} rows={3} disabled={busy||!active}
     onChange={e=>setReason(e.target.value)} placeholder="E.g.: Replenishment of goods at another headquarters"/>
   </label>
   <label className="real-transfer-accept"><input type="checkbox" checked={consent} disabled={busy}
    onChange={e=>setConsent(e.target.checked)}/>
    I agree to keep this attempt in this browser to recover it from connection cuts or F5.</label>
   <button type="button" className="real-auth-primary" disabled={!canSubmit}
     onClick={()=>void create()}>{busy?'Confirmando…':'Confirm Real Transfer'}</button>
  </div>}
 </section>
}
