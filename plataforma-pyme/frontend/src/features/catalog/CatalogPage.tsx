import { useState } from 'react'
import { CatalogDetailDialog } from './CatalogDetailDialog'
import { DemoImagePicker, DemoPhoto } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import type { IconName } from '../../app/navigation'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoCatalogItem } from '../../data/demo/demoStore'
import {
  catalogKinds, catalogKindLabels, catalogUnits, catalogUnitLabels,
  moneyDisplay, moneyInput, parseMoneyCents,
} from '../../data/demo/catalogPolicy'
import type { CatalogInput, CatalogKind, CatalogUnit } from '../../data/demo/catalogPolicy'

type CatalogDraft = Omit<CatalogInput, 'priceCents' | 'referenceCostCents'> & {
  priceText: string
  costText: string
}

const defaultDraft: CatalogDraft = {
  name: '', kind: 'REVENTA', category: 'General', sku: '', unit: 'UNIDAD',
  description: '', observations: '', sellable: true, priceText: '', costText: '',
}

const kindIcon: Record<CatalogKind, IconName> = {
  ELABORADO: 'package',
  REVENTA: 'shopping',
  INSUMO: 'boxes',
  SERVICIO: 'briefcase',
}

function draftOf(item: DemoCatalogItem): CatalogDraft {
  return {
    name: item.name, kind: item.kind, category: item.category, sku: item.sku,
    unit: item.unit, description: item.description, observations: item.observations ?? '', sellable: item.sellable,
    priceText: moneyInput(item.priceCents), costText: moneyInput(item.referenceCostCents),
  }
}

function toInput(draft: CatalogDraft): CatalogInput {
  return {
    name: draft.name, kind: draft.kind, category: draft.category, sku: draft.sku,
    unit: draft.unit, description: draft.description, observations: draft.observations, sellable: draft.sellable,
    priceCents: parseMoneyCents(draft.priceText),
    referenceCostCents: parseMoneyCents(draft.costText),
  }
}

export function CatalogPage({
  business, items,
}: {
  business: DemoBusiness
  items: DemoCatalogItem[]
}) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<CatalogDraft>(defaultDraft)
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<CatalogKind | 'TODOS'>('TODOS')
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('ACTIVO')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmationId, setConfirmationId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const active = items.filter((item) => item.status === 'ACTIVO').length
  const serviceCount = items.filter((item) => item.kind === 'SERVICIO').length
  const term = search.trim().toLocaleLowerCase('es-AR')
  const filtered = items.filter((item) => {
    if (kindFilter !== 'TODOS' && item.kind !== kindFilter) return false
    if (statusFilter !== 'TODOS' && item.status !== statusFilter) return false
    return !term || [item.name, item.sku, item.category, item.description]
      .some((value) => value.toLocaleLowerCase('es-AR').includes(term))
  })

  function startCreate() {
    setEditingId('new')
    setDraft(defaultDraft)
    setDetailId(null)
    setConfirmationId(null)
    setError('')
    setNotice('')
  }

  function startEdit(item: DemoCatalogItem) {
    setEditingId(item.id)
    setDraft(draftOf(item))
    setDetailId(null)
    setConfirmationId(null)
    setError('')
    setNotice('')
  }

  function cancelEdit() {
    setEditingId(null)
    setError('')
  }

  function setKind(kind: CatalogKind) {
    setDraft((current) => ({
      ...current,
      kind,
      unit: kind === 'SERVICIO' ? 'SERVICIO' : current.unit === 'SERVICIO' ? 'UNIDAD' : current.unit,
      sellable: kind === 'INSUMO' ? false : current.kind === 'INSUMO' ? true : current.sellable,
    }))
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || editingId === null) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const input = toInput(draft)
      if (editingId === 'new') {
        await demoGateway.createCatalogItem(business.id, input)
        setNotice('Article or DEMO service created for "' + business.name + '». No stock was generated.')
      } else {
        await demoGateway.updateCatalogItem(business.id, editingId, input)
        setNotice('Updated DEMO statement. No inventory quantities were changed.')
      }
      setEditingId(null)
      setStatusFilter('TODOS')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not close temporary folder: %s')
    } finally {
      setBusy(false)
    }
  }

  async function toggleStatus(item: DemoCatalogItem) {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const status = item.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
      await demoGateway.setCatalogItemStatus(business.id, item.id, status)
      setConfirmationId(null)
      setNotice(status === 'INACTIVO'
        ? 'Inactivated article. The file is preserved and appears with the Inactive filter.'
        : 'Article reactivated in the DEMO catalogue.')
      setStatusFilter('TODOS')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.')
    } finally {
      setBusy(false)
    }
  }

  const currentlyEditing = editingId !== null && editingId !== 'new'
    ? items.find((item) => item.id === editingId)
    : undefined
  const detailItem = detailId ? items.find((item) => item.id === detailId) : undefined

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">OPERATIONS · DEMO COMPANY</p><h1>Product and service catalog</h1><p>Products, inputs and services from "{business.name}».</p></div>
      <button type="button" className="button button-primary" onClick={editingId === null ? startCreate : cancelEdit} disabled={busy}>
        <Icon name={editingId === null ? 'plus' : 'close'} size={18}/>
        {editingId === null ? 'Add article or service' : 'Close form'}
      </button>
    </div>

    <section className="catalog-summary" aria-label="Catalogue summary">
      <div><span className="feature-icon blue"><Icon name="package"/></span><small>Registered files</small><strong>{items.length}</strong></div>
      <div><span className="feature-icon mint"><Icon name="shield"/></span><small>Activas</small><strong>{active}</strong></div>
      <div><span className="feature-icon violet"><Icon name="briefcase"/></span><small>Services</small><strong>{serviceCount}</strong></div>
    </section>

    <div className="informational-note catalog-info-note"><Icon name="shield" size={19}/><span>
      The tokens are unique to this company. <strong>service has no physical stock</strong>.
      Registrar un producto o insumo tampoco crea stock: las existencias se actualizan desde Compras, Inventario y Ventas.
      Los precios son de demostración y se expresan en pesos argentinos (ARS).
    </span></div>

    {error && <p className="form-message error catalog-feedback" role="alert">{error}</p>}
    {notice && <p className="form-message success catalog-feedback" role="status">{notice}</p>}

    {editingId !== null && <section className="form-panel catalog-editor" aria-label="Catalogue form">
      <div className="form-panel-header">
        <span className="feature-icon blue"><Icon name={currentlyEditing ? 'package' : 'plus'}/></span>
        <div><h2>{currentlyEditing ? 'Edit Catalog Tab' : 'Add to Catalogue'}</h2><p>
          {currentlyEditing ? 'You will edit only the "' + currentlyEditing.name + '».' : 'Create a product, input or service without mandatory initial stock.'}
        </p></div>
      </div>
      <form className="demo-form" onSubmit={saveItem}>
        {currentlyEditing ? <DemoImagePicker imageKey={demoImageKey('catalog', business.id, currentlyEditing.id)} label="Image of the article or service"/> :
          <p className="form-hint">Save the tab first; then you can add your photo from Edit.</p>}
        <div className="catalog-form-grid">
          <label className="form-field"><span>Name of article or service *</span>
            <input required minLength={2} maxLength={90} autoFocus value={draft.name} onChange={(e) => setDraft((x) => ({ ...x, name: e.target.value }))} placeholder="E.g.: Product, input or test service" />
          </label>
          <label className="form-field"><span>Type *</span>
            <select value={draft.kind} onChange={(e) => setKind(e.target.value as CatalogKind)}>
              {catalogKinds.map((kind) => <option key={kind} value={kind}>{catalogKindLabels[kind]}</option>)}
            </select>
          </label>
          <label className="form-field"><span>Category *</span>
            <input required maxLength={60} minLength={2} value={draft.category} onChange={(e) => setDraft((x) => ({ ...x, category: e.target.value }))} placeholder="E.g.: Accessories / Services / Materials" />
          </label>
          <label className="form-field"><span>Control unit *</span>
            <select value={draft.unit} disabled={draft.kind === 'SERVICIO'} onChange={(e) => setDraft((x) => ({ ...x, unit: e.target.value as CatalogUnit }))}>
              {catalogUnits.filter((unit) => draft.kind === 'SERVICIO' ? unit === 'SERVICIO' : unit !== 'SERVICIO').map((unit) =>
                <option key={unit} value={unit}>{catalogUnitLabels[unit]}</option>)}
            </select>
          </label>
          <label className="form-field"><span>Own SKU (optional)</span>
            <input maxLength={32} autoComplete="off" value={draft.sku} onChange={(e) => setDraft((x) => ({ ...x, sku: e.target.value }))} placeholder="Ej.: ART-001" />
          </label>
          <label className="form-field"><span>List price (ARS, optional)</span>
            <input inputMode="decimal" maxLength={14} autoComplete="off" value={draft.priceText} onChange={(e) => setDraft((x) => ({ ...x, priceText: e.target.value }))} placeholder="Ej.: 1500,50" />
          </label>
          <label className="form-field"><span>Reference cost (ARS, optional)</span>
            <input inputMode="decimal" maxLength={14} autoComplete="off" value={draft.costText} onChange={(e) => setDraft((x) => ({ ...x, costText: e.target.value }))} placeholder="Ej.: 800,00" />
          </label>
          <div className="catalog-sellable">
            <label><input type="checkbox" checked={draft.sellable} onChange={(e) => setDraft((x) => ({ ...x, sellable: e.target.checked }))}/>
              <span><strong>Available for sale or offer</strong><small>An input can only be for internal consumption.</small></span>
            </label>
          </div>
        </div>
        <label className="form-field"><span>Commercial description (optional)</span>
          <textarea rows={3} maxLength={450} value={draft.description} onChange={(e) => setDraft((x) => ({ ...x, description: e.target.value }))} placeholder="Public or commercial information visible on the sheet."/>
        </label>
        <label className="form-field"><span>Internal comments (optional)</span>
          <textarea rows={3} maxLength={600} value={draft.observations} onChange={(e) => setDraft((x) => ({ ...x, observations: e.target.value }))} placeholder="Internal indications, care and reminders of the team."/>
          <small>They are stored in this local DEMO; there is still no permission to read from a server.</small>
        </label>
        <p className="form-hint">The SKU is unique within each company, but can be repeated in different businesses. Packages, boxes or kilos are not automatically converted to other units. No price means "To quote".</p>
        <div className="form-actions">
          <button type="button" className="button button-secondary" onClick={cancelEdit} disabled={busy}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving…' : currentlyEditing ? 'Save changes' : 'Add to DEMO Catalogue'}</button>
        </div>
      </form>
    </section>}

    <section className="form-panel catalog-list-panel">
      <div className="business-section-heading catalog-list-heading">
        <div><Icon name="package" size={22}/><h2>Articles and services</h2></div>
        <span>{filtered.length} visible from {items.length}</span>
      </div>
      <div className="catalog-filters">
        <label className="form-field"><span>Search by name, SKU, category or description</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the catalog..." />
        </label>
        <label className="form-field"><span>Type</span>
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as CatalogKind | 'TODOS')}>
            <option value="TODOS">All types</option>
            {catalogKinds.map((kind) => <option key={kind} value={kind}>{catalogKindLabels[kind]}</option>)}
          </select>
        </label>
        <label className="form-field"><span>Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option><option value="TODOS">All</option>
          </select>
        </label>
      </div>

      {items.length === 0 && <div className="catalog-empty">
        <span className="feature-icon blue"><Icon name="package" size={25}/></span>
        <h3>Your catalog is still empty.</h3>
        <p>Add your first product, input or service. A service company can start without inventory or locations.</p>
        {editingId === null && <button className="button button-primary" type="button" onClick={startCreate}><Icon name="plus" size={17}/> Add First Tab</button>}
      </div>}
      {items.length > 0 && filtered.length === 0 && <div className="catalog-empty">
        <h3>No matches</h3><p>Try another search or change the filters. Inactive chips are kept in the catalog.</p>
        <button className="button button-secondary" type="button" onClick={() => { setSearch(''); setKindFilter('TODOS'); setStatusFilter('TODOS') }}>Clear Filters</button>
      </div>}
      <div className="catalog-grid">
        {filtered.map((item) => <article key={item.id} className={'catalog-card'+(item.status === 'INACTIVO' ? ' catalog-card-inactive' : '')}>
          <div className="catalog-card-head">
            <DemoPhoto imageKey={demoImageKey('catalog', business.id, item.id)} alt={'Imagen de ' + item.name}
              fallback={<Icon name={kindIcon[item.kind]} size={23}/>} className="feature-icon blue demo-photo-list"/>
            <div className="catalog-card-title"><h3>{item.name}</h3><span>{catalogKindLabels[item.kind]}</span></div>
            <span className={'catalog-state '+(item.status === 'ACTIVO' ? 'is-active' : 'is-inactive')}>{item.status === 'ACTIVO' ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="catalog-tags"><span>{item.category}</span><span>{catalogUnitLabels[item.unit]}</span>{item.sku && <span>SKU: {item.sku}</span>}</div>
          <p className="catalog-description">{item.description || 'No commercial description.'}</p>
          <div className="catalog-value-row">
            <div><small>List price</small><strong>{item.sellable ? moneyDisplay(item.priceCents) : 'Not offered for sale'}</strong></div>
            <div><small>Reference cost</small><strong>{item.referenceCostCents === null ? 'No informado' : moneyDisplay(item.referenceCostCents)}</strong></div>
          </div>
          <div className="catalog-card-note">{item.kind === 'SERVICIO'
            ? 'Service: no physical stock of its own'
            : 'Product or material: consults its inventory in Inventory'}</div>
          <div className="catalog-card-actions">
            <button type="button" className="button button-secondary" onClick={() => { setDetailId(item.id); setConfirmationId(null) }}>Ver ficha</button>
            <button type="button" className="button button-secondary" onClick={() => startEdit(item)} disabled={busy}>Edit</button>
            <button type="button" className="button button-secondary" onClick={() => { setConfirmationId(confirmationId === item.id ? null : item.id); setDetailId(null) }} disabled={busy}>{item.status === 'ACTIVO' ? 'Desactivar' : 'Reactivar'}</button>
          </div>
          {confirmationId === item.id && <section className="catalog-confirm">
            <p>Do you want to {item.status === 'ACTIVO' ? 'desactivar' : 'reactivar'} Does not delete your registration or change stocks.</p>
            <div><button className="button button-secondary" type="button" onClick={() => setConfirmationId(null)} disabled={busy}>Cancel</button>
              <button className="button button-primary" type="button" onClick={() => toggleStatus(item)} disabled={busy}>{busy ? 'Procesando…' : 'Confirm'}</button></div>
          </section>}
        </article>)}
      </div>
    </section>
    {detailItem && <CatalogDetailDialog
      item={detailItem}
      onClose={() => setDetailId(null)}
      onEdit={(item) => startEdit(item)}
    />}
  </>
}
