import { useState } from 'react'
import { Icon } from '../../app/Icon'
import type { DemoBusiness, DemoCatalogItem, DemoLocation, DemoPurchase, DemoSupplier } from '../../data/demo/demoStore'
import { moneyDisplay } from '../../data/demo/catalogPolicy'
import { physicalPurchaseLines, quantityText } from '../../data/demo/purchasePolicy'
import { PurchaseForm } from './PurchaseForm'
import { PurchaseDetailDialog } from './PurchaseDetailDialog'

type PurchaseFilter = 'TODAS' | 'PENDIENTE' | 'RECIBIDA' | 'INFORMATIVA'
function receiptState(purchase: DemoPurchase): Exclude<PurchaseFilter, 'TODAS'> {
  if (purchase.receipt) return 'RECIBIDA'
  return physicalPurchaseLines(purchase.lines).length ? 'PENDIENTE' : 'INFORMATIVA'
}
const purchaseStatusLabels: Record<Exclude<PurchaseFilter, 'TODAS'>, string> = {
  PENDIENTE: 'Pending receipt',
  RECIBIDA: 'Confirmed reception',
  INFORMATIVA: 'No physical reception',
}

export function PurchasesPage({
  business, purchases, catalog, suppliers, locations,
}: {
  business: DemoBusiness
  purchases: DemoPurchase[]
  catalog: DemoCatalogItem[]
  suppliers: DemoSupplier[]
  locations: DemoLocation[]
}) {
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PurchaseFilter>('TODAS')
  const [notice, setNotice] = useState('')

  const pending = purchases.filter((item) => receiptState(item) === 'PENDIENTE').length
  const received = purchases.filter((item) => receiptState(item) === 'RECIBIDA').length
  const term = query.trim().toLocaleLowerCase('es-AR')
  const filtered = purchases.filter((item) =>
    (filter === 'TODAS' || receiptState(item) === filter) &&
    (!term || [
      item.supplierNameSnapshot, item.reference, item.purchasedOn, item.notes,
      ...item.lines.map((line) => line.description), ...item.lines.map((line) => line.sku),
    ].some((value) => value.toLocaleLowerCase('es-AR').includes(term))))
  const detailed = detailId ? purchases.find((item) => item.id === detailId) : undefined

  function saveSuccess(id: string, containsPhysicalGoods: boolean) {
    setCreating(false)
    setNotice(containsPhysicalGoods
      ? 'Saved purchase. The pending step is to choose the location and confirm receipt of goods for entry into Inventory.'
      : 'Purchase registered with this company. No physical receipt is pending and no payment was recorded.')
    setFilter('TODAS')
    setDetailId(id)
  }

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">OPERATIONS · DEMO COMPANY</p><h1>Purchases</h1>
        <p>Purchases and receptions of "{business.name}», linked to your Catalog and Suppliers.</p></div>
      <button className="button button-primary" type="button" onClick={() => { setCreating((x) => !x); setNotice('') }}>
        <Icon name={creating ? 'close' : 'plus'} size={17}/>
        {creating ? 'Cerrar formulario' : 'Register purchase'}
      </button>
    </div>

    <section className="purchase-summary" aria-label="DEMO purchasing indicators">
      <div><span className="feature-icon blue"><Icon name="receipt"/></span><small>Registered purchases</small><strong>{purchases.length}</strong></div>
      <div><span className="feature-icon orange"><Icon name="clock"/></span><small>Pending receipt</small><strong>{pending}</strong></div>
      <div><span className="feature-icon mint"><Icon name="shield"/></span><small>With confirmed reception</small><strong>{received}</strong></div>
    </section>

    <div className="informational-note purchase-note">
      <Icon name="shield" size={19}/>
      <span>Register a purchase <strong>does not amount to payment or receipt of goods</strong>. Las entradas de stock requieren una confirmación posterior en una ubicación que permita almacenar; los servicios y conceptos libres nunca generan existencias físicas.</span>
    </div>

    {notice && <p className="form-message success purchase-page-message" role="status">{notice}</p>}

    {creating && <PurchaseForm
      key={business.id}
      business={business} catalog={catalog} suppliers={suppliers}
      onSaved={saveSuccess} onCancel={() => setCreating(false)}
    />}

    <section className="form-panel purchase-history">
      <div className="business-section-heading purchase-section-heading">
        <div><Icon name="receipt" size={22}/><h2>Shopping history</h2></div>
        <span>{filtered.length} visible from {purchases.length}</span>
      </div>

      <div className="purchase-filters">
        <label className="form-field"><span>Search by provider, concept, SKU or voucher</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Searching for shopping..."/>
        </label>
        <label className="form-field"><span>State of receipt</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as PurchaseFilter)}>
            <option value="TODAS">All purchases</option>
            <option value="PENDIENTE">Pending receipt</option>
            <option value="RECIBIDA">Confirmed reception</option>
            <option value="INFORMATIVA">No physical reception</option>
          </select>
        </label>
      </div>

      {purchases.length === 0 && <div className="catalog-empty">
        <span className="feature-icon blue"><Icon name="shopping" size={25}/></span>
        <h3>You haven't registered purchases yet.</h3>
        <p>You can start with a directory provider or a free concept. To enter physical items, they must first exist in Catalog and a location suitable for storing.</p>
        {!creating && <button type="button" className="button button-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16}/> First purchase DEMO</button>}
      </div>}

      {purchases.length > 0 && filtered.length === 0 && <div className="catalog-empty">
        <h3>No results on these filters</h3>
        <p>Change reception status or try another search.</p>
        <button type="button" className="button button-secondary" onClick={() => { setFilter('TODAS'); setQuery('') }}>Clear Filters</button>
      </div>}

      <div className="purchase-list">
        {filtered.map((purchase) => {
          const state = receiptState(purchase)
          return <article key={purchase.id} className="purchase-card">
            <div className="purchase-card-icon"><Icon name="shopping" size={21}/></div>
            <div className="purchase-card-copy">
              <div className="purchase-card-title"><h3>{purchase.supplierNameSnapshot || 'Purchase without supplier'}</h3>
                <span className={'purchase-state state-' + state.toLowerCase()}>{purchaseStatusLabels[state]}</span>
              </div>
              <p>{new Date(purchase.purchasedOn + 'T12:00:00').toLocaleDateString('es-AR')} · {purchase.reference || 'No voucher'} · {purchase.lines.length} {purchase.lines.length === 1 ? 'renglón' : 'renglones'}</p>
              <div className="purchase-card-items">{purchase.lines.slice(0, 3).map((line) =>
                <span key={line.id}>{line.description} · {quantityText(line.quantityMilli, line.unit)}</span>)}
                {purchase.lines.length > 3 && <span>+ {purchase.lines.length - 3} more</span>}
              </div>
            </div>
            <div className="purchase-card-right">
              <strong>{moneyDisplay(purchase.totalCents)}</strong>
              <button type="button" className="button button-secondary" onClick={() => setDetailId(purchase.id)}>
                {state === 'PENDIENTE' ? 'Confirm location and reception' : 'View purchase'} <Icon name="arrow" size={15}/>
              </button>
            </div>
          </article>
        })}
      </div>
    </section>

    {detailed && <PurchaseDetailDialog
      purchase={detailed} business={business} locations={locations}
      onClose={() => setDetailId(null)}
    />}
  </>
}
