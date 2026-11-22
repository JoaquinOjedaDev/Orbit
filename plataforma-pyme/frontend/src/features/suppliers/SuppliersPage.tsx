import { useState } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoSupplier } from '../../data/demo/demoStore'
import type { SupplierInput } from '../../data/demo/supplierPolicy'
import { supplierPaymentLabels, weekdays } from '../../data/demo/supplierPolicy'
import { SupplierForm } from './SupplierForm'
import { DemoPhoto } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import { SupplierDetailDialog } from './SupplierDetailDialog'

export function SuppliersPage({
  business, suppliers,
}: {
  business: DemoBusiness
  suppliers: DemoSupplier[]
}) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmationId, setConfirmationId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ACTIVO' | 'INACTIVO' | 'TODOS'>('ACTIVO')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const term = search.trim().toLocaleLowerCase('es-AR')
  const filtered = suppliers.filter((supplier) =>
    (statusFilter === 'TODOS' || statusFilter === supplier.status) &&
    (!term || [supplier.name, supplier.offerings, supplier.contactPerson, supplier.phone,
      supplier.email, supplier.address, supplier.notes].some((v) => v.toLocaleLowerCase('es-AR').includes(term))))
  const activeCount = suppliers.filter((supplier) => supplier.status === 'ACTIVO').length
  const editing = editingId && editingId !== 'new' ? suppliers.find((supplier) => supplier.id === editingId) : undefined
  const detailed = detailId ? suppliers.find((supplier) => supplier.id === detailId) : undefined

  function create() {
    setEditingId('new')
    setDetailId(null)
    setConfirmationId(null)
    setNotice('')
    setError('')
  }
  function edit(supplier: DemoSupplier) {
    setEditingId(supplier.id)
    setDetailId(null)
    setConfirmationId(null)
    setNotice('')
    setError('')
  }
  async function save(input: SupplierInput) {
    if (editingId === null) return
    if (editingId === 'new') {
      await demoGateway.createSupplier(business.id, input)
      setNotice('DEMO Provider created for only "' + business.name + '».')
    } else {
      await demoGateway.updateSupplier(business.id, editingId, input)
      setNotice('Updated supplier\'s statement. No actual purchases or payment terms were modified.')
    }
    setEditingId(null)
    setStatusFilter('TODOS')
  }
  async function changeStatus(supplier: DemoSupplier) {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const next = supplier.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
      await demoGateway.setSupplierStatus(business.id, supplier.id, next)
      setConfirmationId(null)
      setStatusFilter('TODOS')
      setNotice(next === 'INACTIVO'
        ? 'Supplier disabled without deleting your tab. Historical purchases will be linked later.'
        : 'Supplier reactivated in this company DEMO.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">OPERATIONS · DEMO COMPANY</p>
        <h1>Suppliers</h1>
        <p>Contacts and trading conditions of "{business.name}».</p>
      </div>
      <button type="button" className="button button-primary" disabled={busy}
        onClick={editingId === null ? create : () => setEditingId(null)}>
        <Icon name={editingId === null ? 'plus' : 'close'} size={18}/>
        {editingId === null ? 'Add Provider' : 'Cerrar formulario'}
      </button>
    </div>

    <section className="supplier-stats" aria-label="Summary of vendors">
      <div><span className="feature-icon blue"><Icon name="truck"/></span><small>Total registered</small><strong>{suppliers.length}</strong></div>
      <div><span className="feature-icon mint"><Icon name="shield"/></span><small>Activos</small><strong>{activeCount}</strong></div>
      <div><span className="feature-icon violet"><Icon name="credit"/></span><small>Inactivos</small><strong>{suppliers.length - activeCount}</strong></div>
    </section>

    <div className="informational-note supplier-info-note">
      <Icon name="shield" size={19}/>
      <span>Independent suppliers per company. No purchases or vouchers linked yet. The informed promotions do not generate automatic discounts and contacts are only demonstration.</span>
    </div>

    {notice && <p className="form-message success supplier-message" role="status">{notice}</p>}
    {error && <p className="form-message error supplier-message" role="alert">{error}</p>}

    {editingId !== null && <SupplierForm
      key={editingId}
      businessName={business.name}
      supplier={editing}
      onCancel={() => setEditingId(null)}
      onSave={save}
    />}

    <section className="form-panel supplier-list-panel">
      <div className="business-section-heading supplier-list-heading">
        <div><Icon name="truck" size={22}/><h2>Supplier Directory</h2></div>
        <span>{filtered.length} visible from {suppliers.length}</span>
      </div>
      <div className="supplier-filters">
        <label className="form-field"><span>Search by name, product, contact or address</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search supplier..."/>
        </label>
        <label className="form-field"><span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="TODOS">All</option>
          </select>
        </label>
      </div>
      {suppliers.length === 0 && <div className="catalog-empty supplier-empty">
        <span className="feature-icon blue"><Icon name="truck" size={25}/></span>
        <h3>No suppliers yet</h3>
        <p>You can register contacts without linking them to products or making a purchase. For a service company, this section may also be empty.</p>
        {editingId === null && <button type="button" className="button button-primary" onClick={create}><Icon name="plus" size={16}/> Add First Provider</button>}
      </div>}
      {suppliers.length > 0 && filtered.length === 0 && <div className="catalog-empty">
        <h3>No matches</h3><p>Try another search or include inactive suppliers.</p>
        <button type="button" className="button button-secondary" onClick={() => { setSearch(''); setStatusFilter('TODOS') }}>Clear Filters</button>
      </div>}
      <div className="supplier-list">
        {filtered.map((supplier) => <article key={supplier.id} className={'supplier-card' + (supplier.status === 'INACTIVO' ? ' supplier-card-inactive' : '')}>
          <DemoPhoto imageKey={demoImageKey('supplier', business.id, supplier.id)} alt={'Foto de ' + supplier.name}
            fallback={supplier.name.slice(0, 1).toUpperCase()} className="supplier-card-avatar"/>
          <div className="supplier-card-main">
            <div className="supplier-card-title"><h3>{supplier.name}</h3>
              <span className={'catalog-state '+(supplier.status === 'ACTIVO' ? 'is-active' : 'is-inactive')}>{supplier.status === 'ACTIVO' ? 'Active' : 'Inactive'}</span>
            </div>
            <p>{supplier.offerings || 'No specified products or services'}</p>
            <div className="supplier-card-chips">
              {supplier.contactPerson && <span><Icon name="user" size={14}/>{supplier.contactPerson}</span>}
              {supplier.phone && <span><Icon name="receipt" size={14}/>{supplier.phone}</span>}
              {supplier.paymentMethods.slice(0, 3).map((method) => <span key={method}>{supplierPaymentLabels[method]}</span>)}
            </div>
            {supplier.promotions.length > 0 && <p className="supplier-card-promo"><Icon name="credit" size={15}/> {supplier.promotions[0].benefit}
              <span>· {supplier.promotions[0].days.length ? supplier.promotions[0].days.map((day) => weekdays[day].slice(0, 3)).join(', ') : 'No defined days'}</span>
            </p>}
          </div>
          <div className="supplier-card-actions">
            <button type="button" className="button button-secondary" onClick={() => { setDetailId(supplier.id); setConfirmationId(null) }}>Ver ficha</button>
            <button type="button" className="button button-secondary" onClick={() => edit(supplier)}>Edit</button>
            <button type="button" className="button button-secondary" disabled={busy} onClick={() => { setConfirmationId(confirmationId === supplier.id ? null : supplier.id); setNotice('') }}>
              {supplier.status === 'ACTIVO' ? 'Desactivar' : 'Reactivar'}
            </button>
          </div>
          {confirmationId === supplier.id && <div className="supplier-confirm">
            <p>- You're sure? {supplier.status === 'ACTIVO' ? 'desactivar' : 'reactivar'} «{supplier.name}»? The file will not be deleted. Historical relations will be preserved when there are purchases.</p>
            <div>
              <button className="button button-secondary" type="button" disabled={busy} onClick={() => setConfirmationId(null)}>Cancel</button>
              <button className="button button-primary" type="button" disabled={busy} onClick={() => changeStatus(supplier)}>{busy ? 'Procesando…' : 'Confirm'}</button>
            </div>
          </div>}
        </article>)}
      </div>
    </section>

    {detailed && <SupplierDetailDialog supplier={detailed} business={business}
      onClose={() => setDetailId(null)}
      onEdit={(supplier) => edit(supplier)} />}
  </>
}
