import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon.tsx'
import { RealPhotoManager, RealPhotoPreview } from '../photos/RealPhotos.tsx'
import { RealPhotoDraftPicker } from '../photos/RealPhotoDraftPicker.tsx'
import { createPhotoGateway, photoErrorMessage } from '../photos/photoGateway.ts'
import '../catalog/realCatalogVisual.css'
import { ApiHttpError, ApiTransportError } from '../../api/httpClient.ts'
import { createOperationsGateway } from '../businesses/realOperationsGateway.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import { createSupplyGateway, SUPPLY_PAGE_SIZE, supplyErrorMessage, newSupplierCommercialDraft, validateSupplierCommercialDraft, SUPPLIER_PAYMENT_METHODS, SUPPLIER_PAYMENT_LABELS, SUPPLIER_WEEKDAYS } from '../purchases/realSupplyGateway.ts'
import type { Supplier, SupplierCommercialDraft, SupplierPromotionRule, SupplierPaymentMethod } from '../purchases/realSupplyGateway.ts'
type Props={token:string;userId:string;businessId:string;onNavigate:(route:string)=>void;onUnauthorized:()=>void}
export function RealSuppliersPage({token,userId,businessId,onNavigate,onUnauthorized}:Props){
 const gateway=useMemo(()=>createSupplyGateway(token,businessId),[token,businessId])
 const companies=useMemo(()=>createOperationsGateway(token,userId),[token,userId])
 const alive=useRef(true)
 const backRef=useRef<HTMLButtonElement>(null)
 const listRef=useRef<HTMLHeadingElement>(null)
 const previousView=useRef<'list'|'form'|'detail'>('list')
 const [business,setBusiness]=useState<RealBusiness|null>(null)
 const [items,setItems]=useState<Supplier[]>([])
 const [hasMore,setHasMore]=useState(false)
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [notice,setNotice]=useState('')
 const [draft,setDraft]=useState<SupplierCommercialDraft>(newSupplierCommercialDraft)
 const [editingId,setEditingId]=useState<string|null>(null)
 const [createPhoto,setCreatePhoto]=useState<File[]>([])
 const [sameWhatsapp,setSameWhatsapp]=useState(false)
 const [unknown,setUnknown]=useState(false)
 const [creating,setCreating]=useState(false)
 const [detailId,setDetailId]=useState<string|null>(null)
 const [filter,setFilter]=useState('')
 const [statusFilter,setStatusFilter]=useState<'TODOS'|'ACTIVO'|'INACTIVO'>('TODOS')
 useEffect(()=>{
   const ctrl=new AbortController();alive.current=true
   void Promise.all([companies.business(businessId,ctrl.signal),gateway.suppliers(0,SUPPLY_PAGE_SIZE,ctrl.signal)])
     .then(([company,rows])=>{if(!ctrl.signal.aborted&&alive.current){
       setBusiness(company);setItems(rows);setHasMore(rows.length===SUPPLY_PAGE_SIZE)
     }}).catch(err=>{
       if(ctrl.signal.aborted||!alive.current)return
       if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
       else setError(supplyErrorMessage(err))
     }).finally(()=>{if(!ctrl.signal.aborted&&alive.current)setLoading(false)})
   return ()=>{ctrl.abort();alive.current=false}
 },[gateway,companies,businessId,onUnauthorized])
 const canWrite=business?.status==='ACTIVA'&&business.membership.status==='ACTIVA'
   &&['TITULAR_ADMINISTRATIVO','ADMINISTRADOR'].includes(business.membership.role)
 function fail(err:unknown,writing=false){
   if(!alive.current)return
   if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
   if(writing&&(err instanceof ApiTransportError||(err instanceof ApiHttpError&&err.status>=500)))setUnknown(true)
   setError(supplyErrorMessage(err))
 }
 async function reload(){
   if(busy||loading)return
   setLoading(true);setError('');setNotice('')
   try{
     const rows=await gateway.suppliers()
     if(!alive.current)return
     setItems(rows);setHasMore(rows.length===SUPPLY_PAGE_SIZE);setUnknown(false)
   }catch(err){fail(err)}finally{if(alive.current)setLoading(false)}
 }
 async function more(){
   if(busy||loading||!hasMore)return
   setLoading(true);setError('')
   try{
     const rows=await gateway.suppliers(items.length)
     if(!alive.current)return
     if(rows.some(x=>items.some(y=>y.id===x.id))){setHasMore(false);setError('The list changed. Update before loading more suppliers.');return}
     setItems(old=>[...old,...rows]);setHasMore(rows.length===SUPPLY_PAGE_SIZE)
   }catch(err){fail(err)}finally{if(alive.current)setLoading(false)}
 }
 async function save(e:FormEvent<HTMLFormElement>){
   e.preventDefault()
   if(!canWrite||busy||unknown)return
   setError('');setNotice('')
   let payload:SupplierCommercialDraft
   try {payload=validateSupplierCommercialDraft(draft)}
   catch(err){setError(err instanceof Error?err.message:'Check the supplier\'s data.');return}
   setBusy(true)
   let saved:Supplier
   try {
     saved=editingId
       ?await gateway.updateSupplierCommercial(editingId,payload)
       :await gateway.createSupplierCommercial(payload)
   }catch(err){
     fail(err,true)
     if(alive.current)setBusy(false)
     return
   }
   if(!alive.current)return
   let photoIssue=''
   if(!editingId&&createPhoto.length){
     try{
       await createPhotoGateway(token,{kind:'SUPPLIER',businessId,resourceId:saved.id}).upload(createPhoto[0])
     }catch(err){
       photoIssue='Saved provider, but could not confirm photo: '+photoErrorMessage(err)+
         ' Check the tab before you try again.'
     }
   }
   if(!alive.current)return
   setCreating(false);setEditingId(null);setCreatePhoto([]);setDetailId(null)
   setSameWhatsapp(false);setDraft(newSupplierCommercialDraft())
   setItems(old=>[saved,...old.filter(x=>x.id!==saved.id)])
   // Una carga fotográfica parcial requiere un único aviso claro.
   setNotice(photoIssue?'':editingId?'Supplier changes confirmed in PostgreSQL.':'Supplier registered with PostgreSQL. No purchase was made.')
   if(photoIssue)setError(photoIssue)
   // La escritura ya está confirmada: fallar el GET posterior NO autoriza reintentar POST/PATCH.
   try{
     const rows=await gateway.suppliers()
     if(!alive.current)return
     setItems(rows.some(x=>x.id===saved.id)?rows:[saved,...rows]);setHasMore(rows.length===SUPPLY_PAGE_SIZE)
   }catch{
     if(alive.current){
       setNotice('')
       setError((photoIssue?photoIssue+' ':'')+
         'The provider is saved, but the list could not be updated. Please consult the tab; do not repeat the registration.')
     }
   }finally{if(alive.current)setBusy(false)}
 }
 async function status(s:Supplier){
   if(!canWrite||busy||unknown)return
   const next=s.status==='ACTIVO'?'INACTIVO':'ACTIVO'
   if(!window.confirm((next==='ACTIVO'?'Reactivar':'Desactivar')+' supplier \''+s.name+'»?'))return
   setBusy(true);setError('');setNotice('')
   try{
     const result=await gateway.changeSupplier(s.id,next)
     if(!alive.current)return
     setItems(old=>old.map(x=>x.id===result.id?result:x))
     setNotice('Confirmed status on server.')
   }catch(err){fail(err,true)}finally{if(alive.current)setBusy(false)}
 }

 const visible=items.filter(x=>(statusFilter==='TODOS'||x.status===statusFilter)
   &&[x.name,x.offerings,x.contact_person,x.email].some(value=>value.toLocaleLowerCase('es-AR').includes(filter.trim().toLocaleLowerCase('es-AR'))))
 const detail=items.find(x=>x.id===detailId)
 const view:'list'|'form'|'detail'=creating?'form':detail?'detail':'list'
 const activeCount=items.filter(x=>x.status==='ACTIVO').length
 function startCreate(){
   if(!canWrite||busy||unknown)return
   setDraft(newSupplierCommercialDraft());setCreatePhoto([]);setSameWhatsapp(false);setEditingId(null)
   setCreating(true);setDetailId(null);setError('');setNotice('')
 }
 function startEdit(supplier:Supplier){
   if(!canWrite||busy||unknown)return
   setDraft({
     name:supplier.name,offerings:supplier.offerings,contact_person:supplier.contact_person,
     phone:supplier.phone,whatsapp:supplier.whatsapp,email:supplier.email,
     address:supplier.address,maps_url:supplier.maps_url,website:supplier.website,
     instagram:supplier.instagram,notes:supplier.notes,
     payment_methods:[...supplier.payment_methods] as SupplierPaymentMethod[],
     promotions:supplier.promotions.map(rule=>({...rule,days:[...rule.days]})),
   })
   setSameWhatsapp(false);setCreatePhoto([]);setEditingId(supplier.id);setDetailId(null)
   setCreating(true);setError('');setNotice('')
 }
 function openDetail(supplier:Supplier){
   setDetailId(supplier.id);setCreating(false);setEditingId(null);setError('');setNotice('')
 }
 function closeSubview(){
   if(busy)return
   setCreating(false);setEditingId(null);setDetailId(null)
   setSameWhatsapp(false);setCreatePhoto([]);setDraft(newSupplierCommercialDraft());setError('')
 }
 const setField=<K extends keyof SupplierCommercialDraft>(key:K,value:SupplierCommercialDraft[K])=>
   setDraft(old=>({...old,[key]:value}))
 function togglePayment(payment:SupplierPaymentMethod,checked:boolean){
   setDraft(old=>({
     ...old,payment_methods:checked
       ?[...old.payment_methods.filter(p=>p!==payment),payment]
       :old.payment_methods.filter(p=>p!==payment),
   }))
 }
 function addPromotion(){
   if(draft.promotions.length>=8)return
   setDraft(old=>({...old,promotions:[...old.promotions,{
     id:crypto.randomUUID(),days:[],payment_method:null,benefit:'',
   }]}))
 }
 function updatePromotion(id:string,update:Partial<SupplierPromotionRule>){
   setDraft(old=>({...old,promotions:old.promotions.map(rule=>
     rule.id===id?{...rule,...update}:rule)}))
 }
 function removePromotion(id:string){
   setDraft(old=>({...old,promotions:old.promotions.filter(rule=>rule.id!==id)}))
 }
 function toggleWeekday(rule:SupplierPromotionRule,day:number,checked:boolean){
   const days=checked?[...rule.days,day]:rule.days.filter(d=>d!==day)
   updatePromotion(rule.id,{days:days.sort((a,b)=>a-b)})
 }
 const addressSearchUrl=draft.address.trim()
   ?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(draft.address.trim()):null
 useEffect(()=>{
   if(previousView.current===view)return
   if(view==='list')listRef.current?.focus()
   else backRef.current?.focus()
   previousView.current=view
 },[view])
 return <section className="real-auth-card real-business-panel e3-commerce-page e3-suppliers-page">
   {view==='list'&&<nav className="real-business-nav" aria-label="Company navigation">
     <button type="button" className="real-auth-link" onClick={()=>onNavigate('/real/empresas/'+businessId)}>Company</button>
     <button type="button" className="real-auth-link" onClick={()=>onNavigate('/real/empresas/'+businessId+'/compras')}>Purchases and receptions</button>
     <button type="button" className="real-auth-link" onClick={()=>onNavigate('/real/empresas')}>My companies</button>
   </nav>}
   {view!=='list'&&<div className="e3-commerce-backbar">
     <button type="button" ref={backRef} className="e3-commerce-back" disabled={busy} onClick={closeSubview}>
       <Icon name="arrow-left" size={18}/>Return to suppliers
     </button>
     <span className="e3-commerce-view-label">{view==='form'?(editingId?'Provider Editing':'Supplier High'):'Supplier file'}</span>
   </div>}
   <header className="e3-commerce-heading">
     <span className="e3-commerce-heading-icon"><Icon name="briefcase" size={28}/></span>
     <div className="e3-commerce-heading-copy">
       <span className="e3-commerce-eyebrow">{business?.name??'Company'} · Comercial</span>
       {view==='list'?<h1 tabIndex={-1} ref={listRef}>Suppliers</h1>
         :<h1>{view==='form'?(editingId?'Edit Provider':'New supplier'):'Supplier data'}</h1>}
       <p>{view==='list'?'Organize your company\'s suppliers.':view==='form'?(editingId?'Update the commercial information of this company.':'Register a provider using the REAL API.'):detail?.name??'Selected provider'}</p>
     </div>
     {view==='list'&&canWrite&&<button type="button" className="real-auth-primary e3-commerce-top-action" disabled={busy||unknown||loading} onClick={startCreate}>
       <Icon name="plus" size={18}/>Add REAL Provider
     </button>}
   </header>
   {unknown&&<div className="real-auth-message real-ops-warning" role="alert">
     The write response was lost. As suppliers have no replay key, check the list BEFORE you repeat.
     <button className="real-auth-link" type="button" onClick={()=>void reload()}>Consulting suppliers</button>
   </div>}
   {notice&&<p className="real-auth-message" role="status">{notice}</p>}
   {error&&<p className="real-auth-message real-auth-error" role="alert">{error}</p>}
   {loading&&<p role="status">Checking suppliers...</p>}
   {view==='list'&&<>
     <div className="e3-commerce-toolbar"><span>Empresa: <strong>{business?.name??'Unverified'}</strong></span>
       <button type="button" className="real-auth-secondary" disabled={loading||busy} onClick={()=>void reload()}>Actualizar</button>
     </div>
     {!loading&&<>
       <div className="e3-commerce-stats" aria-label="Summary of loaded suppliers">
         <div><span>Loaded Suppliers</span><strong>{items.length}</strong></div>
         <div><span>Loaded assets</span><strong>{activeCount}</strong></div>
         <div><span>Inactive loaded</span><strong>{items.length-activeCount}</strong></div>
       </div>
       <p className="real-catalog-coverage" role="status">{items.length} {items.length===1?'loaded supplier':'loaded suppliers'}.
         {hasMore?' There are other possible pages; search and counters only include those loaded.':' The last page was consulted.'}
       </p>
       <div className="e3-commerce-filters">
         <label className="e3-commerce-search"><Icon name="search" size={18}/><span className="e3-sr-only">Search between loaded suppliers</span>
           <input type="search" aria-label="Search between loaded suppliers" placeholder="Search by name, contact or heading" value={filter} onChange={e=>setFilter(e.target.value)}/></label>
         <label>Status<select aria-label="Filtering suppliers by status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as typeof statusFilter)}>
           <option value="TODOS">All</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option>
         </select></label>
       </div>
       {items.length===0&&<div className="real-business-empty e3-commerce-empty"><strong>No suppliers yet</strong><p>Add your first provider to select it when registering a purchase.</p></div>}
       {items.length>0&&visible.length===0&&<div className="real-business-empty e3-commerce-empty"><strong>No matches between loaded suppliers</strong><p>Try another term or load the pending pages.</p></div>}
       <div className="real-business-grid e3-commerce-grid">
         {visible.map(supplier=><article key={supplier.id} className="real-business-tile real-ops-tile e3-supplier-tile">
           <div className="e3-commerce-card-top"><span className="e3-commerce-card-icon"><Icon name="briefcase" size={22}/></span>
             <span className={'real-catalog-status '+(supplier.status==='ACTIVO'?'real-catalog-active':'')}>{supplier.status}</span>
           </div>
           <RealPhotoPreview token={token} owner={{kind:'SUPPLIER',businessId,resourceId:supplier.id}} alt={"Foto de "+supplier.name} className="e3-supplier-photo"/>
           <strong>{supplier.name}</strong>
           <p className="e3-supplier-offerings">{supplier.offerings||'No products or services informed'}</p>
           <div className="e3-supplier-compact-fields">
             {supplier.contact_person&&<span><Icon name="user" size={15}/>{supplier.contact_person}</span>}
             {supplier.email&&<span><Icon name="user" size={15}/>{supplier.email}</span>}
             {supplier.phone&&<span><Icon name="credit" size={15}/>{supplier.phone}</span>}
           </div>
           <div className="real-auth-actions e3-commerce-card-actions">
             <button type="button" className="real-auth-secondary" onClick={()=>openDetail(supplier)}>Ver ficha</button>
             {canWrite&&<button type="button" className="real-auth-secondary" disabled={busy||unknown}
               onClick={()=>startEdit(supplier)}>Edit</button>}
             {canWrite&&<button type="button" className="real-auth-secondary" disabled={busy||unknown}
               onClick={()=>void status(supplier)}>{supplier.status==='ACTIVO'?'Desactivar':'Reactivar'}</button>}
           </div>
         </article>)}
       </div>
       {hasMore&&<button type="button" className="real-auth-secondary e3-commerce-loadmore" disabled={loading||busy} onClick={()=>void more()}>Load 100 other suppliers</button>}
       {!canWrite&&<p className="real-auth-note">Your role allows you to consult suppliers, but not create them or change their status.</p>}
     </>}
   </>}
   {view==='detail'&&detail&&<section className="e3-commerce-subsurface" aria-label="Supplier details">
     <div className="e3-commerce-detail-heading"><span className="e3-commerce-card-icon"><Icon name="briefcase" size={24}/></span>
       <div><h2>{detail.name}</h2><p>Supplier registered with this company</p></div>
       <span className={'real-catalog-status '+(detail.status==='ACTIVO'?'real-catalog-active':'')}>{detail.status}</span>
     </div>
     <dl className="e3-commerce-fact-grid">
       <div><dt>Contacto</dt><dd>{detail.contact_person||'No informado'}</dd></div>
       <div><dt>Phone</dt><dd>{detail.phone||'No informado'}</dd></div>
       <div><dt>WhatsApp</dt><dd>{detail.whatsapp||'No informado'}</dd></div>
       <div><dt>Correo</dt><dd>{detail.email||'No informado'}</dd></div>
       <div><dt>Address</dt><dd>{detail.address||'No informada'}</dd></div>
       <div><dt>Website</dt><dd>{detail.website||'No informada'}</dd></div>
       <div><dt>Instagram</dt><dd>{detail.instagram||'No informado'}</dd></div>
       <div><dt>Google Maps</dt><dd>{detail.maps_url||'No informado'}</dd></div>
     </dl>
     <div className="e3-commerce-note-grid">
       <div><h3>What it offers</h3><p>{detail.offerings||'No recorded information.'}</p></div>
       <div><h3>Notes</h3><p>{detail.notes||'No observations recorded.'}</p></div>
     </div>
     <RealPhotoManager token={token} owner={{kind:'SUPPLIER',businessId,resourceId:detail.id}} title={"Foto de "+detail.name} canManage={canWrite} onUnauthorized={onUnauthorized}/>
     <section className="e3-supplier-payments" aria-label="Supplier's commercial conditions">
       <h3>Accepted means of payment (information)</h3>
       {detail.payment_methods.length>0
         ?<div className="e3-commerce-chips">{detail.payment_methods.map((method,i)=><span key={method+i}>{SUPPLIER_PAYMENT_LABELS[method as SupplierPaymentMethod]??method}</span>)}</div>
         :<p className="e3-supplier-empty-note">No means of payment were reported.</p>}
       <h3 className="e3-supplier-promotions-title">Informed promotions</h3>
       {detail.promotions.length===0&&<p className="e3-supplier-empty-note">No informed promotions.</p>}
       {detail.promotions.map((rule,i)=><article className="e3-supplier-promotion-summary" key={rule.id}>
         <strong>Advocacy {i+1}: {rule.benefit}</strong>
         <span>Days: {rule.days.length?rule.days.map(day=>SUPPLIER_WEEKDAYS[day]).join(' · '):'No specific days (any day)'}</span>
         <span>Mean required: {rule.payment_method?SUPPLIER_PAYMENT_LABELS[rule.payment_method]:'None specific'}</span>
       </article>)}
     </section>
     {canWrite&&<div className="real-auth-actions e3-supplier-detail-actions">
       <button className="real-auth-primary" type="button" disabled={busy||unknown} onClick={()=>startEdit(detail)}>
         <Icon name="user" size={17}/>Edit Provider</button>
     </div>}
     <p className="e3-commerce-disclaimer">Payment means and promotions are informational data of the provider; they do not automatically apply to Purchases or constitute actual collections.</p>
   </section>}
   {view==='form'&&canWrite&&<section className="e3-commerce-subsurface e3-commerce-form-screen e3-supplier-contact-editor" aria-label="Provider Form">
     <div className="e3-commerce-section-head">
       <h2>{editingId?'Edit Provider Data':'Register provider data'}</h2>
       <p>Only the trade name is required. Information is only stored within {business?.name??'the selected company'}.</p>
     </div>
     <form className="real-auth-form real-ops-form e3-commerce-form" onSubmit={e=>void save(e)}>
       <fieldset className="e3-supplier-form-section">
         <legend>1. Commercial identification</legend>
         <div className="e3-commerce-form-grid">
           <label>Trade name *<input required minLength={2} maxLength={90} autoComplete="organization"
             value={draft.name} onChange={e=>setField('name',e.target.value)} placeholder="E.g.: South Distributor"/></label>
           <label>Contact person (optional)<input maxLength={100} autoComplete="off"
             value={draft.contact_person} onChange={e=>setField('contact_person',e.target.value)} placeholder="E.g.: Commercial Officer"/></label>
           <label className="e3-commerce-span-all">Products or services offered (optional)
             <input maxLength={240} value={draft.offerings} onChange={e=>setField('offerings',e.target.value)}
               placeholder="E.g.: Food, packaging, logistics..."/></label>
         </div>
       </fieldset>
       <fieldset className="e3-supplier-form-section">
         <legend>2. Contact and location</legend>
         <div className="e3-commerce-form-grid">
           <label>Commercial telephone (optional)<input type="tel" maxLength={35} inputMode="tel"
             value={draft.phone} onChange={e=>setDraft(old=>({...old,phone:e.target.value,
               ...(sameWhatsapp?{whatsapp:e.target.value}:{} )}))} placeholder="+5491112345678"/></label>
           <div className="e3-supplier-whatsapp-control">
             <label htmlFor="real-supplier-whatsapp">WhatsApp (with international prefix)</label>
             <input id="real-supplier-whatsapp" type="tel" maxLength={35} inputMode="tel"
               value={draft.whatsapp} disabled={sameWhatsapp} onChange={e=>setField('whatsapp',e.target.value)} placeholder="+5491112345678"/>
             <label className="e3-supplier-same-phone">
               <input type="checkbox" checked={sameWhatsapp} onChange={e=>{
                 setSameWhatsapp(e.target.checked)
                 if(e.target.checked)setField('whatsapp',draft.phone)
               }}/>Use the commercial phone
             </label>
           </div>
           <label>E-mail (optional)<input type="email" maxLength={120} autoComplete="off"
             value={draft.email} onChange={e=>setField('email',e.target.value)} placeholder="ventas@proveedor.com"/></label>
           <label>Address or reference (optional)<input maxLength={160} autoComplete="street-address"
             value={draft.address} onChange={e=>setField('address',e.target.value)} placeholder="E.g.: Av. Principal 123"/></label>
           <div className="e3-supplier-link-field">
             <label htmlFor="real-supplier-maps-url">Google Maps (Including HTTPS, optional)</label>
             <input id="real-supplier-maps-url" type="url" maxLength={2048}
               value={draft.maps_url} onChange={e=>setField('maps_url',e.target.value)} placeholder="https://maps.app.goo.gl/…"/>
             {addressSearchUrl&&<a className="e3-supplier-map-search" href={addressSearchUrl} target="_blank" rel="noopener noreferrer">
               Search this address in Google Maps <span>(does not check the exact point)</span>
             </a>}
           </div>
           <label>Website / digital catalog (HTTPS, optional)<input type="url" maxLength={2048}
             value={draft.website} onChange={e=>setField('website',e.target.value)} placeholder="https://ejemplo.com"/></label>
           <label>Instagram (user, optional)<input maxLength={31}
             value={draft.instagram} onChange={e=>setField('instagram',e.target.value)} placeholder="@empresa"/></label>
         </div>
       </fieldset>
       <fieldset className="e3-supplier-form-section e3-supplier-payment-section">
         <legend>3. Accepted means of payment (information)</legend>
         <p className="e3-supplier-section-help">Register the means that the provider declares to accept. They do not connect accounts of collection or create payments.</p>
         <div className="e3-supplier-payment-options" aria-label="Accepted means of payment">
           {SUPPLIER_PAYMENT_METHODS.map(method=><label className="e3-supplier-option" key={method}>
             <input type="checkbox" checked={draft.payment_methods.includes(method)}
               onChange={e=>togglePayment(method,e.target.checked)}/>
             {SUPPLIER_PAYMENT_LABELS[method]}
           </label>)}
         </div>
       </fieldset>
       <fieldset className="e3-supplier-form-section e3-supplier-promotions-section">
         <legend>4. Promotions and days available</legend>
         <p className="e3-supplier-section-help">Each promotion can be limited to days of the week and a means of payment. These are informed conditions, without automatic discount on Purchases.</p>
         <button type="button" className="real-auth-secondary e3-supplier-add-promo"
           onClick={addPromotion} disabled={draft.promotions.length>=8||busy}>
           <Icon name="plus" size={16}/>Add Promotion
         </button>
         {draft.promotions.length===0&&<p className="e3-supplier-empty-note">This provider still has no informed promotions.</p>}
         {draft.promotions.map((rule,i)=><div className="e3-supplier-promo-editor" key={rule.id}>
           <div className="e3-supplier-promo-top">
             <strong>Advocacy {i+1}</strong>
             <button type="button" className="e3-supplier-remove-promo" onClick={()=>removePromotion(rule.id)} disabled={busy}>Remove promotion {i+1}</button>
           </div>
           <fieldset className="e3-supplier-days-fieldset">
             <legend>Days of the week available</legend>
             <div className="e3-supplier-day-options">
               {SUPPLIER_WEEKDAYS.map((day,dayIndex)=><label className="e3-supplier-day" key={day}>
                 <input type="checkbox" aria-label={day+' Promotion '+(i+1)}
                   checked={rule.days.includes(dayIndex)}
                   onChange={e=>toggleWeekday(rule,dayIndex,e.target.checked)}/>
                 {day.slice(0,2)}
               </label>)}
             </div>
             <p className="e3-supplier-day-note">{rule.days.length
               ?'Only the selected days are registered for this promotion.'
               :'No specific days: the benefit is reported without limiting it to days.'}</p>
           </fieldset>
           <div className="e3-commerce-form-grid">
             <label>Means of promotion required {i+1} (opcional)
               <select value={rule.payment_method??''}
                 onChange={e=>updatePromotion(rule.id,{payment_method:e.target.value?e.target.value as SupplierPaymentMethod:null})}>
                 <option value="">No specific medium</option>
                 {SUPPLIER_PAYMENT_METHODS.map(method=><option key={method} value={method}>{SUPPLIER_PAYMENT_LABELS[method]}</option>)}
               </select>
             </label>
             <label>Promotional benefits {i+1} *
               <input required minLength={3} maxLength={160} value={rule.benefit}
                 placeholder="Ej.: 10% de reintegro, tope $25.000"
                 onChange={e=>updatePromotion(rule.id,{benefit:e.target.value})}/>
             </label>
           </div>
         </div>)}
       </fieldset>
       <fieldset className="e3-supplier-form-section">
         <legend>5. Commercial observations</legend>
         <label>Notes (optional)<textarea rows={4} maxLength={650} value={draft.notes}
           onChange={e=>setField('notes',e.target.value)} placeholder="E.g.: Delivery times, order and withdrawal conditions..."/></label>
       </fieldset>
       {!editingId&&<RealPhotoDraftPicker title="Photo of the new supplier" files={createPhoto}
         onChange={setCreatePhoto} maximum={1} disabled={busy}/>}
       <div className="real-auth-actions e3-commerce-form-actions">
         <button className="real-auth-primary" type="submit" disabled={busy||unknown}>{busy?'Guardando…':editingId?'Guardar cambios':'Create Provider'}</button>
         <button className="real-auth-secondary" type="button" disabled={busy} onClick={closeSubview}>Cancel</button>
       </div>
     </form>
     {editingId&&<RealPhotoManager token={token} owner={{kind:'SUPPLIER',businessId,resourceId:editingId}}
       title="Photo of the supplier (edit)" canManage={canWrite} onUnauthorized={onUnauthorized}/>}
     <p className="e3-commerce-disclaimer">The days of each promotion, the means required and the benefit are stored as commercial information. No discounts apply, no payments are processed or inventory movements are generated.</p>
   </section>}
 </section>
}
