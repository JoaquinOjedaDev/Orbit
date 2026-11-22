import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiHttpError } from '../../api/httpClient.ts'
import { Icon } from '../../app/Icon.tsx'
import './realPurchasesVisual.css'
import { RealPhotoPreview } from '../photos/RealPhotos.tsx'
import { createOperationsGateway, canReadTeam } from '../businesses/realOperationsGateway.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import type { LocationRecord, TeamMember } from '../businesses/realOperationsGateway.ts'
import { createCatalogGateway, centsToPesos } from '../catalog/realCatalogGateway.ts'
import type { CatalogItem } from '../catalog/realCatalogGateway.ts'
import { createSupplyGateway, decimalToMilli, milliToDecimal, priceInputCents, purchaseStatusPresentation, missingReceiptMessage, inspectReceipt,
  supplyErrorMessage, validatePurchase } from './realSupplyGateway.ts'
import type { Purchase, PurchaseReceipt, NewPurchase, Supplier, PurchaseLineInput } from './realSupplyGateway.ts'
import { RealReceiptDetail } from './RealReceiptDetail.tsx'
import { pendingScope, supplyJournal, PendingConflictError, PendingStorageError, newPurchaseIntent, newReceiptIntent } from './supplyPendingJournal.ts'
import { suggestedUnitCost, costExceedsSalePrice, previewLineTotalCents, previewPurchaseTotalCents, unitCostFromExactLineTotal } from './purchaseCostProposal.ts'
import type { SupplyPending } from './supplyPendingJournal.ts'
type Props={token:string;userId:string;userDisplayName:string;businessId:string;onNavigate:(path:string)=>void;onUnauthorized:()=>void}
type DraftLine={catalogId:string;description:string;quantity:string;unitCost:string;totalDraft:string|null}
type Draft={date:string;supplierId:string;reference:string;notes:string;lines:DraftLine[]}
const emptyLine=():DraftLine=>({catalogId:'concept',description:'Purchase concept',quantity:'1',unitCost:'0',totalDraft:null})
function todayLocal():string{
 const date=new Date()
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')
}
const emptyDraft=():Draft=>({date:todayLocal(),supplierId:'',reference:'',notes:'',lines:[emptyLine()]})
const money=(n:number)=>'$ '+centsToPesos(n)
export function RealPurchasesPage({token,userId,userDisplayName,businessId,onNavigate,onUnauthorized}:Props){
 const api=useMemo(()=>createSupplyGateway(token,businessId),[token,businessId])
 const catalogApi=useMemo(()=>createCatalogGateway(token,businessId),[token,businessId])
 const companies=useMemo(()=>createOperationsGateway(token,userId),[token,userId])
 const alive=useRef(true)
 const receiptLookup=useRef(false)
 const backRef=useRef<HTMLButtonElement>(null)
 const listTitleRef=useRef<HTMLHeadingElement>(null)
 const lastView=useRef<'list'|'form'|'receive'|'detail'>('list')
 const [business,setBusiness]=useState<RealBusiness|null>(null)
 const [purchases,setPurchases]=useState<Purchase[]>([])
 const [suppliers,setSuppliers]=useState<Supplier[]>([])
 const [catalog,setCatalog]=useState<CatalogItem[]>([])
 const [locations,setLocations]=useState<LocationRecord[]>([])
 const [teamActors,setTeamActors]=useState<{
   businessId:string;people:Array<Pick<TeamMember,'user_id'|'display_name'>>
 }|null>(null)
 const [hasMore,setHasMore]=useState(false)
 const [catalogMore,setCatalogMore]=useState(false)
 const [suppliersMore,setSuppliersMore]=useState(false)
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [form,setForm]=useState(false)
 const [draft,setDraft]=useState<Draft>(emptyDraft)
 const [consent,setConsent]=useState(false)
 const [pending,setPending]=useState<Extract<SupplyPending,{kind:'purchase.create'}>|null>(null)
 const [pendingReceipt,setPendingReceipt]=useState<Extract<SupplyPending,{kind:'purchase.receive'}>|null>(null)
 const [shownReceipt,setShownReceipt]=useState<PurchaseReceipt|null>(null)
 const [search,setSearch]=useState('')
 const [stateFilter,setStateFilter]=useState<'TODAS'|'REGISTRADA'|'RECIBIDA'|'CANCELADA'>('TODAS')
 const [receiptFor,setReceiptFor]=useState<string|null>(null)
 const [locationId,setLocationId]=useState('')
 const [journalReady,setJournalReady]=useState(false)
 const purchaseScope=useMemo(()=>pendingScope(userId,businessId,'purchase.create'),[userId,businessId])
 useEffect(()=>{
   alive.current=true
   const ctrl=new AbortController()
   void Promise.all([
     companies.business(businessId,ctrl.signal),
     api.purchases(0,100,ctrl.signal),
     api.suppliers(0,100,ctrl.signal),
     catalogApi.page(0,100,ctrl.signal),
     companies.locations(businessId,ctrl.signal),
     supplyJournal.load(purchaseScope),
   ]).then(([company,docs,providers,items,sites,saved])=>{
     if(ctrl.signal.aborted||!alive.current)return
     setBusiness(company);setPurchases(docs);setSuppliers(providers);setCatalog(items);setLocations(sites)
     setHasMore(docs.length===100);setCatalogMore(items.length===100);setSuppliersMore(providers.length===100)
     if(saved){
       if(saved.kind!=='purchase.create')throw new PendingConflictError()
       setPending(saved);setForm(true);setConsent(true)
       setDraft({
         date:saved.body.purchased_on,supplierId:saved.body.supplier_id??'',
         reference:saved.body.reference,notes:saved.body.notes,
         lines:saved.body.lines.map(line=>({
           catalogId:line.catalog_item_id??'concept',description:line.description,
           quantity:milliToDecimal(line.quantity_milli),unitCost:centsToPesos(line.unit_cost_cents),totalDraft:null,
         })),
       })
       setNotice('Purchase recovered pending. Check the list before retrying. It will not be sent automatically.')
     }
     setJournalReady(true)
   }).catch(err=>{
     if(ctrl.signal.aborted||!alive.current)return
     if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
     else setError(err instanceof PendingConflictError||err instanceof PendingStorageError?err.message:supplyErrorMessage(err))
   }).finally(()=>{if(!ctrl.signal.aborted&&alive.current)setLoading(false)})
   return ()=>{ctrl.abort();alive.current=false}
 },[api,catalogApi,companies,businessId,purchaseScope,onUnauthorized])
 // El equipo es privado: consultarlo únicamente cuando el servidor ya informó
 // que la membresía puede leerlo. La recepción histórica no se atribuye
 // al usuario conectado si pertenece a otra persona.
 useEffect(()=>{
   const controller=new AbortController()
   if(!business||business.id!==businessId||!canReadTeam(business))
     return ()=>controller.abort()
   void companies.team(businessId,controller.signal).then(rows=>{
     if(!controller.signal.aborted)
       setTeamActors({businessId,people:rows.map(({user_id,display_name})=>({user_id,display_name}))})
   }).catch(err=>{
     if(controller.signal.aborted)return
     if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
     // 403 o falta de acceso: mantener nombres no disponibles;
     // no filtrar personas ni hacer una segunda solicitud.
   })
   return ()=>controller.abort()
 },[business,businessId,companies,onUnauthorized])
 const canWrite=business?.status==='ACTIVA'&&business.membership.status==='ACTIVA'
  &&['TITULAR_ADMINISTRATIVO','ADMINISTRADOR'].includes(business.membership.role)
 const canReceive=business?.status==='ACTIVA'&&business.membership.status==='ACTIVA'
 const activeSites=locations.filter(x=>x.status==='ACTIVA'&&x.can_store)
 const activeItems=catalog.filter(x=>x.status==='ACTIVO')
 const activeSuppliers=suppliers.filter(x=>x.status==='ACTIVO')
 const totalPreview=draft.lines.some(x=>x.totalDraft!==null)?null:previewPurchaseTotalCents(draft.lines)
 const selected=purchases.find(x=>x.id===receiptFor)
 const detailPurchase=shownReceipt?purchases.find(x=>x.id===shownReceipt.purchase_id)??null:null
 const view:'list'|'form'|'receive'|'detail'=form?'form':shownReceipt?'detail':receiptFor?'receive':'list'
 const visiblePurchases=purchases.filter(p=>
   (stateFilter==='TODAS'||p.status===stateFilter)
   &&[p.reference,p.supplier_name_snapshot,p.id].some(value=>
     (value??'').toLocaleLowerCase('es-AR').includes(search.trim().toLocaleLowerCase('es-AR'))))
 const receivedCount=purchases.filter(p=>p.status==='RECIBIDA').length
 const registeredCount=purchases.filter(p=>p.status==='REGISTRADA').length
 useEffect(()=>{
   if(lastView.current===view)return
   // Durante la recuperación del journal el botón está deshabilitado.
   // Esperar a que finalice para dirigir el foco de teclado a la nueva vista.
   if(view!=='list'&&busy)return
   if(view==='list')listTitleRef.current?.focus()
   else backRef.current?.focus()
   lastView.current=view
 },[view,busy])
 function closePurchaseForm(){
   if(busy||pending)return
   setForm(false);setDraft(emptyDraft());setConsent(false);setError('')
 }
 function startPurchaseForm(){
   if(!canWrite||busy||loading||!journalReady)return
   setDraft(emptyDraft());setConsent(false);setError('');setNotice('');setForm(true)
 }
 function closeReceiptSubview(){
   if(busy||loading)return
   const savedIntent=pendingReceipt!==null
   setShownReceipt(null);setReceiptFor(null);setPendingReceipt(null);setLocationId('')
   setError('')
   if(savedIntent)setNotice('The pending reception is still stored in this browser with its original key. To verify it, re-open the same purchase and consult the voucher before retrying.')
 }
 function closeCurrentView(){
   if(view==='form')closePurchaseForm()
   else closeReceiptSubview()
 }

 function failed(err:unknown){
   if(!alive.current)return
   if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
   setError(supplyErrorMessage(err))
 }
 async function refresh(){
   if(busy||loading)return
   setLoading(true);setError('');setNotice('')
   try{
     const [docs,providers,items,sites]=await Promise.all([api.purchases(),api.suppliers(),catalogApi.page(0),companies.locations(businessId)])
     if(!alive.current)return
     setPurchases(docs);setHasMore(docs.length===100)
     setSuppliers(providers);setSuppliersMore(providers.length===100)
     setCatalog(items);setCatalogMore(items.length===100)
     setLocations(sites)
   }catch(err){failed(err)}finally{if(alive.current)setLoading(false)}
 }
 async function more(which:'purchases'|'suppliers'|'catalog'){
   if(busy||loading)return
   setLoading(true);setError('')
   try{
     if(which==='purchases'){
       const newRows=await api.purchases(purchases.length)
       if(!alive.current)return
       if(newRows.some(x=>purchases.some(y=>y.id===x.id))){setHasMore(false);setError('The history changed. Update from the front page.');return}
       setPurchases(old=>[...old,...newRows]);setHasMore(newRows.length===100)
     }else if(which==='suppliers'){
       const newRows=await api.suppliers(suppliers.length)
       if(!alive.current)return
       if(newRows.some(x=>suppliers.some(y=>y.id===x.id))){setSuppliersMore(false);setError('Suppliers modified during pagination. Update.');return}
       setSuppliers(old=>[...old,...newRows]);setSuppliersMore(newRows.length===100)
     }else{
       const newRows=await catalogApi.page(catalog.length)
       if(!alive.current)return
       if(newRows.some(x=>catalog.some(y=>y.id===x.id))){setCatalogMore(false);setError('Catalog modified during pagination. Update.');return}
       setCatalog(old=>[...old,...newRows]);setCatalogMore(newRows.length===100)
     }
   }catch(err){failed(err)}finally{if(alive.current)setLoading(false)}
 }
 function buildPurchase():NewPurchase{
   if(draft.lines.some(x=>x.totalDraft!==null))throw new RangeError('First apply or cancel the total cost of each line.')
   const lines:PurchaseLineInput[]=draft.lines.map(x=>{
     const article=catalog.find(item=>item.id===x.catalogId)
     if(x.catalogId!=='concept'&&(!article||article.status!=='ACTIVO'))
       throw new RangeError('Select an active item from the REAL catalogue.')
     return {catalog_item_id:article?.id??null,
       description:article?.name??x.description.trim(),
       unit:article?.unit??'CONCEPTO',
       quantity_milli:decimalToMilli(x.quantity),unit_cost_cents:priceInputCents(x.unitCost)}
   })
   const body:NewPurchase={purchased_on:draft.date,supplier_id:draft.supplierId||null,
     reference:draft.reference.trim(),notes:draft.notes.trim(),lines}
   validatePurchase(body)
   if(body.supplier_id&&!activeSuppliers.some(x=>x.id===body.supplier_id))
     throw new RangeError('I chose an active supplier of this company.')
   return body
 }
 async function savePurchase(e:FormEvent<HTMLFormElement>){
   e.preventDefault()
   if(!canWrite||busy||loading||!journalReady)return
   if(!consent){setError('You should authorize to keep the commercial intent in IndexedDB.');return}
   let body:NewPurchase
   try{body=pending?.body??buildPurchase()}catch(err){failed(err);return}
   const intent:Extract<SupplyPending,{kind:'purchase.create'}>=pending??newPurchaseIntent(userId,businessId,body)
   setBusy(true);setError('');setNotice('')
   try{
     await supplyJournal.reserve(intent)
     if(!alive.current)return
     setPending(intent)
     const result=await api.createPurchase(intent.body,intent.key)
     if(!alive.current)return
     await supplyJournal.discard(intent.scope,intent.key)
     if(!alive.current)return
     setPending(null);setConsent(false);setForm(false);setDraft(emptyDraft())
     setNotice('Purchase '+result.id+' The purchase did NOT add stock: for that you have to confirm its receipt.')
     const rows=await api.purchases()
     if(alive.current){setPurchases(rows);setHasMore(rows.length===100)}
   }catch(err){
     if(!alive.current)return
     if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
     setError(err instanceof PendingStorageError||err instanceof PendingConflictError?err.message:
       'We do not confirm the creation. Check the history and, if applicable, retry only with the SAME key/body. '+supplyErrorMessage(err))
   }finally{if(alive.current)setBusy(false)}
 }
 async function beginReceipt(purchaseId:string){
   if(busy||loading||receiptLookup.current)return
   receiptLookup.current=true
   setBusy(true)
   setError('');setNotice('');setShownReceipt(null);setReceiptFor(purchaseId);setPendingReceipt(null);setLocationId('')
   try{
     const scope=pendingScope(userId,businessId,'purchase.receive',purchaseId)
     const restored=await supplyJournal.load(scope)
     if(!alive.current)return
     if(restored){
       if(restored.kind!=='purchase.receive')throw new PendingConflictError()
       setPendingReceipt(restored);setLocationId(restored.body.location_id)
       setNotice('Recuperation pending: Check first if a voucher exists.')
     }
   }catch(err){failed(err)}
   finally{receiptLookup.current=false;if(alive.current)setBusy(false)}
 }
 async function sendReceipt(){
   if(!receiptFor||!canReceive||busy||loading||receiptLookup.current)return
   if(pendingReceipt&&pendingReceipt.purchaseId!==receiptFor){
     setError('The received receipt is for another purchase. Close the selection and I opened it again.');return
   }
   if(!window.confirm('Confirm COMPLETE receipt of purchase at the chosen location. This action increases actual stock in PostgreSQL and does not support partial reception. Continue?'))return
   const intent:Extract<SupplyPending,{kind:'purchase.receive'}>=pendingReceipt??newReceiptIntent(userId,businessId,receiptFor,locationId)
   if(!activeSites.some(x=>x.id===intent.body.location_id)){
     setError('The chosen venue is paused, outside the tenant or does not allow stock.');return
   }
   setBusy(true);setError('');setNotice('')
   try{
     await supplyJournal.reserve(intent)
     if(!alive.current)return
     setPendingReceipt(intent)
     const result=await api.receive(intent.purchaseId,intent.body.location_id,intent.key)
     if(!alive.current)return
     await supplyJournal.discard(intent.scope,intent.key)
     if(!alive.current)return
     setPendingReceipt(null);setReceiptFor(null);setShownReceipt(result)
     setNotice('Confirmed reception; detail shows REAL stock movements. Do not repeat.')
     const rows=await api.purchases()
     if(alive.current){setPurchases(rows);setHasMore(rows.length===100)}
   }catch(err){
     if(!alive.current)return
     if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
     setError(err instanceof PendingStorageError||err instanceof PendingConflictError?err.message:
       'Uncertain or rejected result. Check the voucher first, then try the key SAME only. '+supplyErrorMessage(err))
   }finally{if(alive.current)setBusy(false)}
 }
 async function checkReceipt(purchaseId?:string){
   const target=purchaseId??receiptFor
   if(!target||busy||loading)return
   setBusy(true);setError('');setNotice('');setShownReceipt(null)
   try{
     const scope=pendingScope(userId,businessId,'purchase.receive',target)
     const fromDisk=await supplyJournal.load(scope)
     if(fromDisk&&fromDisk.kind!=='purchase.receive')throw new PendingConflictError()
     const inspected=await inspectReceipt(api,target)
     if(!alive.current)return
     if(inspected.kind!=='confirmed'){
       setPurchases(old=>old.map(p=>p.id===inspected.purchase.id?inspected.purchase:p))
       if(inspected.kind==='pending')setNotice(missingReceiptMessage(inspected.purchase.status))
       else setError(missingReceiptMessage(inspected.purchase.status))
       return
     }
     const receipt=inspected.receipt
     setShownReceipt(receipt)
     if(fromDisk&&receipt.request_id===fromDisk.key){
       await supplyJournal.discard(fromDisk.scope,fromDisk.key)
       if(!alive.current)return
       setPendingReceipt(null);setReceiptFor(null)
       setNotice('Reception already confirmed with the same key; slope cleaned without doubling stock.')
     }else{
       setNotice('')
     }
     const rows=await api.purchases()
     if(alive.current){setPurchases(rows);setHasMore(rows.length===100)}
   }catch(err){failed(err)}
   finally{if(alive.current)setBusy(false)}
 }
 async function discardPurchase(){
   if(!pending||busy)return
   if(!window.confirm('Only discard if you checked the history. If the purchase already exists, another key can double it. Delete local pending?'))return
   setBusy(true)
   try{await supplyJournal.discard(pending.scope,pending.key);if(alive.current){setPending(null);setDraft(emptyDraft());setConsent(false);setNotice('Local pending discarded; we do not delete documents in FastAPI.')}}
   catch(err){failed(err)}finally{if(alive.current)setBusy(false)}
 }
 function changeLine(index:number,patch:Partial<DraftLine>){
   setDraft(old=>({...old,lines:old.lines.map((x,i)=>i===index?{...x,...patch}:x)}))
 }
 function applyLineTotal(index:number) {
   const line=draft.lines[index]
   if(!line||line.totalDraft===null)return
   try {
     const calculatedUnit=unitCostFromExactLineTotal(line.quantity,line.totalDraft)
     changeLine(index,{unitCost:calculatedUnit,totalDraft:null})
     setError('')
   } catch(err) {
     setError(err instanceof Error?err.message:'The total amount of the line is invalid.')
   }
 }
 return <section className="real-auth-card real-business-panel e3-purchases-page">
   {view!=='list'&&<div className="e3-purchases-backbar">
     <button ref={backRef} type="button" className="e3-purchases-back"
       disabled={busy||loading||(view==='form'&&!!pending)} onClick={closeCurrentView}>
       <Icon name="arrow-left" size={18}/>Back to shopping
     </button>
     {view==='form'&&pending&&<span className="e3-purchases-pending-label">Intention pending: keep key</span>}
     {view!=='form'&&pendingReceipt&&<span className="e3-purchases-pending-label">Original key saved reception</span>}
   </div>}
   {view==='list'&&<>
   <nav className="real-business-nav" aria-label="REAL operations">
     <button className="real-auth-link" type="button" onClick={()=>onNavigate('/real/empresas/'+businessId)}>Company</button>
     <button className="real-auth-link" type="button" onClick={()=>onNavigate('/real/empresas/'+businessId+'/proveedores')}>Suppliers</button>
     <button className="real-auth-link" type="button" onClick={()=>onNavigate('/real/empresas/'+businessId+'/catalogo')}>Catalog</button>
     <button className="real-auth-link" type="button" onClick={()=>onNavigate('/real/empresas/'+businessId+'/ubicaciones')}>Locations</button>
   </nav>
   <header className="e3-purchases-heading">
     <span className="e3-purchases-heading-icon"><Icon name="shopping" size={27}/></span>
     <div className="e3-purchases-heading-copy">
       <span className="e3-purchases-kicker">{business?.name??'Company'} · Comercial</span>
       <h1 ref={listTitleRef} tabIndex={-1}>Purchases and reception</h1>
       <p>Register purchases, check vouchers and receive merchandise in authorized locations.</p>
     </div>
     {canWrite&&<button type="button" className="real-auth-primary e3-purchases-heading-action"
       disabled={busy||loading||!journalReady} onClick={startPurchaseForm}>
       <Icon name="plus" size={17}/>Register Real Purchase
     </button>}
   </header>
   <p className="e3-purchases-safety-note">Registering a purchase does not increase inventory. Only a confirmed receipt adds real stock.</p>
   {!loading&&<div className="e3-purchases-summary" aria-label="Summary of purchases charged">
     <div><span>Loaded purchases</span><strong>{purchases.length}</strong></div>
     <div><span>Pending receipt</span><strong>{registeredCount}</strong></div>
     <div><span>Recibidas</span><strong>{receivedCount}</strong></div>
   </div>}
   {!loading&&purchases.length>0&&<div className="e3-purchases-filterbar">
     <label className="e3-purchases-search"><Icon name="search" size={17}/>
       <input type="search" aria-label="Search for loaded purchases" placeholder="Search by reference or provider"
         value={search} onChange={e=>setSearch(e.target.value)}/>
     </label>
     <label className="e3-purchases-state-filter">Status
       <select aria-label="Filter purchases by state" value={stateFilter}
         onChange={e=>setStateFilter(e.target.value as typeof stateFilter)}>
         <option value="TODAS">All</option><option value="REGISTRADA">Pendientes</option>
         <option value="RECIBIDA">Recibidas</option><option value="CANCELADA">Canceladas</option>
       </select>
     </label>
   </div>}
   <div className="real-ops-toolbar"><strong>{purchases.length} loaded purchases{hasMore?' (not the whole history)':''}</strong>
     <button type="button" className="real-auth-secondary" disabled={busy||loading} onClick={()=>void refresh()}>Update Data</button>
   </div>
   {loading&&<p role="status">Checking suppliers, catalogs, purchases and locations...</p>}
   {!loading&&purchases.length===0&&<div className="real-business-empty">There are still no real purchases in this company.</div>}
   {!loading&&purchases.length>0&&visiblePurchases.length===0&&<div className="real-business-empty">We didn't find any purchases with those filters on the loaded pages.</div>}
   <div className="real-supply-list e3-purchases-card-list">
     {visiblePurchases.map(p=>{const visualState=purchaseStatusPresentation(p.status);return <article key={p.id} className="real-supply-card">
       <div className="real-catalog-tile-header"><strong>{p.reference||'Purchase '+p.id.slice(0,8)}</strong><span className={"real-catalog-status "+(visualState.tone==="pending"?"real-supply-pending-status":visualState.tone==="confirmed"?"real-catalog-active":"real-supply-neutral-status")}>{visualState.label}</span></div>
       <small>{p.purchased_on} · Proveedor: {p.supplier_name_snapshot||'No supplier'} · {p.lines.length} {p.lines.length === 1 ? 'renglón' : 'renglones'}</small>
       <strong className="real-supply-total">{money(p.total_cents)}</strong>
       <ul>{p.lines.map(l=><li key={l.id} className="e3-purchase-line-with-photo">
         {l.catalog_item_id&&<RealPhotoPreview token={token}
           owner={{kind:'CATALOG',businessId,resourceId:l.catalog_item_id}}
           alt={'Current cover of '+l.description_snapshot} className="e3-purchase-line-photo"/>}
         <span>{l.description_snapshot} — {milliToDecimal(l.quantity_milli)} {l.unit_snapshot} × {money(l.unit_cost_cents)} = {money(l.line_total_cents)}</span>
       </li>)}</ul>
       <small className="e3-photo-reference-note">Current images of the catalogue; amounts and descriptions of purchase are historical.</small>
       {p.status==='REGISTRADA'&&canReceive&&<button className="real-auth-secondary real-supply-pending-action" type="button" disabled={busy||loading} onClick={()=>void beginReceipt(p.id)}>Pending · Confirm reception at location</button>}
       {p.status==='RECIBIDA'&&<button className="real-auth-secondary" type="button" disabled={busy||loading} onClick={()=>void checkReceipt(p.id)}>Check voucher</button>}

     </article>})}
   </div>
   {hasMore&&<button type="button" className="real-auth-secondary" disabled={loading||busy} onClick={()=>void more('purchases')}>Load 100 more purchases</button>}
   </>}
   {view==='receive'&&<section className="e3-purchases-receive-view" aria-label="Reception screen">
     <header className="e3-purchases-heading e3-purchases-form-heading">
       <span className="e3-purchases-heading-icon"><Icon name="boxes" size={27}/></span>
       <div className="e3-purchases-heading-copy">
         <span className="e3-purchases-kicker">{business?.name??'Company'} · Inventario</span>
         <h1>Purchase reception</h1>
         <p>{selected?.reference||'Selected Purchase'} · A single authorized location.</p>
       </div>
     </header>
     {selected?<section className="real-ops-subpanel e3-purchases-receive-surface">
       <div className="e3-purchases-form-section-head">
         <h2>Full purchase reception {selected.reference||selected.id.slice(0,8)}</h2>
         <p>The reception is confirmed at one time, in a single office. No change of quantities can be made here.</p>
       </div>
       <div className="e3-purchases-receive-summary" aria-label="Summary of purchase to receive">
         <div><span>Supplier</span><strong>{selected.supplier_name_snapshot||'No supplier'}</strong></div>
         <div><span>Date of purchase</span><strong>{selected.purchased_on}</strong></div>
         <div><span>Recorded amount</span><strong>{money(selected.total_cents)}</strong></div>
         <div><span>Renglones</span><strong>{selected.lines.length}</strong></div>
       </div>
       <h3>Documented articles</h3>
       <ul className="e3-purchases-receive-lines">{selected.lines.map(line=><li key={line.id}>
         <span>{line.description_snapshot}</span>
         <strong>{milliToDecimal(line.quantity_milli)} {line.unit_snapshot}</strong>
         {line.catalog_item_id===null&&<small>Concept: does not generate physical stock</small>}
       </li>)}</ul>
       <p className="e3-purchases-safety-note">Confirming this receipt can increase inventory balances. The operation is sent once per key and requires explicit confirmation.</p>
       <label className="real-supply-label">Destination with active storage
         <select disabled={busy||!!pendingReceipt} value={locationId} onChange={e=>setLocationId(e.target.value)}>
           <option value="">Select Headquarters</option>
           {activeSites.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
         </select>
       </label>
       {activeSites.length===0&&<p className="real-ops-warning">No active locations enabled for inventory. Check Locations before confirming.</p>}
       {pendingReceipt&&<p className="real-ops-warning">Recuperated pending reception with your original key. Check first if it was confirmed before repeating. Back to list does not remove that IndexedDB key.</p>}
       <div className="real-auth-actions e3-purchases-receive-actions">
         <button className="real-auth-primary real-supply-confirm-action" type="button"
           disabled={busy||!canReceive||!locationId} onClick={()=>void sendReceipt()}>
           {busy?'Procesando…':pendingReceipt?'Retry Same Reception':'Confirm Real Reception'}</button>
         <button className="real-auth-secondary" type="button" disabled={busy} onClick={()=>void checkReceipt()}>Check voucher</button>
         <button className="real-auth-secondary" type="button" disabled={busy||loading} onClick={closeReceiptSubview}>Back to shopping</button>
       </div>
     </section>:<div className="real-business-empty">Purchase is not available on the loaded pages. Return to list and update history.</div>}
   </section>}
   {view==='detail'&&shownReceipt&&<section className="e3-purchases-receipt-view" aria-label="Proof screen">
     <header className="e3-purchases-heading e3-purchases-form-heading">
       <span className="e3-purchases-heading-icon"><Icon name="receipt" size={27}/></span>
       <div className="e3-purchases-heading-copy">
         <span className="e3-purchases-kicker">{business?.name??'Company'} · Recepciones</span>
         <h1>Receipt check</h1>
         <p>{detailPurchase?.reference||'Purchase '+shownReceipt.purchase_id.slice(0,8)} · Internal registration confirmed.</p>
       </div>
     </header>
     <div className="e3-purchases-receipt-surface">
       <RealReceiptDetail receipt={shownReceipt} purchase={detailPurchase}
         locations={locations} viewer={{id:userId,displayName:userDisplayName}}
         actors={business&&canReadTeam(business)&&teamActors?.businessId===businessId?teamActors.people:[]}
         onClose={closeReceiptSubview}/>
     </div>
   </section>}
   {view==='form'&&canWrite&&<section className="e3-purchases-form-view">
     <header className="e3-purchases-heading e3-purchases-form-heading">
       <span className="e3-purchases-heading-icon"><Icon name="shopping" size={27}/></span>
       <div className="e3-purchases-heading-copy">
         <span className="e3-purchases-kicker">{business?.name??'Company'} · Compras</span>
         <h1>{pending?'Recovery of outstanding procurement':'New purchase'}</h1>
         <p>Select supplier, date and lines. Stock is only recorded upon confirmation of receipt.</p>
       </div>
     </header>
     <form className="real-auth-form real-ops-form e3-purchases-editor" onSubmit={e=>void savePurchase(e)}>
     <div className="e3-purchases-form-section-head">
       <h2>Purchase details</h2>
       <p>The identity of each purchase and its lines is stored in IndexedDB before POST. It does not save tokens; commercial data are not encrypted. Avoid shared devices.</p>
     </div>
     <fieldset className="real-intent-fields" disabled={busy||!!pending||!journalReady}>
       <label>Date of purchase<input type="date" required value={draft.date} onChange={e=>setDraft(old=>({...old,date:e.target.value}))}/></label>
       <label>Provider (optional)
         <select value={draft.supplierId} onChange={e=>setDraft(old=>({...old,supplierId:e.target.value}))}>
           <option value="">No supplier</option>{activeSuppliers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
         </select>
       </label>
       {suppliersMore&&<p>There are still unladen suppliers. Load more pages before choosing one.</p>}
       <label>Referencia<input maxLength={70} value={draft.reference} onChange={e=>setDraft(old=>({...old,reference:e.target.value}))}/></label>
       <label>Notes<textarea rows={2} maxLength={500} value={draft.notes} onChange={e=>setDraft(old=>({...old,notes:e.target.value}))}/></label>
       {draft.lines.map((line,i)=>{const selectedArticle=activeItems.find(x=>x.id===line.catalogId);const calculatedLineTotal=previewLineTotalCents(line.quantity,line.unitCost);return <div className="real-supply-line" key={i}>
         <strong>Line {i+1}</strong>
         <label>Catalogue article or free concept
           <select value={line.catalogId} onChange={e=>{const selected=activeItems.find(x=>x.id===e.target.value);changeLine(i,{catalogId:e.target.value,unitCost:suggestedUnitCost(selected),totalDraft:null})}}>
             <option value="concept">Free concept (no stock generated)</option>
             {activeItems.map(x=><option key={x.id} value={x.id}>{x.name} · {x.unit}</option>)}
           </select>
         </label>
         {line.catalogId==='concept'&&<label>Description<input required minLength={2} maxLength={140} value={line.description} onChange={e=>changeLine(i,{description:e.target.value})}/></label>}
         <div className="real-supply-amounts">
           <label>Amount (up to 3 decimal places)
             <input required inputMode="decimal" value={line.quantity} disabled={line.totalDraft!==null}
               onChange={e=>changeLine(i,{quantity:e.target.value})}/>
           </label>
           <label>Unit cost ($)
             <input required inputMode="decimal" value={line.unitCost} disabled={line.totalDraft!==null}
               onChange={e=>changeLine(i,{unitCost:e.target.value})}/>
           </label>
           <div className="real-supply-total-field">
             <label htmlFor={'real-line-total-'+i}>Total cost ($)</label>
             <div className="real-supply-total-control">
               <input id={'real-line-total-'+i} inputMode="decimal" aria-label={'Total cost of line '+(i+1)}
                 value={line.totalDraft??(calculatedLineTotal===null?'':centsToPesos(calculatedLineTotal))}
                 readOnly={line.totalDraft===null} aria-readonly={line.totalDraft===null}
                 onChange={e=>changeLine(i,{totalDraft:e.target.value})}
                 placeholder={calculatedLineTotal===null?'Complete quantity and cost':'0,00'}/>
               {line.totalDraft===null&&<button type="button" className="real-supply-total-edit"
                 disabled={busy||!journalReady||calculatedLineTotal===null}
                 aria-label={'Edit total line cost '+(i+1)}
                 title="Edit Total Cost" onClick={()=>changeLine(i,{totalDraft:centsToPesos(calculatedLineTotal)})}>Edit</button>}
             </div>
           </div>
         </div>
         {line.totalDraft!==null&&<div className="real-supply-total-actions">
           <span>To modify the total, the unit cost will be recalculated only if the cents exactly match.</span>
           <button type="button" className="real-auth-secondary" onClick={()=>applyLineTotal(i)}>Apply Total</button>
           <button type="button" className="real-auth-secondary" onClick={()=>changeLine(i,{totalDraft:null})}>Cancel</button>
         </div>}
         {selectedArticle&&<p className="real-supply-cost-hint">Catalogue reference cost: <strong>{selectedArticle.reference_cost_cents===null?'unreported':money(selectedArticle.reference_cost_cents)}</strong>. Se propone al seleccionar el artículo, pero podés editarlo según el comprobante del proveedor. No se modifica el costo de referencia del catálogo.</p>}
         {selectedArticle&&costExceedsSalePrice(line.unitCost,selectedArticle)&&<p className="real-supply-cost-warning" role="status">Attention: the unit cost of purchase exceeds the current sales price of the catalogue ({selectedArticle.price_cents===null?'no informado':money(selectedArticle.price_cents)}). Check the margin; you can continue with the purchase.</p>}
         {draft.lines.length>1&&<button type="button" className="real-auth-secondary" onClick={()=>setDraft(old=>({...old,lines:old.lines.filter((_,j)=>j!==i)}))}>Remove Line</button>}
       </div>})}
       <button type="button" className="real-auth-secondary" disabled={draft.lines.length>=30} onClick={()=>setDraft(old=>({...old,lines:[...old.lines,emptyLine()]}))}>Add Line</button>
       <div className="real-supply-grand-total" aria-live="polite">
         <span>Total purchase</span>
         <strong>{totalPreview===null?'Completes valid amounts':money(totalPreview)}</strong>
       </div>
     </fieldset>
     {pending&&<p className="real-ops-warning">The original body was locked. First check the history and then try again with the same key. F5 does not send anything automatically.</p>}
     {!pending&&<label className="real-ops-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I agree to temporarily save the data of this purchase in this browser.</label>}
     <p className="e3-purchases-register-explainer">When registering the purchase, it will be pending receipt. To incorporate goods into the inventory, then confirm the receipt at an enabled headquarters. This step does not modify the stock.</p>
     <div className="real-auth-actions">
       <button type="submit" className="real-auth-primary" disabled={busy||!journalReady||draft.lines.some(x=>x.totalDraft!==null)||(!pending&&!consent)}>{busy?'Procesando…':pending?'Retrying Same Purchase':'Register purchase'}</button>
       {pending&&<button type="button" className="real-auth-secondary" disabled={busy} onClick={()=>void discardPurchase()}>Discard after verification</button>}
       <button type="button" className="real-auth-secondary" disabled={busy||!!pending} onClick={closePurchaseForm}>Cancel</button>
     </div>
   </form></section>}
   {view==='form'&&catalogMore&&<button type="button" className="real-auth-secondary" disabled={busy||loading} onClick={()=>void more('catalog')}>Load 100 more items for purchase</button>}
   {view==='form'&&suppliersMore&&<button type="button" className="real-auth-secondary" disabled={busy||loading} onClick={()=>void more('suppliers')}>Load 100 more suppliers</button>}
   {notice&&<p className="real-auth-message" role="status">{notice}</p>}
   {error&&<p className="real-auth-message real-auth-error" role="alert">{error}</p>}
 </section>
}
