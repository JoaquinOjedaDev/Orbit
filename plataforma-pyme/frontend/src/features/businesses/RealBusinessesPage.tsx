import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiHttpError, ApiTransportError } from '../../api/httpClient.ts'
import { businessIntentJournal, intentIsOld, JournalConflictError, JournalUnavailableError } from '../pending/businessIntentJournal.ts'
import {
  businessErrorMessage, canEditBusiness, createBusinessGateway,
} from './businessGateway.ts'
import type { ActivityKind, BusinessChanges, NewBusiness, RealBusiness } from './businessGateway.ts'
import { RealPhotoManager, RealPhotoPreview } from '../photos/RealPhotos.tsx'
import './realBusinessDetails.css'
import '../auth/realPeopleBusiness.css'

export type BusinessRoute = { kind: 'list' } | { kind: 'create' } | { kind: 'detail'; businessId: string }
export type PendingBusinessCreation = { key: string; body: NewBusiness }
type Props = {
  token: string
  userId: string
  route: BusinessRoute
  onNavigate: (route: string) => void
  onUnauthorized: () => void
  pendingCreation: PendingBusinessCreation | null
  setPendingCreation: (pending: PendingBusinessCreation | null) => void
}

const activityKinds: ActivityKind[] = ['PRODUCTOS', 'SERVICIOS', 'MIXTO']
const emptyNewBusiness: NewBusiness = { name: '', category: '', activity_kind: 'PRODUCTOS' }

// Rutas existentes del sistema REAL. No se agregan endpoints ni permisos.
const detailSections = [
  { title: 'Administration', description: 'Organize your company\'s headquarters, equipment and resources.', actions: [
    { suffix: 'ubicaciones', title: 'Locations', detail: 'Locations and availability to operate.' },
    { suffix: 'equipo', title: 'Equipment and invitations', detail: 'Members, roles and access.' },
    { suffix: 'catalogo', title: 'Catalog', detail: 'Outputs, inputs and services.' },
    { suffix: 'proveedores', title: 'Suppliers', detail: 'Your business relations.' },
  ] },
  { title: 'Operations', description: 'I\'ve agreed to the moves available for your business.', actions: [
    { suffix: 'compras', title: 'Purchases and receptions', detail: 'Purchase and receipt of goods.' },
    { suffix: 'inventario', title: 'Inventory', detail: 'Balances and stock movements.' },
    { suffix: 'pos', title: 'Point of sale', detail: 'Prepare and check a sale.' },
    { suffix: 'ventas', title: 'Sales history', detail: 'Checks and queries.' },
  ] },
] as const

export function RealBusinessesPage({
  token, userId, route, onNavigate, onUnauthorized, pendingCreation, setPendingCreation,
}: Props) {
  const [items, setItems] = useState<RealBusiness[] | null>(null)
  const [selected, setSelected] = useState<RealBusiness | null>(null)
  const [businessPhotoRevision, setBusinessPhotoRevision] = useState(0)
  const [loading, setLoading] = useState(route.kind !== 'create')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState<NewBusiness>(() => pendingCreation?.body ?? emptyNewBusiness)
  const [journalState, setJournalState] = useState<'loading' | 'ready' | 'error'>(route.kind === 'create' ? 'loading' : 'ready')
  const [journalNote, setJournalNote] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [intentOld, setIntentOld] = useState(false)
  const [editing, setEditing] = useState(false)
  const [changes, setChanges] = useState<NewBusiness>(emptyNewBusiness)
  const requestGeneration = useRef(0)
  const mutationGeneration = useRef(0)
  const gateway = useMemo(() => createBusinessGateway(token, userId), [token, userId])
  const businessId = route.kind === 'detail' ? route.businessId : null

  useEffect(() => {
    // Changing tenant, route or session must not let an old POST/PATCH alter this page.
    const invalidateMutations = () => { mutationGeneration.current += 1 }
    return () => { invalidateMutations() }
  }, [])

  useEffect(() => {
    // Abort reads on tenant change; ignore late responses from the previous tenant.
    const controller = new AbortController()
    const runId = ++requestGeneration.current
    if (route.kind === 'create') return () => { controller.abort() }
    const promise = businessId === null
      ? gateway.list(controller.signal)
      : gateway.get(businessId, controller.signal)
    void promise.then((result) => {
      if (controller.signal.aborted || runId !== requestGeneration.current) return
      if (Array.isArray(result)) setItems(result)
      else {
        setSelected(result)
        setChanges({ name: result.name, category: result.category, activity_kind: result.activity_kind })
      }
    }).catch((err: unknown) => {
      if (controller.signal.aborted || runId !== requestGeneration.current) return
      if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
      setError(businessErrorMessage(err))
    }).finally(() => {
      if (!controller.signal.aborted && runId === requestGeneration.current) setLoading(false)
    })
    return () => { controller.abort() }
  }, [gateway, route.kind, businessId, onUnauthorized])

  useEffect(() => {
    if (route.kind !== 'create') return
    let active = true
    void businessIntentJournal.load(userId).then((record) => {
      if (!active) return
      const restored = record ? { key: record.key, body: record.body } : null
      setPendingCreation(restored)
      if (record) {
        setDraft(record.body)
        setAcknowledged(true) // the original attempt was already persisted explicitly
        setIntentOld(intentIsOld(record))
        setJournalNote('An attempt saved in this browser was recovered. It will not be automatically forwarded.')
      } else {
        setDraft(emptyNewBusiness)
        setIntentOld(false)
        setJournalNote('')
      }
      setJournalState('ready')
    }).catch(() => {
      if (!active) return
      setJournalState('error')
      setJournalNote('You could not open or validate the browser registry. For security you will not be allowed to create a company without first retaining your key.')
    })
    return () => { active = false }
  }, [route.kind, userId, setPendingCreation])

  function normalize(input: NewBusiness): NewBusiness {
    return { name: input.name.trim(), category: input.category.trim(), activity_kind: input.activity_kind }
  }

  async function createCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || journalState !== 'ready') return
    setError(''); setNotice('')
    if (!acknowledged) {
      setError('To create a company, you agree to temporarily keep the attempt in this browser. No tokens or passwords are saved.')
      return
    }
    const desired = normalize(draft)
    if (desired.name.length < 2 || desired.category.length < 2) {
      setError('Name and heading must have at least two characters.')
      return
    }
    if (pendingCreation && JSON.stringify(pendingCreation.body) !== JSON.stringify(desired)) {
      setError('There is an unconfirmed previous attempt. We keep the original body to avoid reusing its key with other data.')
      return
    }
    const pending = pendingCreation ?? { key: crypto.randomUUID(), body: desired }
    const mutationId = ++mutationGeneration.current
    setBusy(true)
    try {
      // Strict ordering: durable commit FIRST, business POST SECOND.
      // If persistence is denied or corrupted, do not send any POST.
      const saved = await businessIntentJournal.reserve(userId, pending.body, pending.key)
      if (mutationId !== mutationGeneration.current) return
      setPendingCreation({ key: saved.key, body: saved.body })
      const business = await gateway.create(saved.body, saved.key)
      if (mutationId !== mutationGeneration.current) return
      try {
        await businessIntentJournal.discard(userId, saved.key)
      } catch {
        setError('The company was confirmed at FastAPI, but could not clean up its local attempt. Consult My companies and manually discard registration when it becomes available again.')
        return
      }
      if (mutationId !== mutationGeneration.current) return
      setPendingCreation(null)
      setDraft(emptyNewBusiness)
      // H2: the first destination is the verified onboarding, not a second setup form.
      onNavigate('/real/empresas/' + business.id + '/inicio')
    } catch (err) {
      if (mutationId !== mutationGeneration.current) return
      if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
      // Even a malformed 201 response can follow a successful database commit.
      const ambiguous = err instanceof ApiTransportError
        || (err instanceof ApiHttpError && (err.status === 409 || err.status >= 500))
      setError(err instanceof JournalUnavailableError
        ? 'Could not save try in this browser: We do NOT send creation to FastAPI. Check IndexedDB availability.'
        : err instanceof JournalConflictError
          ? 'There is already an attempt saved with another key or content. We do not send a new POST: check the pending request.'
          : ambiguous
            ? 'We cannot confirm the result. Check "My companies" before repeating. If applicable, try the SAME key and the SAME data even after F5.'
            : businessErrorMessage(err))
    } finally {
      if (mutationId === mutationGeneration.current) setBusy(false)
    }
  }

  async function updateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !canEditBusiness(selected) || busy) return
    setError(''); setNotice(''); setBusy(true)
    const mutationId = ++mutationGeneration.current
    const updated = normalize(changes)
    const patch: BusinessChanges = {}
    if (updated.name !== selected.name) patch.name = updated.name
    if (updated.category !== selected.category) patch.category = updated.category
    if (updated.activity_kind !== selected.activity_kind) patch.activity_kind = updated.activity_kind
    if (Object.keys(patch).length === 0) {
      setEditing(false); setBusy(false)
      return
    }
    try {
      const current = await gateway.update(selected.id, patch)
      if (mutationId !== mutationGeneration.current) return
      setSelected((old) => old?.id === current.id ? current : old)
      // Preserve confirmed values when the user opens the editor again.
      setChanges({ name: current.name, category: current.category, activity_kind: current.activity_kind })
      setEditing(false)
      setNotice('Company data updated at PostgreSQL.')
    } catch (err) {
      if (mutationId !== mutationGeneration.current) return
      if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
      setError(businessErrorMessage(err))
    } finally {
      if (mutationId === mutationGeneration.current) setBusy(false)
    }
  }

  async function dismissPending() {
    if (!pendingCreation || busy) return
    const confirmed = window.confirm('Discard the attempt only after checking My companies. If the server has already confirmed the creation, another key can create a duplicate company. Delete local registration?')
    if (!confirmed) return
    setBusy(true)
    try {
      await businessIntentJournal.discard(userId, pendingCreation.key)
      setPendingCreation(null)
      setDraft(emptyNewBusiness)
      setIntentOld(false)
      setAcknowledged(false)
      setError('')
      setJournalNote('')
      setNotice('Local registration ruled out by your decision. Nothing changed in FastAPI.')
    } catch {
      setError('Could not remove local registration. Your intent identity was not ruled out.')
    } finally { setBusy(false) }
  }

  function fields(value: NewBusiness, update: (field: keyof NewBusiness, value: string) => void) {
    return <>
      <label>Trade name<input required minLength={2} maxLength={120} autoComplete="organization" value={value.name} onChange={(e) => update('name', e.target.value)}/></label>
      <label>Rubro<input required minLength={2} maxLength={120} placeholder="E.g.: trade, gastronomy, consultancy" value={value.category} onChange={(e) => update('category', e.target.value)}/></label>
      <label>Activity<select value={value.activity_kind} onChange={(e) => update('activity_kind', e.target.value)}>
        {activityKinds.map((item) => <option key={item} value={item}>{item === 'MIXTO' ? 'Products and services' : item === 'PRODUCTOS' ? 'Products' : 'Services'}</option>)}
      </select></label>
    </>
  }

  return <section className={"real-auth-card real-business-panel" + (route.kind === "list" ? " e3-companies-page" : route.kind === "detail" ? " e3-business-detail" : "")} aria-label="Real companies">
    <div className="real-business-nav">
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/perfil')}>Back to profile</button>
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/empresas')}>My companies</button>
      <button className="real-auth-link" type="button" onClick={() => onNavigate('/real/empresas/nueva')}>Create company</button>
    </div>
    <span className="real-auth-eyebrow">{route.kind === 'list' ? 'Your workspace' : route.kind === 'create' ? 'New organization' : 'Company details'}</span>
    {route.kind === 'list' ? <>
      <div className="e3-company-heading">
        <div>
          <h1>My companies</h1>
          <p>I chose a business to manage your data and operations.</p>
        </div>
        {!loading && items && <span className="e3-company-count" role="status">{items.length} {items.length === 1 ? 'related company' : 'related companies'}</span>}
      </div>
      {loading && <p role="status">Consulting companies in FastAPI...</p>}
      {!loading && items?.length === 0 && <div className="real-business-empty e3-company-empty">
        <strong>Your first business starts here.</strong>
        <p>You create a company and then follow the first steps from Home. You can complete them gradually; services do not need physical stock.</p>
      </div>}
      {!loading && items && items.length > 0 && <div className="real-business-grid">
        {items.map((item) => <button key={item.id} className="real-business-tile e3-company-tile" type="button" onClick={() => onNavigate('/real/empresas/' + item.id)}>
          <RealPhotoPreview token={token} owner={{kind:'BUSINESS',businessId:item.id}} alt={"Logo de "+item.name} className="e3-company-photo"/>
          <strong>{item.name}</strong>
          <span>{item.category} · {item.activity_kind === 'MIXTO' ? 'Products and services' : item.activity_kind === 'PRODUCTOS' ? 'Products' : 'Services'}</span>
          <span className="e3-company-meta">
            <small className="e3-company-role">{item.membership.role.replaceAll('_', ' ')}</small>
            <small className={item.status === 'ACTIVA' ? 'e3-company-state e3-company-active' : 'e3-company-state'}>{item.status}</small>
          </span>
          <span className="real-business-tile-action">Open company</span>
        </button>)}
      </div>}
      <button type="button" className="real-auth-primary" onClick={() => onNavigate('/real/empresas/nueva')}>Create new business</button>
    </> : route.kind === 'create' ? <>
      <h1>Real new company</h1>
      <p>A company and your membership as an administrative holder will be created through a single transaction in PostgreSQL.</p>
      <p className="real-auth-note">By confirming, you will arrive at Home. From there you can prepare locations, items or services and if you sell physical goods, your inventory. You don't need to complete everything now.</p>
      <p className="real-auth-note">The recovery record only saves name, item, activity, UUID key and date in IndexedDB of this browser. It does not encrypt that data or save credentials: avoid using shared devices.</p>
      {journalState === 'loading' && <p role="status">Checking saved attempts...</p>}
      {journalNote && <p role={journalState === 'error' ? 'alert' : 'status'} className={journalState === 'error' ? 'real-auth-message real-auth-error' : 'real-auth-note'}>{journalNote}</p>}
      {intentOld && <p className="real-auth-message real-ops-warning">This attempt takes more than 30 days. Check your condition with special care before retrying. It is not automatically removed.</p>}
      <form className="real-auth-form" onSubmit={(e) => void createCompany(e)}>
        <fieldset disabled={busy || journalState !== 'ready' || !!pendingCreation} className="real-intent-fields">
          {fields(draft, (field, value) => setDraft((old) => ({ ...old, [field]: value })))}
        </fieldset>
        {!pendingCreation && <label className="real-ops-check"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}/> I agree to keep the data of this request in this browser until it is resolved. Do not use on shared devices.</label>}
        <button className="real-auth-primary" type="submit" disabled={busy || journalState !== 'ready' || (!pendingCreation && !acknowledged)}>{busy ? 'Procesando…' : pendingCreation ? 'Retrying Same Try' : 'Create company'}</button>
      </form>
      {pendingCreation && <div className="real-business-uncertain">
        <strong>There is an attempt to create saved for this account.</strong>
        <p>The log persisted in IndexedDB and will be recovered after F5 when you re-enter the same account. First check the listing, because the server could have confirmed the creation.</p>
        <div className="real-auth-actions">
          <button className="real-auth-secondary" type="button" onClick={() => onNavigate('/real/empresas')}>Consult my companies</button>
          <button className="real-auth-secondary" type="button" onClick={dismissPending}>Discard after verification</button>
        </div>
      </div>}
    </> : <>
      <div className="e3-detail-header">
        <div className="e3-detail-mark"><RealPhotoPreview token={token} owner={{kind:'BUSINESS',businessId:route.businessId}} alt="Company photo" revision={businessPhotoRevision}/></div>
        <div className="e3-detail-heading">
          <h1>Company details</h1>
          <p>Check out the recorded data and tools of your business.</p>
        </div>
        {!loading && selected && <div className="real-auth-actions">
          <button type="button" className="real-auth-primary"
            onClick={() => onNavigate('/real/empresas/'+selected.id+'/inicio')}>
            Start and first steps
          </button>
          {canEditBusiness(selected) && !editing && <button
            type="button" className="real-auth-secondary e3-detail-edit-trigger"
            onClick={() => setEditing(true)}>Edit Data</button>}
        </div>}
      </div>
      {loading && <p role="status">Checking for company membership...</p>}
      {!loading && selected && <>
        <section className="e3-detail-overview" aria-label="Company information">
          <div className="e3-detail-overview-head">
            <div>
              <p className="e3-detail-kicker">Corporate identity</p>
              <h2 className="e3-detail-business-name">{selected.name}</h2>
              <p className="e3-detail-category">{selected.category}</p>
            </div>
            <span className={selected.status === 'ACTIVA' ? 'e3-detail-status e3-detail-status-active' : 'e3-detail-status'}>
              {selected.status === 'ACTIVA' ? 'Active' : 'Suspendida'}
            </span>
          </div>
          <dl className="e3-detail-facts">
            <div><dt>Trade name</dt><dd>{selected.name}</dd></div>
            <div><dt>Rubro</dt><dd>{selected.category}</dd></div>
            <div><dt>Activity</dt><dd>{selected.activity_kind === 'MIXTO' ? 'Products and services' : selected.activity_kind === 'PRODUCTOS' ? 'Products' : 'Services'}</dd></div>
            <div><dt>Tu rol</dt><dd>{selected.membership.role.replaceAll('_', ' ')}</dd></div>
            <div><dt>Membership status</dt><dd>{selected.membership.status}</dd></div>
          </dl>
          <details className="e3-detail-technical">
            <summary>Technical information</summary>
            <dl>
              <div><dt>Business identifier</dt><dd><code>{selected.id}</code></dd></div>
              <div><dt>Date of registration</dt><dd>{selected.created_at}</dd></div>
            </dl>
          </details>
        </section>
        {!editing&&<RealPhotoManager token={token} owner={{kind:'BUSINESS',businessId:selected.id}} title="Photo or logo of the company" canManage={false} onUnauthorized={onUnauthorized} onChanged={()=>setBusinessPhotoRevision(n=>n+1)}/>}
        {canEditBusiness(selected) && editing && <section className="e3-detail-edit-panel" aria-labelledby="e3-edit-heading">
          <h2 id="e3-edit-heading">Edit Company Data</h2>
          <p>Check name, category and activity. Changes are saved only when you confirm.</p>
          <form className="real-auth-form e3-detail-edit-form" aria-label="Company Editing Form" onSubmit={(e) => void updateCompany(e)}>
            {fields(changes, (field, value) => setChanges((old) => ({ ...old, [field]: value })))}
            <div className="real-auth-actions">
              <button className="real-auth-primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
              <button className="real-auth-secondary" type="button" disabled={busy} onClick={() => {
                setEditing(false)
                setChanges({ name: selected.name, category: selected.category, activity_kind: selected.activity_kind })
              }}>Cancel</button>
            </div>
          </form>
          <RealPhotoManager token={token} owner={{kind:'BUSINESS',businessId:selected.id}}
            title="Photo or logo of the company" canManage={true} onUnauthorized={onUnauthorized}
            onChanged={()=>setBusinessPhotoRevision(n=>n+1)}/>
        </section>}
        {!canEditBusiness(selected) && <p className="e3-detail-readonly" role="note">
          This information is read-only for your role or the current state of the company.
        </p>}
        {detailSections.map((group) => <section className="e3-detail-section" key={group.title} aria-label={group.title}>
          <div className="e3-detail-section-head">
            <h2>{group.title}</h2>
            <p>{group.description}</p>
          </div>
          <div className="e3-detail-actions">
            {group.actions.map((action) => <button
              key={action.suffix} type="button" className="e3-detail-action"
              aria-label={'Open ' + action.title}
              onClick={() => onNavigate('/real/empresas/' + selected.id + '/' + action.suffix)}>
              <span className="e3-detail-action-icon" aria-hidden="true">{action.title.slice(0, 1)}</span>
              <span className="e3-detail-action-body">
                <strong>{action.title}</strong>
                <small aria-hidden="true">{action.detail}</small>
              </span>
              <span className="e3-detail-action-arrow" aria-hidden="true">›</span>
            </button>)}
          </div>
        </section>)}
        <p className="e3-detail-footnote">
          Each operation is validated with your user's permissions and API rules.
        </p>
      </>}
    </>}
    {notice && <p className="real-auth-message" role="status">{notice}</p>}
    {error && <p className="real-auth-message real-auth-error" role="alert">{error}</p>}
  </section>
}
