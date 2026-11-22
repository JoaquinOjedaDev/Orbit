import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon.tsx'
import './realPeopleOperations.css'
import { ApiHttpError, ApiTransportError } from '../../api/httpClient.ts'
import { canManageLocations, createOperationsGateway, operationsError } from '../businesses/realOperationsGateway.ts'
import type { Assignment, LocationInput, LocationKind, LocationRecord, TeamMember } from '../businesses/realOperationsGateway.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import { RealSetupGuide } from '../onboarding/RealSetupGuide.tsx'
import { locationSetupSuggestion } from '../onboarding/realSetupGuidance.ts'

const kinds: LocationKind[] = ['LOCAL', 'FERIA', 'DEPOSITO', 'OFICINA', 'CASA', 'OTRO']
const blank: LocationInput = { name: '', kind: 'LOCAL', address: '', map_url: '', can_sell: true, can_store: true }

type Props = { token: string; userId: string; businessId: string; onNavigate: (path: string) => void; onUnauthorized: () => void }

export function RealLocationsPage({ token, userId, businessId, onNavigate, onUnauthorized }: Props) {
  const gateway = useMemo(() => createOperationsGateway(token, userId), [token, userId])
  const active = useRef({ valid: true })
  const assignmentGeneration = useRef(0)
  const backButtonRef = useRef<HTMLButtonElement>(null)
  const listHeadingRef = useRef<HTMLHeadingElement>(null)
  const previousView = useRef<'list' | 'editor' | 'assignments'>('list')
  const [business, setBusiness] = useState<RealBusiness | null>(null)
  const [rows, setRows] = useState<LocationRecord[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [locationForAssignments, setLocationForAssignments] = useState<string | null>(null)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState<LocationInput>(blank)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'ACTIVA' | 'PAUSADA'>('TODAS')

  useEffect(() => {
    const controller = new AbortController()
    const gate = active.current
    gate.valid = true
    void Promise.all([
      gateway.business(businessId, controller.signal),
      gateway.locations(businessId, controller.signal),
    ]).then(([company, locations]) => {
      if (controller.signal.aborted || !gate.valid) return
      setBusiness(company); setRows(locations)
    }).catch((err: unknown) => {
      if (controller.signal.aborted || !gate.valid) return
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else setError(operationsError(err))
    }).finally(() => {
      if (gate.valid && !controller.signal.aborted) setLoading(false)
    })
    return () => { controller.abort(); gate.valid = false }
  }, [gateway, businessId, onUnauthorized])

  const authorized = !!business && canManageLocations(business)
  const selected = rows.find((row) => row.id === locationForAssignments)
  const eligibleMembers = members.filter((m) =>
    m.status === 'ACTIVA' && (m.role === 'ENCARGADO' || m.role === 'TRABAJADOR'))

  function handleError(err: unknown) {
    if (!active.current.valid) return
    if (err instanceof ApiHttpError && err.status === 401) { onUnauthorized(); return }
    setError(operationsError(err))
    if (err instanceof ApiTransportError && err.outcomeUnknown) setUncertain(true)
  }

  async function refresh() {
    if (busy) return
    setError(''); setNotice('')
    setLoading(true)
    try {
      const [company, locations] = await Promise.all([
        gateway.business(businessId), gateway.locations(businessId),
      ])
      if (!active.current.valid) return
      setBusiness(company); setRows(locations); setUncertain(false)
      assignmentGeneration.current += 1
      setLocationForAssignments(null); setAssignments([]); setMembers([]); setLoadingAssignments(false)
      setCreating(false); setEditingId(null); setDraft(blank)
    } catch (err) { handleError(err) }
    finally { if (active.current.valid) setLoading(false) }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!authorized || busy || uncertain) return
    setBusy(true); setError(''); setNotice('')
    const normalized: LocationInput = { ...draft, name: draft.name.trim(), address: draft.address.trim(), map_url: draft.map_url.trim() }
    try {
      const saved = editingId
        ? await gateway.updateLocation(businessId, editingId, normalized)
        : await gateway.createLocation(businessId, normalized)
      if (!active.current.valid) return
      setRows((old) => editingId ? old.map((item) => item.id === saved.id ? saved : item) : [...old, saved])
      setEditingId(null); setCreating(false); setDraft(blank)
      setNotice('Location confirmed in PostgreSQL.')
    } catch (err) { handleError(err) }
    finally { if (active.current.valid) setBusy(false) }
  }

  async function mutateLocation(row: LocationRecord, command: 'primary' | 'status') {
    if (!authorized || busy || uncertain) return
    if (command === 'status' && !window.confirm(
      row.status === 'ACTIVA' ? 'Pausing this location can prevent operations and remove your main condition. Continue?' : 'Reactivate this location?'
    )) return
    setError(''); setNotice(''); setBusy(true)
    try {
      const saved = command === 'primary' ? await gateway.makePrimary(businessId, row.id)
        : await gateway.setLocationStatus(businessId, row.id, row.status === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA')
      if (!active.current.valid) return
      // A change of primary affects the previous primary too. Re-read the full set.
      const updated = await gateway.locations(businessId)
      if (!active.current.valid) return
      setRows(updated)
      setNotice(saved.is_primary ? 'Headquarters updated.' : 'State of the updated headquarters.')
    } catch (err) { handleError(err) }
    finally { if (active.current.valid) setBusy(false) }
  }

  function openCreate() {
    if (!authorized || busy || uncertain) return
    setDraft(blank); setEditingId(null); setCreating(true); setError(''); setNotice('')
  }

  function closeSubview() {
    if (busy) return
    assignmentGeneration.current += 1
    setCreating(false); setEditingId(null); setDraft(blank)
    setLocationForAssignments(null); setAssignments([]); setMembers([]); setLoadingAssignments(false)
    setError(''); setNotice('')
  }

  function openEdit(row: LocationRecord) {
    if (!authorized || busy || uncertain) return
    assignmentGeneration.current += 1
    setLocationForAssignments(null)
    setDraft({ name: row.name, kind: row.kind, address: row.address, map_url: row.map_url,
      can_sell: row.can_sell, can_store: row.can_store })
    setEditingId(row.id); setCreating(true); setError(''); setNotice('')
  }

  async function openAssignments(location: LocationRecord) {
    if (!authorized || busy) return
    setCreating(false); setEditingId(null); setDraft(blank)
    const generation = ++assignmentGeneration.current
    setLocationForAssignments(location.id); setLoadingAssignments(true)
    setAssignments([]); setMembers([]); setError(''); setNotice('')
    try {
      const [assigned, team] = await Promise.all([
        gateway.assignments(businessId, location.id), gateway.team(businessId),
      ])
      if (!active.current.valid || generation !== assignmentGeneration.current) return
      setAssignments(assigned); setMembers(team)
    } catch (err) {
      if (generation === assignmentGeneration.current) handleError(err)
    } finally {
      if (active.current.valid && generation === assignmentGeneration.current) setLoadingAssignments(false)
    }
  }

  async function changeAssignment(member: TeamMember, status: 'ACTIVA'|'REVOCADA') {
    if (!selected || !authorized || busy) return
    const locationId = selected.id
    const generation = assignmentGeneration.current
    setError(''); setNotice(''); setBusy(true)
    try {
      const updated = await gateway.setAssignment(businessId, locationId, member.id, status)
      if (!active.current.valid || generation !== assignmentGeneration.current) return
      setAssignments((old) => [...old.filter((a) => a.membership_id !== updated.membership_id), updated])
      setNotice(status === 'ACTIVA' ? 'Assignment activated.' : 'Assignment revoked.')
    } catch (err) { if (generation === assignmentGeneration.current) handleError(err) }
    finally { if (active.current.valid) setBusy(false) }
  }

  const visibleRows = rows.filter((loc) =>
    (statusFilter === 'TODAS' || loc.status === statusFilter)
    && [loc.name, loc.kind, loc.address].some((value) => value.toLocaleLowerCase('es-AR').includes(search.trim().toLocaleLowerCase('es-AR'))))
  const activeCount = rows.filter((loc) => loc.status === 'ACTIVA').length

  const locationView = creating ? 'editor' : locationForAssignments ? 'assignments' : 'list'
  const focusLocation = rows.find((row) => row.id === (editingId ?? locationForAssignments))
  const setupSuggestion = locationSetupSuggestion({
    verified: !loading && !error && !!business && locationView === 'list',
    count: rows.length, activeCount, canManage: authorized,
  })
  useEffect(() => {
    if (locationView === previousView.current) return
    if (locationView === 'list') listHeadingRef.current?.focus()
    else backButtonRef.current?.focus()
    previousView.current = locationView
  }, [locationView])

  return <section className="real-auth-card real-business-panel e3-ops-page e3-locations-page e3-location-workspace">
    {locationView === 'list' && <>
    <nav className="real-business-nav" aria-label="Company navigation">
      <button type="button" className="real-auth-link" onClick={() => onNavigate('/real/empresas/' + businessId)}>Company</button>
      <button type="button" className="real-auth-link" onClick={() => onNavigate('/real/empresas/' + businessId + '/equipo')}>Equipo</button>
      <button type="button" className="real-auth-link" onClick={() => onNavigate('/real/empresas/' + businessId + '/inicio')}>First steps</button>
      <button type="button" className="real-auth-link" onClick={() => onNavigate('/real/empresas')}>My companies</button>
    </nav>
    </>}
    {locationView !== 'list' && <div className="e3-location-subview-backbar">
      <button ref={backButtonRef} type="button" className="e3-location-back-button" onClick={closeSubview} disabled={busy}>
        <Icon name="arrow-left" size={19}/>Back to Locations
      </button>
      <span className="e3-location-view-badge">{locationView === 'editor' ? 'Headquarters edition' : 'Staff and accesses'}</span>
    </div>}
    {locationView === 'list' ? <header className="e3-ops-heading">
      <div className="e3-ops-heading-icon"><Icon name="pin" size={29}/></div>
      <div className="e3-ops-heading-copy">
        <span className="e3-ops-kicker">Organization · Headquarters</span>
        <h1 ref={listHeadingRef} tabIndex={-1}>Locations</h1>
        <p>You will manage the places where you sell and store merchandise.</p>
      </div>
      {authorized && <button className="real-auth-primary e3-ops-heading-cta" type="button" disabled={busy || uncertain} onClick={openCreate}><Icon name="plus" size={17}/>Create real location</button>}
    </header> : <header className="e3-ops-heading e3-location-subview-header">
      <div className="e3-ops-heading-icon"><Icon name={locationView === 'editor' ? 'pin' : 'users'} size={29}/></div>
      <div className="e3-ops-heading-copy">
        <span className="e3-ops-kicker">{business?.name ?? 'Company'} · Ubicaciones</span>
        <h1>{locationView === 'editor' ? (editingId ? 'Edit Location' : 'New location') : 'Headquarters allocations'}</h1>
        <p>{locationView === 'editor' ? (focusLocation?.name ?? 'New headquarters') : (selected?.name ?? 'Sede seleccionada')}</p>
      </div>
    </header>}
    {loading && <p role="status">Loading Locations...</p>}
    {uncertain && <p className="real-auth-message real-ops-warning" role="alert">Uncertain writing result. Consult the updated status before repeating; no other request will be sent automatically. <button className="real-auth-link" type="button" onClick={() => void refresh()}>Check Locations</button></p>}
    {notice && <p className="real-auth-message" role="status">{notice}</p>}
    {error && <p className="real-auth-message real-auth-error" role="alert">{error}</p>}
    {!loading && business && <>
      {locationView === 'list' && <>
      <div className="e3-ops-context">
        <span>Empresa: <strong>{business.name}</strong></span>
        <button className="real-auth-secondary" type="button" onClick={() => void refresh()} disabled={busy}>Update List</button>
      </div>
      <div className="e3-ops-summary" aria-label="Summary of locations">
        <div className="e3-ops-stat"><span>Total headquarters</span><strong>{rows.length}</strong></div>
        <div className="e3-ops-stat"><span>Activas</span><strong>{activeCount}</strong></div>
        <div className="e3-ops-stat"><span>Pausadas</span><strong>{rows.length - activeCount}</strong></div>
        <div className="e3-ops-stat"><span>Headquarters</span><strong className="e3-ops-stat-name">{rows.find((loc) => loc.is_primary)?.name ?? 'Undefined'}</strong></div>
      </div>
      <RealSetupGuide suggestion={setupSuggestion} businessId={businessId} onNavigate={onNavigate}/>
      {rows.length > 0 && <div className="e3-ops-filterbar">
        <label className="e3-ops-search"><Icon name="search" size={18}/><span className="e3-ops-visually-hidden">Find Locations</span>
          <input type="search" aria-label="Find Locations" placeholder="Search by name, type or address" value={search} onChange={(e) => setSearch(e.target.value)}/></label>
        <label className="e3-ops-filter-label">Status
          <select aria-label="Filter Locations by State" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="TODAS">All</option><option value="ACTIVA">Activas</option><option value="PAUSADA">Pausadas</option>
          </select>
        </label>
      </div>}
      {rows.length === 0 && <div className="real-business-empty e3-ops-empty"><Icon name="pin" size={30}/><strong>Your company doesn't have locations yet</strong><p>It will create a headquarters to start organizing sales and inventory, according to your permissions.</p></div>}
      {rows.length > 0 && visibleRows.length === 0 && <div className="real-business-empty e3-ops-empty"><strong>We didn't find headquarters with those filters.</strong><p>Try another search or select "All".</p></div>}
      <div className="real-business-grid e3-ops-card-grid">
        {visibleRows.map((loc) => <article className="real-business-tile real-ops-tile e3-ops-location-card" key={loc.id}>
          <div className="e3-ops-card-top">
            <span className="e3-ops-location-icon"><Icon name="pin" size={21}/></span>
            <div className="e3-ops-card-flags">
              {loc.is_primary && <span className="e3-ops-pill e3-ops-pill-primary">Main</span>}
              <span className={'e3-ops-pill ' + (loc.status === 'ACTIVA' ? 'e3-ops-pill-active' : 'e3-ops-pill-paused')}>{loc.status}</span>
            </div>
          </div>
          <div className="e3-ops-card-title"><strong>{loc.name}</strong><span>{loc.kind.replaceAll('_', ' ')}</span></div>
          <p className="e3-ops-address">{loc.address || 'Unreported address'}</p>
          <div className="e3-ops-capabilities">
            <span className={loc.can_sell ? 'e3-ops-capability-on' : ''}><Icon name="receipt" size={15}/>{loc.can_sell ? 'Enabling sales' : 'No sales'}</span>
            <span className={loc.can_store ? 'e3-ops-capability-on' : ''}><Icon name="boxes" size={15}/>{loc.can_store ? 'Inventario habilitado' : 'No inventory'}</span>
          </div>
          {loc.map_url && <a className="e3-ops-map-link" href={loc.map_url} target="_blank" rel="noopener noreferrer">See Map location</a>}
          {authorized && <div className="real-auth-actions e3-ops-card-actions">
            <button className="real-auth-secondary" type="button" disabled={busy || uncertain} onClick={() => openEdit(loc)}>Edit</button>
            <button className="real-auth-secondary" type="button" disabled={busy || uncertain} onClick={() => void mutateLocation(loc, 'status')}>{loc.status === 'ACTIVA' ? 'Pausar' : 'Reactivar'}</button>
            {loc.status === 'ACTIVA' && !loc.is_primary && <button className="real-auth-secondary" type="button" disabled={busy || uncertain} onClick={() => void mutateLocation(loc, 'primary')}>Make Main</button>}
            <button className="real-auth-secondary" type="button" disabled={busy} onClick={() => void openAssignments(loc)}>Asignaciones</button>
          </div>}
        </article>)}
      </div>
      </>}
      {locationView === 'editor' && authorized && (
        <section className="e3-ops-editor e3-ops-editor-screen" aria-label="Location Form">
        <div className="e3-ops-section-heading"><h2>Location information</h2><p>Complete the data for this location. Changes will be saved only to the selected company.</p></div>
        <form className="real-auth-form real-ops-form e3-ops-form" onSubmit={(e) => void save(e)}>
          <div className="e3-ops-form-grid">
            <label>Name<input required minLength={2} maxLength={80} value={draft.name} onChange={(e) => setDraft((old) => ({ ...old, name:e.target.value }))}/></label>
            <label>Type<select value={draft.kind} onChange={(e) => setDraft((old) => ({ ...old, kind:e.target.value as LocationKind }))}>{kinds.map(k=><option value={k} key={k}>{k}</option>)}</select></label>
            <label className="e3-ops-wide">Address<input maxLength={160} value={draft.address} onChange={(e) => setDraft((old) => ({ ...old, address:e.target.value }))}/></label>
            <label className="e3-ops-wide">Google Maps (URL HTTPS allowed)<input type="url" maxLength={2048} placeholder="https://www.google.com/maps/…" value={draft.map_url} onChange={(e) => setDraft((old) => ({ ...old, map_url:e.target.value }))}/></label>
          </div>
          <div className="e3-ops-toggle-group" aria-label="Headquarters capacities">
            <label className="real-ops-check"><input type="checkbox" checked={draft.can_sell} onChange={(e) => setDraft((old) => ({ ...old, can_sell:e.target.checked }))}/> Allow sales</label>
            <label className="real-ops-check"><input type="checkbox" checked={draft.can_store} onChange={(e) => setDraft((old) => ({ ...old, can_store:e.target.checked }))}/> Allow inventory</label>
          </div>
          <div className="real-auth-actions e3-ops-form-actions">
            <button className="real-auth-primary" type="submit" disabled={busy || uncertain}>{busy ? 'Guardando…' : 'Guardar en PostgreSQL'}</button>
            <button className="real-auth-secondary" type="button" onClick={closeSubview} disabled={busy}>Cancel</button>
          </div>
        </form>
      </section>
      )}
      {locationView === 'assignments' && authorized && selected && (
        <section className="real-ops-subpanel e3-ops-assignments e3-ops-assignments-screen" aria-label="Headquarters allocations">
        <div className="e3-ops-section-heading"><h2>Staff assigned</h2><p>Only active managers and workers can be assigned to a headquarters.</p></div>
        {loadingAssignments ? <p role="status">Checking assignments...</p> : <>
          {eligibleMembers.length === 0 && <p>There are no workers available yet. You can invite them from Team.</p>}
          {eligibleMembers.map((member) => {
            const row = assignments.find((a) => a.membership_id === member.id)
            const activeAssignment = row?.status === 'ACTIVA'
            return <div className="real-ops-person" key={member.id}>
              <div className="e3-ops-person-identity">
                <span className="e3-ops-avatar" aria-hidden="true">{member.display_name.slice(0, 1).toLocaleUpperCase('es-AR')}</span>
                <div><strong>{member.display_name}</strong><small>{member.role.replaceAll('_', ' ')} · {activeAssignment ? 'ASIGNADO' : 'NO ASIGNADO'}</small></div>
              </div>
              <button className="real-auth-secondary" type="button" disabled={busy} onClick={() => void changeAssignment(member, activeAssignment ? 'REVOCADA' : 'ACTIVA')}>{activeAssignment ? 'Recall Assignment' : 'Assign to headquarters'}</button>
            </div>
          })}
        </>}
      </section>
      )}
    </>}
  </section>
}
