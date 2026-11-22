import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { DemoPhoto, DemoImagePicker } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import { demoGateway, locationKindLabels } from '../../data/demo/demoStore'
import { getLocationMapsLink, locationShareText, mapsSearchUrl } from '../../data/demo/mapsLinks'
import type { DemoBusiness, DemoLocation, LocationInput, LocationKind } from '../../data/demo/demoStore'

const blank: LocationInput = { name: '', kind: 'LOCAL', address: '', mapUrl: '', canSell: true, canStore: false }

function typeIcon(kind: LocationKind) {
  return kind === 'DEPOSITO' ? 'boxes' : kind === 'FERIA' ? 'shopping' : kind === 'OFICINA' ? 'briefcase' : 'pin'
}

export function LocationsPage({ business, locations }: { business: DemoBusiness; locations: DemoLocation[] }) {
  const [editor, setEditor] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<LocationInput>(blank)
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [manualShare, setManualShare] = useState<{ locationId: string; text: string } | null>(null)

  const activeCount = locations.filter((item) => item.status === 'ACTIVA').length
  const primary = locations.find((item) => item.isPrimary && item.status === 'ACTIVA')

  function startCreate() {
    setEditor('new')
    setDraft(blank)
    setPendingStatusId(null)
    setError('')
    setNotice('')
    setManualShare(null)
  }

  function startEdit(location: DemoLocation) {
    setEditor(location.id)
    setDraft({
      name: location.name, kind: location.kind, address: location.address, mapUrl: location.mapUrl,
      canSell: location.canSell, canStore: location.canStore,
    })
    setPendingStatusId(null)
    setError('')
    setNotice('')
    setManualShare(null)
  }

  function cancel() {
    setEditor(null)
    setError('')
    setNotice('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || editor === null) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (editor === 'new') {
        await demoGateway.createLocation(business.id, draft)
        setNotice('DEMO location created for "' + business.name + '».')
      } else {
        await demoGateway.updateLocation(business.id, editor, draft)
        setNotice('DEMO location updated.')
      }
      setEditor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not close temporary folder: %s')
    } finally {
      setBusy(false)
    }
  }

  async function markPrimary(locationId: string) {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await demoGateway.setPrimaryLocation(business.id, locationId)
      setNotice('Main location updated under «' + business.name + '».')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign main location.')
    } finally {
      setBusy(false)
    }
  }

  async function changeStatus(location: DemoLocation) {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const status = location.status === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA'
      await demoGateway.setLocationStatus(business.id, location.id, status)
      setPendingStatusId(null)
      setNotice(status === 'PAUSADA'
        ? 'Pause location. If it was main, the business was left without main location.'
        : 'Reactivated location. You can designate it as the main location when applicable.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.')
    } finally {
      setBusy(false)
    }
  }

  async function copyLocation(location: DemoLocation) {
    setError('')
    setNotice('')
    setManualShare(null)
    const message = locationShareText(business.name, location)
    if (!message) {
      setError('To share the location first add an address or link to Google Maps.')
      return
    }
    try {
      await navigator.clipboard.writeText(message)
      setNotice('Copyed location. You can already paste it into a message or document.')
    } catch {
      // En un navegador sin permiso de portapapeles, ofrecer copia manual.
      setManualShare({ locationId: location.id, text: message })
      setNotice('The browser blocked the clipboard. Select and copy the text from the card.')
    }
  }

  const editingLocation = editor && editor !== 'new' ? locations.find((item) => item.id === editor) : undefined

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">ADMINISTRATION · DEMO COMPANY</p><h1>Locations</h1><p>Premises, warehouses, fairs and workspaces of «{business.name}».</p></div>
      {editor === null && <button type="button" className="button button-primary" onClick={startCreate}><Icon name="plus" size={18}/> New location</button>}
    </div>

    <section className="locations-summary" aria-label="Summary of locations">
      <div><span className="feature-icon blue"><Icon name="pin"/></span><small>Total locations</small><strong>{locations.length}</strong></div>
      <div><span className="feature-icon mint"><Icon name="building"/></span><small>Activas</small><strong>{activeCount}</strong></div>
      <div><span className="feature-icon violet"><Icon name="shield"/></span><small>Main</small><strong className="location-primary-name">{primary?.name ?? 'Unallocated'}</strong></div>
    </section>

    <div className="informational-note location-info-note">
      <Icon name="shield" size={20}/>
      <span>Locations are optional: a service company can operate without premises or deposit. Selling and Store capabilities are independent. The records on this screen are DEMO only.</span>
    </div>

    {error && <p className="form-message error locations-notice" role="alert">{error}</p>}
    {notice && <p className="form-message success locations-notice" role="status">{notice}</p>}

    {editor !== null && <section className="form-panel location-editor">
      <div className="form-panel-header">
        <span className="feature-icon blue"><Icon name={editingLocation ? 'pin' : 'plus'}/></span>
        <div><h2>{editingLocation ? 'Edit Location' : 'New location'}</h2><p>It will only be stored within {business.name}.</p></div>
      </div>
      <form className="demo-form" onSubmit={submit}>
        {editingLocation ? <DemoImagePicker imageKey={demoImageKey('location', business.id, editingLocation.id)} label="Location photo"/> :
          <p className="form-hint">Save the location first; then you can add a photograph from Edit.</p>}
        <div className="locations-form-grid">
          <label className="form-field"><span>Location name *</span>
            <input autoFocus required minLength={2} maxLength={80} value={draft.name} onChange={(event) => setDraft((x) => ({ ...x, name: event.target.value }))} placeholder="E.g.: Local center / Saturday Fair" />
          </label>
          <label className="form-field"><span>Type of space *</span>
            <select value={draft.kind} onChange={(event) => setDraft((x) => ({ ...x, kind: event.target.value as LocationKind }))}>
              {Object.entries(locationKindLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>
        <label className="form-field"><span>Address or reference (optional)</span>
          <input maxLength={160} autoComplete="off" value={draft.address} onChange={(event) => setDraft((x) => ({ ...x, address: event.target.value }))} placeholder="E.g.: Av. Siemviva 123, City (DEMO data)" />
        </label>
        <div className="location-map-form">
          <label className="form-field"><span>Google Maps Link (optional)</span>
            <input type="url" maxLength={2048} autoComplete="off" value={draft.mapUrl} onChange={(event) => setDraft((x) => ({ ...x, mapUrl: event.target.value }))} placeholder="https://maps.app.goo.gl/… o https://www.google.com/maps/…" />
          </label>
          <p className="form-hint">To save a precise point: open Maps, select the location and choose "Share → Copy Link". Paste that link above. If you just complete the address, we will offer a search, not a verified location.</p>
          <a className="location-map-find" href={mapsSearchUrl(draft.address) ?? 'https://www.google.com/maps'} target="_blank" rel="noopener noreferrer">
            <Icon name="pin" size={16}/> {draft.address.trim() ? 'Search this address in Google Maps' : 'Open Google Maps to choose a point'}
          </a>
        </div>
        <fieldset className="location-capabilities">
          <legend>What is this space used for?</legend>
          <label><input type="checkbox" checked={draft.canSell} onChange={(event) => setDraft((x) => ({ ...x, canSell: event.target.checked }))}/><span><strong>Allows sale</strong><small>Point of attention, sale or provision of services</small></span></label>
          <label><input type="checkbox" checked={draft.canStore} onChange={(event) => setDraft((x) => ({ ...x, canStore: event.target.checked }))}/><span><strong>Allows storage</strong><small>Inventory can be associated when this module exists</small></span></label>
        </fieldset>
        <p className="form-hint">A location can have both or none of these capabilities. No stock or box is created automatically.</p>
        <div className="form-actions">
          <button type="button" className="button button-secondary" onClick={cancel} disabled={busy}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Guardando…' : editingLocation ? 'Guardar cambios' : 'Create DEMO Location'}</button>
        </div>
      </form>
    </section>}

    <div className="section-header locations-section-heading"><div><h2>Registered spaces</h2><p>You can edit them and manage their states without deleting them.</p></div></div>

    {locations.length === 0 && <section className="empty-state location-empty">
      <div className="empty-icon"><Icon name="pin" size={34}/></div>
      <h2>No locations yet</h2>
      <p>It is valid not to have establishments. When you want, add a place, warehouse, fair, office or other space.</p>
      {editor === null && <button type="button" className="button button-primary" onClick={startCreate}><Icon name="plus" size={17}/> Create First Location</button>}
    </section>}

    <div className="locations-grid">
      {locations.map((location) => <article className={'location-card' + (location.status === 'PAUSADA' ? ' location-paused' : '')} key={location.id}>
        <div className="location-card-heading">
          <DemoPhoto imageKey={demoImageKey('location', business.id, location.id)} alt={'Foto de ' + location.name}
            fallback={<Icon name={typeIcon(location.kind)} size={22}/>} className="feature-icon blue demo-photo-list"/>
          <div><h3>{location.name}</h3><p>{locationKindLabels[location.kind]}</p></div>
          <span className={'location-status ' + (location.status === 'ACTIVA' ? 'active' : 'paused')}>{location.status === 'ACTIVA' ? 'Active' : 'Pausada'}</span>
        </div>
        <div className="location-tags">
          {location.isPrimary && <span className="small-pill">Main</span>}
          {location.canSell && <span className="location-tag"><Icon name="shopping" size={14}/> Vender</span>}
          {location.canStore && <span className="location-tag"><Icon name="boxes" size={14}/> Almacenar</span>}
          {!location.canSell && !location.canStore && <span className="location-tag">No operational capabilities</span>}
        </div>
        <p className="location-address"><Icon name="pin" size={16}/> {location.address || 'No address or reference'}</p>
        <div className="location-map-actions">
          {(() => {
            const mapsLink = getLocationMapsLink(location)
            return mapsLink ? <a className="location-map-link" href={mapsLink.url} target="_blank" rel="noopener noreferrer">
              <Icon name="pin" size={16}/> {mapsLink.source === 'shared' ? 'See location in Google Maps' : 'Search address in Google Maps'}
            </a> : <span className="location-map-missing">No map or address assigned</span>
          })()}
          <button type="button" className="location-copy-link" onClick={() => copyLocation(location)} disabled={!getLocationMapsLink(location)}>
            <Icon name="book" size={16}/> Copy Location
          </button>
        </div>
        {manualShare?.locationId === location.id && <div className="location-copy-fallback">
          <label htmlFor={'share-location-' + location.id}>Text ready to copy manually</label>
          <textarea id={'share-location-' + location.id} value={manualShare.text} readOnly rows={4} onFocus={(event) => event.currentTarget.select()} />
        </div>}
        <div className="location-actions">
          <button type="button" className="button button-secondary" onClick={() => startEdit(location)} disabled={busy}>Edit</button>
          {!location.isPrimary && location.status === 'ACTIVA' && <button type="button" className="button button-secondary" onClick={() => markPrimary(location.id)} disabled={busy}>Make Main</button>}
          <button type="button" className="button button-secondary" onClick={() => { setPendingStatusId(location.id); setNotice(''); setError('') }} disabled={busy}>
            {location.status === 'ACTIVA' ? 'Pausar' : 'Reactivar'}
          </button>
        </div>
        {pendingStatusId === location.id && <div className="location-confirm">
          <p>{location.status === 'ACTIVA'
            ? 'Pause this location? It will not be removed. In this DEMO there are no stock or box operations yet to review.'
            : 'Reactivate this location to continue using it?'}</p>
          {location.isPrimary && <p>Attention: it will no longer be the main location.</p>}
          <div>
            <button type="button" className="button button-secondary" onClick={() => setPendingStatusId(null)} disabled={busy}>Cancel</button>
            <button type="button" className="button button-primary" onClick={() => changeStatus(location)} disabled={busy}>{busy ? 'Procesando…' : 'Confirm'}</button>
          </div>
        </div>}
      </article>)}
    </div>
  </>
}
