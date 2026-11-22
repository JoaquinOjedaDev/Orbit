import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiHttpError } from '../../api/httpClient.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import { createOperationsGateway, operationsError } from '../businesses/realOperationsGateway.ts'
import type { LocationRecord } from '../businesses/realOperationsGateway.ts'
import { CATALOG_PAGE_SIZE, centsToPesos, createCatalogGateway, pesosToCents } from '../catalog/realCatalogGateway.ts'
import type { CatalogItem } from '../catalog/realCatalogGateway.ts'
import type { PosCartLine } from './realPosDraft.ts'
import { RealPosCheckout } from './RealPosCheckout.tsx'
import type { PosCheckoutStage } from './RealPosCheckout.tsx'
import { Icon } from '../../app/Icon.tsx'
import { RealPhotoPreview } from '../photos/RealPhotos.tsx'
import { createInventoryGateway, formatMilli, inventoryErrorMessage } from '../inventory/realInventoryGateway.ts'
import './realSalesVisual.css'
import { addOnePosCartUnit, canOverrideSalesPrice, parsePosQuantity, posLineTotalCents, posQuantityText, previewPosCart } from './realPosDraft.ts'

type Props = {
  token: string
  userId: string
  businessId: string
  onNavigate: (path: string) => void
  onUnauthorized: () => void
}

const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const money = (c: number) => ars.format(c / 100)

/**
 * T10-D: draft selection stays separate from the explicitly reviewed checkout.
 * The checkout holds/fails-closed the cart while inspecting any IndexedDB
 * pending attempt. No auto POST, no DEMO fallback.
 */
export function RealPosPage({ token, userId, businessId, onNavigate, onUnauthorized }: Props) {
  const companyApi = useMemo(() => createOperationsGateway(token, userId), [token, userId])
  const catalogApi = useMemo(() => createCatalogGateway(token, businessId), [token, businessId])
  const inventoryApi = useMemo(() => createInventoryGateway(token,businessId),[token,businessId])
  const [company, setCompany] = useState<RealBusiness | null>(null)
  const [locations, setLocations] = useState<LocationRecord[]>([])
  const [assignedLocationIds, setAssignedLocationIds] = useState<string[]>([])
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [moreError, setMoreError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [moreLoading, setMoreLoading] = useState(false)
  const loadingPage = useRef(false)
  const [search, setSearch] = useState('')
  const [siteId, setSiteId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [quantityText, setQuantityText] = useState('1')
  const [priceText, setPriceText] = useState('')
  const [priceOverride, setPriceOverride] = useState(false)
  const [discountText, setDiscountText] = useState('0')
  const [cart, setCart] = useState<PosCartLine[]>([])
  const [draftError, setDraftError] = useState('')
  const [cartNotice,setCartNotice]=useState('')
  const [stockRead,setStockRead]=useState<{
    siteId:string;itemId:string;quantityMilli:number;updatedAt:string|null
  }|null>(null)
  const [stockLoading,setStockLoading]=useState(false)
  const [stockError,setStockError]=useState('')
  const [stockRefresh,setStockRefresh]=useState(0)
  const [siteStock,setSiteStock]=useState<{
    siteId:string;balances:Record<string,number>;complete:boolean;error:string
  }|null>(null)
  const [checkoutLocked, setCheckoutLocked] = useState(true)
  const [checkoutStage,setCheckoutStage]=useState<PosCheckoutStage>('checking')
  const onCheckoutStageChange=useCallback((stage:PosCheckoutStage)=>setCheckoutStage(stage),[])
  const isDedicatedCheckout=['review','sending','pending','confirmed'].includes(checkoutStage)
  const onDraftLock = useCallback((locked: boolean) => setCheckoutLocked(locked), [])
  const onSaleConfirmed = useCallback(() => {
    setCart([]); setDiscountText('0'); setSelectedId(''); setDraftError('')
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.all([
      companyApi.business(businessId, controller.signal),
      companyApi.locations(businessId, controller.signal),
      catalogApi.page(0, CATALOG_PAGE_SIZE, controller.signal),
    ]).then(async ([business, sites, first]) => {
      // No permisos por defecto: los roles no administrativos consultan su propia asignación.
      const assigned = canOverrideSalesPrice(business.membership.role)
        ? [] : await companyApi.myAssignedLocationIds(businessId, controller.signal)
      if (controller.signal.aborted) return
      setAssignedLocationIds(assigned)
      setCompany(business); setLocations(sites)
      setItems(first); setHasMore(first.length === CATALOG_PAGE_SIZE)
      setLoadState('ready'); setLoadError('')
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof ApiHttpError && error.status === 401) { onUnauthorized(); return }
      setLoadState('error'); setLoadError(operationsError(error))
    })
    return () => { controller.abort() }
  }, [companyApi, catalogApi, businessId, onUnauthorized])

  const role = company?.membership.role ?? ''
  const manager = canOverrideSalesPrice(role)
  // Derivar una referencia estable para los cálculos del carrito y React Compiler.
  // La lista y la sede activa solo se recalculan al cambiar asignaciones/selección.
  const authorizedSites = useMemo(() => locations.filter(site =>
    canOverrideSalesPrice(role) || assignedLocationIds.includes(site.id)),
    [locations, role, assignedLocationIds])
  const location = useMemo(() =>
    authorizedSites.find(row => row.id === siteId) ?? null,
    [authorizedSites, siteId])
  const canWork = company?.status === 'ACTIVA' && company.membership.status === 'ACTIVA'
  const saleSites = authorizedSites.filter(site => site.status === 'ACTIVA' && site.can_sell)
  const selected = items.find(row => row.id === selectedId) ?? null
  const selectedInCart = selected ? cart.some(row => row.catalog_item_id === selected.id) : false
  const scopedSiteStock=siteId&&siteStock?.siteId===siteId?siteStock:null
  function cardStock(item:CatalogItem):number|null {
    if(item.item_type!=='BIEN'||!scopedSiteStock)return null
    const known=scopedSiteStock.balances[item.id]
    return known!==undefined?known:scopedSiteStock.complete?0:null
  }
  const siteStockPending=Boolean(siteId&&location?.can_store&&!scopedSiteStock)
  const stockForSelected=selected?.item_type==='BIEN' && stockRead?.siteId===siteId
    && stockRead.itemId===selected.id?stockRead:null
  const requestedMilli=useMemo(()=>{
    if(!selected||selected.item_type!=='BIEN')return null
    try{return parsePosQuantity(quantityText,selected.unit)}
    catch{return null}
  },[selected,quantityText])
  const overAvailable=stockForSelected!==null&&requestedMilli!==null
    &&requestedMilli>stockForSelected.quantityMilli

  // IDs primitivos: el efecto solo cambia cuando cambia la selección,
  // la sede autorizada o se solicita actualizar; sin referencias incompletas.
  const stockItemId=selected?.item_type==='BIEN'?selected.id:null
  const stockSiteId=location?.can_store?location.id:null
  // Saldo real por artículo/sede. No se inventa el stock para productos sin
  // historial, y no se permite confirmar desde una lectura fallida/desactualizada.
  useEffect(()=>{
    if(!stockItemId||!stockSiteId)return
    const itemId=stockItemId
    const currentSiteId=stockSiteId
    const controller=new AbortController()
    void inventoryApi.balances(0,1,{locationId:currentSiteId,catalogItemId:itemId},controller.signal)
      .then(rows=>{
        if(controller.signal.aborted)return
        setStockRead({
          siteId:currentSiteId,itemId,
          quantityMilli:rows[0]?.quantity_milli??0,
          updatedAt:rows[0]?.updated_at??null,
        })
        setStockError('')
      }).catch(err=>{
        if(controller.signal.aborted)return
        if(err instanceof ApiHttpError&&err.status===401){onUnauthorized();return}
        setStockRead(null)
        setStockError(inventoryErrorMessage(err))
      }).finally(()=>{
        if(!controller.signal.aborted)setStockLoading(false)
      })
    return ()=>controller.abort()
  },[inventoryApi,stockItemId,stockSiteId,stockRefresh,onUnauthorized])
  // Consulta el inventario de la sede, paginado y acotado. No sumamos
  // unidades heterogéneas ni tomamos una página incompleta como stock cero.
  useEffect(()=>{
    if(!location?.can_store)return
    const controller=new AbortController()
    const activeId=location.id
    async function loadSiteStocks(){
      const balances:Record<string,number>={}
      let complete=false
      try{
        for(let page=0;page<20;page++){
          const result=await inventoryApi.balances(page*500,500,
            {locationId:activeId},controller.signal)
          for(const row of result)balances[row.catalog_item_id]=row.quantity_milli
          if(result.length<500){complete=true;break}
        }
        if(!controller.signal.aborted)
          setSiteStock({siteId:activeId,balances,complete,error:''})
      }catch(error){
        if(controller.signal.aborted)return
        if(error instanceof ApiHttpError&&error.status===401){onUnauthorized();return}
        setSiteStock({siteId:activeId,balances:{},complete:false,
          error:inventoryErrorMessage(error)})
      }
    }
    void loadSiteStocks()
    return ()=>controller.abort()
  },[inventoryApi,location?.id,location?.can_store,stockRefresh,onUnauthorized])

  const linePreview = useMemo(() => {
    if (!selected) return { subtotal: null as number | null, message: '' }
    try {
      const quantity = parsePosQuantity(quantityText, selected.unit)
      const price = manager && priceOverride ? pesosToCents(priceText) : selected.price_cents
      if (price === null) return { subtotal: null, message: 'No price defined: a holder or administrator must indicate an amount to quote.' }
      return { subtotal: posLineTotalCents(quantity, price), message: '' }
    } catch {
      return { subtotal: null, message: 'Enter valid quantity and price to calculate the product subtotal.' }
    }
  }, [selected, quantityText, priceText, priceOverride, manager])
  const displayed = items.filter(item => {
    const term = search.trim().toLocaleLowerCase('es-AR')
    return item.status === 'ACTIVO' && item.sellable &&
      (!term || item.name.toLocaleLowerCase('es-AR').includes(term) ||
        (item.sku ?? '').toLocaleLowerCase('es-AR').includes(term))
  })

  const preview = useMemo(() => {
    if (!company || cart.length === 0) return { total: null, problem: '' }
    try {
      const discount = manager ? pesosToCents(discountText) : 0
      if (discount === null) throw new RangeError('Enter a valid discount.')
      const calculation = previewPosCart(
        role, canWork, location, items, cart, discount,
      )
      return { total: calculation.totals, problem: '' }
    } catch (err) {
      return { total: null, problem: err instanceof Error ? err.message : 'Invalid cart.' }
    }
  }, [company, cart, manager, discountText, role, canWork, location, items])

  const loadMore = useCallback(async () => {
    if (loadState !== 'ready' || loadingPage.current || !hasMore) return
    loadingPage.current = true
    setMoreLoading(true); setMoreError('')
    try {
      const next = await catalogApi.page(items.length, CATALOG_PAGE_SIZE)
      if (next.some(row => items.some(existing => existing.id === row.id))) {
        setMoreError('The catalog changed during loading. I reopened the POS to review all pages.')
        setHasMore(false)
      } else {
        setItems(previous => [...previous, ...next])
        setHasMore(next.length === CATALOG_PAGE_SIZE)
      }
    } catch (err) {
      if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
      setMoreError(operationsError(err))
    } finally {
      loadingPage.current = false
      setMoreLoading(false)
    }
  }, [catalogApi, hasMore, items, loadState, onUnauthorized])

  function choose(item: CatalogItem) {
    setCartNotice('')
    const existing = cart.find(row => row.catalog_item_id === item.id)
    const hasCustomPrice = manager && existing !== undefined &&
      existing.unit_price_cents !== item.price_cents
    setSelectedId(item.id)
    setStockRead(null);setStockError('')
    setStockLoading(item.item_type==='BIEN'&&Boolean(siteId))
    setQuantityText(existing ? posQuantityText(existing.quantity_milli) : '1')
    setPriceOverride(hasCustomPrice)
    setPriceText(centsToPesos(hasCustomPrice && existing ? existing.unit_price_cents : item.price_cents))
    setDraftError('')
  }

  function addToCart() {
    setDraftError('')
    try {
      if (!selected || selected.status !== 'ACTIVO' || !selected.sellable)
        throw new RangeError('Select a sellable item.')
      const alreadyInCart = cart.some(row => row.catalog_item_id === selected.id)
      if (!alreadyInCart && cart.length >= 30)
        throw new RangeError('Maximum 30 different items per sale.')
      const quantity_milli = parsePosQuantity(quantityText, selected.unit)
      if(selected.item_type==='BIEN'){
        if(stockLoading||!stockForSelected||stockError)
          throw new RangeError('Could not verify the balance of this headquarters. Update availability before adding.')
        if(quantity_milli>stockForSelected.quantityMilli)
          throw new RangeError('The amount exceeds the available balance ('+
            formatMilli(stockForSelected.quantityMilli)+' '+selected.unit+').')
      }
      const unit_price_cents = manager && priceOverride ? pesosToCents(priceText) : selected.price_cents
      if (unit_price_cents === null)
        throw new RangeError('The item is priceless. An administrator must define it.')
      if (!siteId && (!manager || selected.item_type === 'BIEN'))
        throw new RangeError('Select a enabled location before adding.')
      if (siteId && (!saleSites.some(site => site.id === siteId) || !location || location.status !== 'ACTIVA' || !location.can_sell ||
        (selected.item_type === 'BIEN' && !location.can_store)))
        throw new RangeError('The selected location does not support this article.')
      if (!canWork) throw new RangeError('The company or membership is not active.')
      // Validar también el subtotal individual; nunca redondear importes con floats.
      posLineTotalCents(quantity_milli, unit_price_cents)
      const updatedLine = { catalog_item_id: selected.id, quantity_milli, unit_price_cents }
      setCart(old => old.some(line => line.catalog_item_id === selected.id)
        ? old.map(line => line.catalog_item_id === selected.id ? updatedLine : line)
        : [...old, updatedLine])
      setSelectedId('')
      setCartNotice('The item was kept in the retail detail.')
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : 'Could not add article.')
    }
  }

  function addProductFromCatalog(item:CatalogItem){
    setCartNotice('')
    try{
      if(checkoutLocked||!canWork)throw new RangeError('You can\'t make a sale right now.')
      if(!siteId&&(!manager||item.item_type==='BIEN'))
        throw new RangeError('I chose an authorized location before adding this article.')
      if(siteId&&(!location||location.status!=='ACTIVA'||!location.can_sell||
          (item.item_type==='BIEN'&&!location.can_store)))
        throw new RangeError('The selected venue is not enabled to sell this item.')
      if(item.price_cents===null&&!cart.some(line=>line.catalog_item_id===item.id)){
        if(manager){
          choose(item)
          throw new RangeError('I defined the price in the sales detail before incorporating this item.')
        }
        throw new RangeError('The item is priceless. Consult the administrator.')
      }
      setCart(addOnePosCartUnit(cart,item,cardStock(item)))
      setSelectedId('')
      setDraftError('')
      setCartNotice('Added 1 '+item.unit+' de '+item.name+' to the retail details. Edit the quantities there.')
    }catch(error){
      setDraftError(error instanceof Error?error.message:'Could not close temporary folder: %s')
    }
  }

  function changeCartByUnit(line:PosCartLine,direction:1|-1){
    const item=items.find(product=>product.id===line.catalog_item_id)
    if(!item)return
    const next=line.quantity_milli+direction*1000
    if(next<1000||next>999_999_999){
      setDraftError('The quantity must remain within the range of permitted units.')
      return
    }
    // No hacer cambios rápidos cuando el saldo de esa sede no fue consultado.
    if(item.item_type==='BIEN'){
      const available=cardStock(item)
      if(available===null){
        setDraftError('First consult the stock at this headquarters before adding units.')
        choose(item)
        return
      }
      if(next>available){
        setDraftError('No more units can be added than the balance consulted at this headquarters ('+
          formatMilli(available)+' '+item.unit+').')
        return
      }
    }
    setDraftError('')
    setCartNotice('')
    setCart(previous=>previous.map(row=>row.catalog_item_id===line.catalog_item_id
      ? {...row,quantity_milli:next}:row))
  }

  return <section className="real-auth-card real-business-panel real-pos-panel e3-pos-page" aria-label="REAL Sales Preparation">
    {!isDedicatedCheckout&&<nav className="real-business-nav" aria-label="Company navigation">
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/empresas/' + businessId)}>Company</button>
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/empresas/' + businessId + '/ventas')}>Sales history</button>
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/empresas/' + businessId + '/catalogo')}>Catalog</button>
    </nav>}
    <header className="e3-sales-heading">
      <span className="e3-sales-heading-icon"><Icon name="shopping" size={27}/></span>
      <div className="e3-sales-heading-copy">
        <span className="e3-sales-eyebrow">{company?.name??'Company'} · REAL Sales</span>
        <h1>{checkoutStage==='review'?'Review and confirmation'
          :checkoutStage==='sending'?'Processing sale'
          :checkoutStage==='pending'?'Sales recovery'
          :checkoutStage==='confirmed'?'Confirmed sale'
          :'Point of sale'}</h1>
        <p>{isDedicatedCheckout
          ?'Check the request and its status before starting another sale. No transaction will be sent automatically.'
          :'Set up the cart and declare the sales payments. FastAPI will revalidate permits, prices and stock when confirming.'}</p>
      </div>
      {isDedicatedCheckout&&<span className="e3-sales-mode-indicator">{checkoutStage==='review'?'Step 2 · Review':checkoutStage==='confirmed'?'Confirmed':checkoutStage==='pending'?'Recuperación':'Verificando'}</span>}
    </header>
    <p className="real-auth-note"><strong>Validation mode T10-D.</strong> You can prepare a cart, declare payments and review the sale. The final record remains disabled by default outside of isolated trials with PostgreSQL disposable. External money is never automatically credited.</p>
    {loadState === 'loading' && <p role="status">Loading company, headquarters and REAL catalog from FastAPI...</p>}
    {loadState === 'error' && <p role="alert" className="real-auth-message real-auth-error">{loadError}</p>}
    {loadState === 'ready' && company && <>
      <div className="real-ops-toolbar e3-pos-tenant-strip">
        <strong>{company.name}</strong>
        <span>{role.replaceAll('_', ' ')} · {company.status}</span>
      </div>
      {!canWork && <p role="alert" className="real-auth-message real-ops-warning">The company or your membership is not active. You can't prepare sales.</p>}
      <fieldset className={'real-pos-draft-fieldset e3-pos-draft-fieldset'+(isDedicatedCheckout?' e3-pos-draft-hidden':'')} disabled={checkoutLocked}>
      <section className="real-ops-subpanel" aria-label="Location for sale">
        <h2>1. Location of sale</h2>
        <label>I chose the headquarters
          <select value={siteId} onChange={e => {
            setSiteId(e.target.value);setDraftError('')
            setStockRead(null);setStockError('')
            setStockLoading(selected?.item_type==='BIEN'&&Boolean(e.target.value))
          }}
            aria-label="Place of sale" disabled={!canWork}>
            <option value="">{manager ? 'No headquarters (services only)' : 'Select assigned venue'}</option>
            {saleSites.map(site => <option key={site.id} value={site.id}>{site.name} {site.can_store ? '· sales and stock' : '· solo servicios'}</option>)}
          </select>
        </label>
        {!manager && <p className="real-auth-note">You can only sell at locations where you have active assignment. FastAPI checks the assignment when confirming; choosing a location here does not grant permissions.</p>}
      </section>
      {draftError&&<p role="alert" className="real-auth-message real-auth-error e3-pos-global-error">{draftError}</p>}
      <div className="e3-pos-workspace-grid">
      <section className="real-ops-subpanel e3-pos-catalog-section" aria-label="Catalogue available">
        <h2>2. Articles and services</h2>
        <p className="real-auth-note">{items.length} PostgreSQL consulted tiles. {hasMore
          ? 'There are more pages without consulting. Search only covers the loaded tiles.'
          : 'The catalogue consulted was finalized.'}</p>
        <label>Search between loaded tiles
          <input value={search} onChange={event => setSearch(event.target.value)}
            placeholder="Name or SKU" aria-label="Search for loaded articles"/>
        </label>
        <p className="e3-pos-catalog-instruction">Add units 1 unit to retail details. Edit the quantities in the cart.</p>
        <div className="real-pos-catalog e3-pos-card-catalog">
          {displayed.map(item => {
            const existing=cart.find(line=>line.catalog_item_id===item.id)
            const available=cardStock(item)
            const requiresStock=item.item_type==='BIEN'
            const siteReady=Boolean(location&&location.status==='ACTIVA'&&location.can_sell&&
              (!requiresStock||location.can_store))
            const missingPrice=item.price_cents===null&&!existing
            const canQuickAdd=Boolean(canWork&&!checkoutLocked&&
              (siteReady||(!siteId&&manager&&!requiresStock))&&
              (!requiresStock||(available!==null&&available>=(existing?.quantity_milli??0)+1000)))
            return <article key={item.id}
              className={'real-pos-product e3-pos-product-card'+
                (existing?' e3-pos-card-in-cart':'')} aria-label={'Item '+item.name}>
              <RealPhotoPreview token={token} owner={{kind:'CATALOG',businessId,resourceId:item.id}}
                alt={"Foto de "+item.name} className="e3-pos-card-image" fallbackIcon={item.item_type==='SERVICIO'?'briefcase':'package'}/>
              <span className="e3-pos-card-category">{item.category||item.kind}</span>
              <strong>{item.name}</strong>
              <small>SKU: {item.sku||'Sin SKU'} · {item.unit}</small>
              <span className="e3-pos-card-availability">
                {item.item_type==='SERVICIO'?'Service · does not consume inventory'
                :!location?.can_store?'Select a depository seat'
                :siteStockPending?'Consultando disponibilidad…'
                :scopedSiteStock?.error?'Cannot consult stock'
                :available===null?'Stock sin verificar'
                :'Available in '+location.name+': '+formatMilli(available)+' '+item.unit}
              </span>
              {existing&&<small className="real-pos-in-cart">En detalle: {posQuantityText(existing.quantity_milli)} {item.unit}</small>}
              <div className="e3-pos-card-footer">
                <b>{item.price_cents===null?'Price to be defined':money(item.price_cents)}</b>
                <button type="button" className="e3-pos-card-add"
                  disabled={missingPrice?!manager||!canWork||checkoutLocked:!canQuickAdd}
                  aria-label={missingPrice?'Define price of '+item.name:'Add Unit of '+item.name+' to the retail details'}
                  onClick={()=>addProductFromCatalog(item)}>
                  <Icon name="plus" size={15}/>
                  {missingPrice?'Definir precio':'Agregar unidades'}
                </button>
              </div>
              {requiresStock&&siteReady&&available===null&&<button
                type="button" className="real-auth-link e3-pos-verify-stock"
                onClick={()=>choose(item)}>Check availability</button>}
            </article>
          })}
        </div>
        {displayed.length === 0 && <p className="real-business-empty">There are no items sold between the loaded tiles that match this filter.</p>}
        {hasMore && <button className="real-auth-secondary" type="button" disabled={moreLoading}
          onClick={() => void loadMore()}>{moreLoading ? 'Consultando…' : 'Load more catalog tiles'}</button>}
        {moreError && <p role="alert" className="real-auth-message real-ops-warning">{moreError}</p>}
      </section>
      <section className="real-ops-subpanel e3-pos-cart-section" aria-label="Sale Cart">
        <div className="e3-pos-cart-header">
          <h2>3. Sales details · draft</h2>
          <span className="e3-pos-cart-count">{cart.length} Articles other than</span>
        </div>
        {cartNotice&&<p role="status" className="e3-pos-cart-notice">{cartNotice}</p>}
        {cart.length === 0 && <p className="real-business-empty">You haven't added any items yet.</p>}
        <div className="e3-pos-ticket-lines" aria-label="Products and quantities of this sale">
        {cart.map((row,index) => {
          const item = items.find(product => product.id === row.catalog_item_id)
          return <article key={row.catalog_item_id} className="real-pos-cart-row">
            <span className="e3-pos-line-number" aria-hidden="true">{index+1}</span>
            <div className="e3-pos-cart-line-info"><strong>{item?.name ?? 'Article not available'}</strong>
              <small>Cantidad: {posQuantityText(row.quantity_milli)} {item?.unit || ''} × Unit price: {money(row.unit_price_cents)}</small>
              <strong className="real-pos-line-total">Subtotal output: {money(posLineTotalCents(row.quantity_milli, row.unit_price_cents))}</strong>
            </div>
            <div className="real-pos-cart-actions e3-pos-cart-actions">
              {item&&<div className="e3-pos-cart-quantity" role="group" aria-label={'Unidades de '+item.name}>
                <button type="button" aria-label={'Remove a unit of '+item.name}
                  disabled={row.quantity_milli<=1000}
                  onClick={()=>changeCartByUnit(row,-1)}>−</button>
                <strong>{posQuantityText(row.quantity_milli)}</strong>
                <button type="button" aria-label={'Add Unit of '+item.name}
                  onClick={()=>changeCartByUnit(row,1)}>+</button>
              </div>}
              {item && <button className="real-auth-link" type="button" onClick={() => choose(item)}>Edit Quantity</button>}
              <button className="real-auth-link" type="button" onClick={()=>{
                setCart(previous=>previous.filter(line=>line.catalog_item_id!==row.catalog_item_id))
                if(selectedId===row.catalog_item_id)setSelectedId('')
                setDraftError('');setCartNotice('')
              }}>Remove</button>
            </div>
          </article>
        })}
        </div>
        {selected && <div className="real-pos-picker">
          <div className="e3-pos-picker-head">
              <h3>{selectedInCart?'Edit Article: ':'Define article: '}{selected.name}</h3>
              <button type="button" className="real-auth-link"
                onClick={()=>setSelectedId('')}>Close Edit</button>
            </div>
          <div className="real-pos-fields">
            <label>Cantidad ({selected.unit})
              <input inputMode="decimal" aria-label="Quantity of the item" value={quantityText}
                onChange={e => setQuantityText(e.target.value)}/>
            </label>
            <label>Unit price (ARS)
              <input inputMode="decimal" aria-label="Unit selling price"
                value={manager && priceOverride ? priceText : centsToPesos(selected.price_cents)}
                disabled={!manager || !priceOverride}
                onChange={e => setPriceText(e.target.value)}/>
            </label>
          </div>
          {manager ? <button type="button" className="real-auth-link real-pos-price-override"
              aria-pressed={priceOverride}
              onClick={() => {
                setPriceOverride(previous => !previous)
                if (priceOverride) setPriceText(centsToPesos(selected.price_cents))
                setDraftError('')
              }}>
              {priceOverride ? 'Reset catalog price' : 'Change price exceptionally'}
            </button>
            : <p className="real-auth-note">Your role must respect the price of the catalogue and cannot apply discounts.</p>}
          {selected.item_type==='BIEN'&&<div className="e3-pos-stock-hint" aria-label="Availability of REAL stock">
            {!location?.can_store?<p>I chose a venue that was enabled to store and sell this product.</p>
              :stockLoading?<p role="status">Checking actual balance in {location.name}…</p>
              :stockError?<p role="alert">{stockError}</p>
              :stockForSelected?<p><strong>Available in {location.name}:
                {' '}{formatMilli(stockForSelected.quantityMilli)} {selected.unit}</strong>
                {stockForSelected.updatedAt&&<small>Registered balance: {new Date(stockForSelected.updatedAt).toLocaleString('es-AR')}</small>}
              </p>:<p>Select a location to check the actual balance.</p>}
            {overAvailable&&<p role="alert" className="e3-pos-stock-warning">
              The amount exceeds the stock available from this headquarters. Enter an equal or lesser amount.</p>}
            <button type="button" className="real-auth-link"
              disabled={!location?.can_store||stockLoading}
              onClick={()=>{
                setStockRead(null);setStockError('');setStockLoading(true)
                setStockRefresh(value=>value+1)
              }}>Update availability</button>
            <small>Guidance inquiry: no merchandise reservation. FastAPI rechecks the stock when confirming.</small>
          </div>}
          <div className="real-pos-line-preview" role="status">
            {linePreview.subtotal === null ? <span>{linePreview.message}</span>
              : <><span>Subtotal output ({quantityText} × unit price)</span>
                  <strong>{money(linePreview.subtotal)}</strong></>}
          </div>
          <button type="button" className="real-auth-primary" onClick={addToCart}
            disabled={selected.item_type==='BIEN'&&
              (stockLoading||!stockForSelected||Boolean(stockError)||overAvailable)}>
            {selectedInCart ? 'Save changes in detail' : 'Add to detail with this price'}
          </button>
        </div>}

        <div className="real-pos-summary e3-pos-cart-totals" aria-label="Breakdown of total purchase">
          <span>Subtotal items <strong>{preview.total?money(preview.total.subtotal_cents):cart.length===0?money(0):'—'}</strong></span>
          {manager&&<label className="e3-pos-cart-discount">Sale Discount (ARS)
            <input inputMode="decimal" aria-label="Sale discount" value={discountText}
              onChange={e => setDiscountText(e.target.value)}/>
          </label>}
          <span>Discount applied <strong>{preview.total?'−'+money(preview.total.discount_cents):'—'}</strong></span>
          <span className="e3-pos-cart-total">Total receivable <strong>{preview.total?money(preview.total.total_cents):'—'}</strong></span>
          {cart.length===0&&<small>Add items to calculate the discount and total.</small>}
          {cart.length>0&&!preview.total&&<small>I fixed the cart or discount to get a valid total.</small>}
        </div>
        {preview.problem&&cart.length>0&&<p role="alert" className="real-auth-message real-ops-warning">{preview.problem}</p>}
        <p className="real-auth-note">This detail is a draft. "Finishing sales" opens the complete review; only an explicit confirmation records the operation and affects the inventory.</p>
      </section>
      </div>
      </fieldset>
      <RealPosCheckout token={token} userId={userId} businessId={businessId}
        businessName={company.name} role={role} businessActive={canWork}
        location={location} items={items} cart={cart} discountText={discountText}
        onDraftLock={onDraftLock} onStageChange={onCheckoutStageChange} onConfirmed={onSaleConfirmed}
        onUnauthorized={onUnauthorized} onNavigate={onNavigate}/>
    </>}
  </section>
}
