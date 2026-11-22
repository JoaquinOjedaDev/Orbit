import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiHttpError } from '../../api/httpClient.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import { UUID_V4_PATTERN } from '../businesses/businessGateway.ts'
import { createOperationsGateway, canReadTeam } from '../businesses/realOperationsGateway.ts'
import type { LocationRecord, TeamMember } from '../businesses/realOperationsGateway.ts'
import { Icon } from '../../app/Icon.tsx'
import './realSalesVisual.css'
import {
  createSalesReadGateway, SALES_PAGE_SIZE, salesReadErrorMessage,
} from './realSalesReadGateway.ts'
import type { SaleReceipt, SaleSummary } from './realSalesReadGateway.ts'

type Props = {
  token: string
  userId: string
  userDisplayName: string
  businessId: string
  onNavigate: (path: string) => void
  onUnauthorized: () => void
}

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
function cents(value: number): string { return money.format(value / 100) }
function date(value: string): string {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })
    .format(new Date(value))
}
function qty(value: number): string {
  const main = Math.trunc(value / 1000)
  const fraction = String(value % 1000).padStart(3, '0').replace(/0+$/, '')
  return fraction ? main + ',' + fraction : String(main)
}
function short(value: string): string { return value.slice(0, 8) + '…' }

/** T09-D is intentionally READ-ONLY: no sale creation, no DEMO or payment accreditation. */
export function RealSalesPage({ token, userId, userDisplayName, businessId, onNavigate, onUnauthorized }: Props) {
  const companyApi = useMemo(() => createOperationsGateway(token, userId), [token, userId])
  const salesApi = useMemo(() => createSalesReadGateway(token, businessId), [token, businessId])
  const [company, setCompany] = useState<RealBusiness | null>(null)
  const [locations, setLocations] = useState<LocationRecord[]>([])
  const [actorDirectory,setActorDirectory]=useState<{
    businessId:string;actors:Array<Pick<TeamMember,'user_id'|'display_name'>>
  }|null>(null)
  const [search,setSearch]=useState('')
  const backRef=useRef<HTMLButtonElement>(null)
  const historyTitleRef=useRef<HTMLHeadingElement>(null)
  const [metadataError, setMetadataError] = useState('')
  const [locationId, setLocationId] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)
  const [rows, setRows] = useState<SaleSummary[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hasMore, setHasMore] = useState(false)
  const [moreLoading, setMoreLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [pageError, setPageError] = useState('')
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [requestInput, setRequestInput] = useState('')
  const listEpoch = useRef(0)
  const pageController = useRef<AbortController | null>(null)
  const detailEpoch = useRef(0)
  const detailController = useRef<AbortController | null>(null)

  const permittedActors=company&&canReadTeam(company)&&actorDirectory?.businessId===businessId
    ? actorDirectory.actors:[]
  const actorName=(id:string)=>{
    if(id===userId)return userDisplayName.trim()||'Your account'
    return permittedActors.find(actor=>actor.user_id===id)?.display_name.trim()||'Name not available'
  }
  const filteredRows=rows.filter(row=>{
    const term=search.trim().toLocaleLowerCase('es-AR')
    return !term||[row.id,row.request_id,locationNameById(row.location_id),
      actorName(row.created_by_id)].some(value=>value.toLocaleLowerCase('es-AR').includes(term))
  })
  function locationNameById(id:string|null):string{
    return id===null?'Unseen sale (services)'
      :locations.find(item=>item.id===id)?.name??'Sede '+short(id)
  }
  const locationName = useCallback((id: string | null) => {
    if (id === null) return 'Unseen sale (services)'
    return locations.find(item => item.id === id)?.name ?? 'Sede ' + short(id)
  }, [locations])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.all([
      companyApi.business(businessId, controller.signal),
      companyApi.locations(businessId, controller.signal),
    ]).then(([business, sites]) => {
      if (controller.signal.aborted) return
      setCompany(business); setLocations(sites); setMetadataError('')
    }).catch((err: unknown) => {
      if (controller.signal.aborted) return
      if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
      setMetadataError('No company or headquarters names could be consulted. History remains independent.')
    })
    return () => { controller.abort() }
  }, [companyApi, businessId, onUnauthorized])

  // La identidad del vendedor se resuelve desde la empresa actual,
  // sin exponer directorios de equipo a roles sin autorización.
  useEffect(()=>{
    const controller=new AbortController()
    if(!company||company.id!==businessId||!canReadTeam(company))
      return ()=>controller.abort()
    void companyApi.team(businessId,controller.signal).then(people=>{
      if(!controller.signal.aborted)
        setActorDirectory({businessId,
          actors:people.map(({user_id,display_name})=>({user_id,display_name}))})
    }).catch(err=>{
      if(controller.signal.aborted)return
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
    })
    return ()=>controller.abort()
  },[company,companyApi,businessId,onUnauthorized])

  useEffect(()=>{
    if(receipt)backRef.current?.focus()
    else historyTitleRef.current?.focus()
  },[receipt])

  useEffect(() => {
    const controller = new AbortController()
    const epoch = ++listEpoch.current
    pageController.current?.abort()
    pageController.current = null
    detailController.current?.abort()
    detailEpoch.current++
    // The scope of an opened receipt is invalid after changing filters or refreshing.
    // Don't keep an old detail while showing rows from a different query.
    const filters = locationId ? { locationId } : {}
    void salesApi.list(0, SALES_PAGE_SIZE, filters, controller.signal).then(data => {
      if (controller.signal.aborted || epoch !== listEpoch.current) return
      setRows(data); setHasMore(data.length === SALES_PAGE_SIZE)
      setListError(''); setStatus('ready')
    }).catch((err: unknown) => {
      if (controller.signal.aborted || epoch !== listEpoch.current) return
      if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
      setListError(salesReadErrorMessage(err)); setStatus('error')
    })
    // Clear old data synchronously in cleanup/effect via keyed page on navigation.
    return () => { controller.abort(); pageController.current?.abort() }
  }, [salesApi, locationId, refreshCount, onUnauthorized])

  const effectiveFilters = useMemo(() => locationId ? { locationId } : {}, [locationId])

  async function loadMore() {
    if (status !== 'ready' || !hasMore || moreLoading || pageController.current !== null) return
    const epoch = listEpoch.current
    const controller = new AbortController()
    pageController.current = controller
    setMoreLoading(true); setPageError('')
    try {
      const next = await salesApi.list(rows.length, SALES_PAGE_SIZE, effectiveFilters, controller.signal)
      if (controller.signal.aborted || epoch !== listEpoch.current) return
      const known = new Set(rows.map(row => row.id))
      if (next.some(row => known.has(row.id))) {
        setPageError('History changed between pages. Update from the first page to avoid duplicates or omissions.')
        setHasMore(false)
        return
      }
      setRows(previous => [...previous, ...next])
      setHasMore(next.length === SALES_PAGE_SIZE)
    } catch (err) {
      if (controller.signal.aborted || epoch !== listEpoch.current) return
      if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
      setPageError('Could not load the following page. List is partial: ' + salesReadErrorMessage(err))
    } finally {
      if (epoch === listEpoch.current) {
        pageController.current = null
        setMoreLoading(false)
      }
    }
  }

  async function readDetail(mode: 'id' | 'request', value: string) {
    detailController.current?.abort()
    const controller = new AbortController()
    detailController.current = controller
    const epoch = ++detailEpoch.current
    setReceipt(null); setDetailError(''); setDetailLoading(true)
    try {
      const response = mode === 'id'
        ? await salesApi.get(value, controller.signal)
        : await salesApi.byRequest(value, controller.signal)
      if (controller.signal.aborted || epoch !== detailEpoch.current) return
      setReceipt(response)
    } catch (err) {
      if (controller.signal.aborted || epoch !== detailEpoch.current) return
      if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
      setDetailError(salesReadErrorMessage(err))
    } finally {
      if (epoch === detailEpoch.current) setDetailLoading(false)
    }
  }

  function closeDetail(){
    detailController.current?.abort()
    detailEpoch.current++
    setReceipt(null);setDetailError('');setDetailLoading(false)
  }

  function requestSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = requestInput.trim()
    if (!UUID_V4_PATTERN.test(id)) {
      // Invalid input invalidates a previous in-flight lookup too.
      detailController.current?.abort()
      detailEpoch.current++
      setDetailLoading(false)
      setReceipt(null); setDetailError('Enter a valid UUID4 application key.')
      return
    }
    void readDetail('request', id)
  }

  function refresh() {
    listEpoch.current++
    pageController.current?.abort()
    detailController.current?.abort()
    detailEpoch.current++
    setRows([]); setHasMore(false); setStatus('loading')
    setMoreLoading(false); setPageError(''); setListError('')
    setReceipt(null); setDetailError(''); setDetailLoading(false)
    setRefreshCount(value => value + 1)
  }

  return <section className="real-auth-card real-business-panel real-sales-panel e3-sales-page" aria-label="A REAL Sales History">
    {receipt&&<div className="e3-sales-backbar">
      <button type="button" ref={backRef} className="e3-sales-back" onClick={closeDetail}>
        <Icon name="arrow-left" size={18}/>Back to History
      </button>
      <span>Read-only query · no new operations</span>
    </div>}
    {!receipt&&<>
    <nav className="real-business-nav" aria-label="Company navigation">
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/empresas/' + businessId)}>Company</button>
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/empresas/' + businessId + '/inventario')}>Inventory</button>
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/empresas')}>My companies</button>
    </nav>
    <header className="e3-sales-heading">
      <span className="e3-sales-heading-icon"><Icon name="receipt" size={27}/></span>
      <div className="e3-sales-heading-copy">
        <span className="e3-sales-eyebrow">{company?.name??'Company'} · Confirmed sales</span>
        <h1 ref={historyTitleRef} tabIndex={-1}>Sales history</h1>
        <p>Confirmed checks in PostgreSQL, according to authorized company permits and locations.</p>
      </div>
      <button type="button" className="real-auth-primary e3-sales-new-sale"
        onClick={()=>onNavigate('/real/empresas/'+businessId+'/pos')}>
        <Icon name="plus" size={16}/>Go to the point of sale
      </button>
    </header>
    <p className="real-auth-note"><strong>Just reading.</strong> No sales, no stock change or payment is credited here. The means of payment for the voucher are statements, not confirmations from banks or Mercado Pago.</p>
    {company && <div className="real-ops-toolbar"><strong>{company.name}</strong><span>{company.membership.role.replaceAll('_', ' ')}</span></div>}
    {metadataError && <p role="status" className="real-auth-message real-ops-warning">{metadataError}</p>}
    {status==='ready'&&<div className="e3-sales-loaded-summary" aria-label="Summary of loaded sales">
      <div><span>Loaded sales</span><strong>{rows.length}</strong></div>
      <div><span>Headquarters in loaded records</span><strong>{new Set(rows.map(x=>x.location_id??'servicios')).size}</strong></div>
    </div>}
    <div className="real-sales-filters e3-sales-filters">
      <label>Search for loaded sales
        <input type="search" value={search} aria-label="Search for loaded sales"
          onChange={event=>setSearch(event.target.value)}
          placeholder="Headquarters, responsible, sale or request"/>
      </label>
      <label>Location
        <select aria-label="Filter sales by location" value={locationId}
          onChange={event => {
            listEpoch.current++; pageController.current?.abort()
            detailController.current?.abort(); detailEpoch.current++
            setLocationId(event.target.value); setRows([]); setStatus('loading')
            setHasMore(false); setMoreLoading(false); setReceipt(null)
            setDetailLoading(false); setDetailError(''); setPageError(''); setListError('')
          }}>
          <option value="">All authorized locations</option>
          {locations.map(loc => <option value={loc.id} key={loc.id}>{loc.name} · {loc.status}</option>)}
        </select>
      </label>
      <button type="button" className="real-auth-secondary" onClick={refresh} disabled={status === 'loading'}>
        Update from API
      </button>
    </div>
    <section aria-label="Confirmed sales">
      <div className="real-sales-list-title"><h2>Confirmed sales</h2>
        <small>{status === 'ready'
          ? rows.length + ' cargadas · ' + (hasMore ? 'Listado parcial' : 'End of list consulted')
          : status === 'error' ? 'Query Error' : 'Consultando…'}</small>
      </div>
      {status === 'loading' && <p role="status">Checking authorized sales from FastAPI...</p>}
      {status === 'error' && <p role="alert" className="real-auth-message real-auth-error">{listError} <button type="button" className="real-auth-link" onClick={refresh}>Retry Consultation</button></p>}
      {status === 'ready' && rows.length === 0 && <div className="real-business-empty">There are no accessible sales with the filter chosen. This does not mean that other locations do not have sales.</div>}
      {status==='ready'&&rows.length>0&&filteredRows.length===0&&<p className="real-business-empty">There are no matches between loaded sales. You can remove the filter or load more pages.</p>}
      {status === 'ready' && filteredRows.length > 0 && <div className="real-sales-list e3-sales-card-grid">
        {filteredRows.map(row => <article className="real-sales-row" key={row.id}>
          <div className="real-sales-row-main">
            <strong>{cents(row.total_cents)}</strong>
            <span>{date(row.created_at)} · {locationName(row.location_id)}</span>
            <small>Sale {short(row.id)} · CONFIRMADA</small>
            <small className="e3-sales-actor">He recorded the sale: <strong>{actorName(row.created_by_id)}</strong></small>
          </div>
          <button className="real-auth-secondary" type="button" onClick={() => void readDetail('id', row.id)}>See voucher</button>
        </article>)}
      </div>}
      {status === 'ready' && hasMore && <button type="button" className="real-auth-secondary"
        disabled={moreLoading} onClick={() => void loadMore()}>{moreLoading ? 'Cargando…' : 'Load more sales'}</button>}
      {pageError && <p role="alert" className="real-auth-message real-ops-warning">{pageError} <button type="button" className="real-auth-link" onClick={refresh}>Update from the start</button></p>}
    </section>
    <section className="real-ops-subpanel" aria-label="Recovery of vouchers">
      <h2>Recover proof by request</h2>
      <p>If you kept the request_id of a confirmed sale, you can consult it without making another sale. A 404 does not prove that the original POST has never arrived.</p>
      <form className="real-sales-request-form" onSubmit={requestSearch}>
        <label>Clave original de solicitud (UUID4)
          <input value={requestInput} onChange={event => setRequestInput(event.target.value)}
            placeholder="xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx" spellCheck={false} maxLength={36}/>
        </label>
        <button type="submit" className="real-auth-primary" disabled={detailLoading}>
          {detailLoading ? 'Consultando…' : 'Consultar solicitud'}
        </button>
      </form>
    </section>
    </>}
    {detailLoading && <p role="status">Loading historical proof...</p>}
    {detailError && <p role="alert" className="real-auth-message real-auth-error">{detailError}</p>}
    {receipt && <div className="e3-sales-detail-view">
      <header className="e3-sales-heading e3-sales-detail-heading">
        <span className="e3-sales-heading-icon"><Icon name="receipt" size={27}/></span>
        <div className="e3-sales-heading-copy">
          <span className="e3-sales-eyebrow">{company?.name??'Company'} · Internal check</span>
          <h1>Sales voucher</h1>
          <p>{date(receipt.created_at)} · {locationName(receipt.location_id)}</p>
        </div>
      </header>
      {receipt.payments.some(payment=>['MERCADO_PAGO_DEMO_QA','MERCADO_PAGO_QR_TEST'].includes(payment.method)) &&
        <p role="note"><strong>SALE QA · Mercado Pago.</strong> Test operation: Fictious DEMO or official QR TEST. It does not represent accredited production money.</p>}
      <section className="real-sales-receipt e3-sales-receipt" aria-label="REAL sales check">
      <div className="real-sales-receipt-head">
        <div><span className="real-auth-eyebrow">REAL Historical Check</span><h2>Confirmed sale</h2></div>
        <strong>{cents(receipt.total_cents)}</strong>
      </div>
      <dl className="real-auth-profile e3-sales-detail-facts">
        <div><dt>Date</dt><dd>{date(receipt.created_at)}</dd></div>
        <div><dt>Sede</dt><dd>{locationName(receipt.location_id)}</dd></div>
        <div><dt>He registered the sale.</dt><dd>{actorName(receipt.created_by_id)}</dd></div>
        <div><dt>Status</dt><dd>Confirmed</dd></div>
      </dl>
      <h3>Articles and services</h3>
      <div className="real-sales-receipt-lines">
        {receipt.lines.map(line => <div key={line.id}>
          <div><strong>{line.description_snapshot}</strong><small>{line.kind_snapshot} · {qty(line.quantity_milli)} {line.unit_snapshot} · {cents(line.unit_price_cents)} per unit</small></div>
          <strong>{cents(line.line_total_cents)}</strong>
        </div>)}
      </div>
      <div className="real-sales-totals">
        <span>Subtotal <strong>{cents(receipt.subtotal_cents)}</strong></span>
        <span>Discount <strong>−{cents(receipt.discount_cents)}</strong></span>
        <span>Total <strong>{cents(receipt.total_cents)}</strong></span>
      </div>
      <h3>Declared payments (without external accreditation)</h3>
      <div className="real-sales-receipt-lines">
        {receipt.payments.map(payment => <div key={payment.id}>
          <div><strong>{payment.method.replaceAll('_', ' ')}</strong>
            {payment.reference && <small>{['MERCADO_PAGO_DEMO_QA','MERCADO_PAGO_QR_TEST'].includes(payment.method) ? 'QR test reference: ' : 'Referencia declarada: '}{payment.reference}</small>}</div>
          <strong>{cents(payment.amount_cents)}</strong>
        </div>)}
      </div>
      {receipt.balances_after.length > 0 && <>
        <h3>Post-sale historical balances</h3>
        <div className="real-sales-receipt-lines">
          {receipt.balances_after.map(snap => <div key={snap.catalog_item_id}>
            <small>Item {short(snap.catalog_item_id)}</small>
            <strong>{qty(snap.quantity_milli)} · version {snap.version}</strong>
          </div>)}
        </div>
        <p className="real-auth-note">These balances are historical snapshots; to know the current stock, see REAL Inventory.</p>
      </>}
      {receipt.notes && <p>Observaciones: {receipt.notes}</p>}
      <details className="e3-sales-trace">
        <summary>Traceability identifiers</summary>
        <dl>
          <div><dt>Sales ID</dt><dd>{receipt.id}</dd></div>
          <div><dt>Original request</dt><dd>{receipt.request_id}</dd></div>
          <div><dt>Responsible user (ID)</dt><dd>{receipt.created_by_id}</dd></div>
        </dl>
      </details>
      <button type="button" className="real-auth-secondary e3-sales-close" onClick={closeDetail}>Close voucher</button>
      </section>
    </div>}
  </section>
}
