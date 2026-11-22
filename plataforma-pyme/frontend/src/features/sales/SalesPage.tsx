import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoCatalogItem, DemoLocation, DemoSale } from '../../data/demo/demoStore'
import type { DemoCashSession } from '../../data/demo/cashPolicy'
import { moneyDisplay, moneyInput, parseMoneyCents } from '../../data/demo/catalogPolicy'
import { lineTotalCents, parseQuantityMilli, quantityText } from '../../data/demo/purchasePolicy'
import { remainingLastSalePaymentCents, saleAmounts, salePaymentLabels } from '../../data/demo/salePolicy'
import type { SaleInput, SalePaymentMethod } from '../../data/demo/salePolicy'
import { DemoPhoto } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import { stockBalances, stockKey } from '../../data/demo/inventoryPolicy'
import type { InventoryMovement } from '../../data/demo/inventoryPolicy'
import { SaleCatalogPicker } from './SaleCatalogPicker'
import { accountSupportsDeclaredPayment } from '../../data/demo/financialAccountPolicy'
import type { DemoFinancialAccount } from '../../data/demo/financialAccountPolicy'
import type { DemoQrIntent } from '../../data/demo/qrDemoPolicy'
import { QrDemoPanel } from './QrDemoPanel'

type DraftLine = { key: string; catalogItemId: string; quantity: string; price: string }
type DraftPayment = { key: string; method: SalePaymentMethod; amount: string; financialAccountId: string }
const newLine = (): DraftLine => ({ key: crypto.randomUUID(), catalogItemId: '', quantity: '1', price: '' })
const newPayment = (): DraftPayment => ({ key: crypto.randomUUID(), method: 'EFECTIVO', amount: '', financialAccountId: '' })

export function SalesPage({ business, items, locations, movements, sales, sessions, accounts, qrIntents }: {
  business: DemoBusiness
  items: DemoCatalogItem[]
  locations: DemoLocation[]
  movements: InventoryMovement[]
  sales: DemoSale[]
  sessions: DemoCashSession[]
  accounts: DemoFinancialAccount[]
  qrIntents: DemoQrIntent[]
}) {
  const [creating, setCreating] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [qrDetailId, setQrDetailId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [formVersion, setFormVersion] = useState(0)
  const selected = sales.find((sale) => sale.id === detailId)
  const selectedQr = qrIntents.find((intent) => intent.id === qrDetailId)
  const searchable = query.trim().toLocaleLowerCase('es-AR')
  const shown = sales.filter((sale) => !searchable || [
    sale.id, sale.notes, ...sale.lines.flatMap((line) => [line.name, line.sku]),
  ].some((field) => field.toLocaleLowerCase('es-AR').includes(searchable)))
  const sold = sales.reduce((sum, sale) => sum + sale.totalCents, 0)

  function saved(id: string) {
    setCreating(false)
    setQrDetailId(null)
    setDetailId(id)
    setFormVersion((version) => version + 1)
    setNotice('Recorded DEMO sales. Physical product stocks were updated; payments are internal declarations, not external accreditations.')
  }

  function qrCreated(id: string) {
    setCreating(false)
    setDetailId(null)
    setQrDetailId(id)
    setNotice('A pending QR DEMO intent was created: no registered sale, actual collection or stock outing.')
  }

  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">OPERATIONS · DEMO COMPANY</p>
        <h1>Sales</h1>
        <p>Quick sale, discounts, split payments and history of {business.name}.</p>
      </div>
      <button type="button" className="button button-primary" onClick={() => { setCreating(!creating); setDetailId(null); setQrDetailId(null); setNotice('') }}>
        <Icon name={creating ? 'close' : 'plus'} size={17}/>{creating ? 'Cerrar formulario' : 'New sale'}
      </button>
    </div>

    <section className="sales-kpis">
      <div><span className="feature-icon blue"><Icon name="receipt"/></span><small>DEMO sales</small><strong>{sales.length}</strong></div>
      <div><span className="feature-icon mint"><Icon name="chart"/></span><small>Total sales declared</small><strong>{moneyDisplay(sold)}</strong></div>
      <div><span className="feature-icon violet"><Icon name="shopping"/></span><small>Products and services available</small><strong>{items.filter((item) => item.status === 'ACTIVO' && item.sellable).length}</strong></div>
    </section>
    <div className="informational-note">
      <Icon name="shield" size={19}/>
      <span><strong>Local simulation.</strong> Payments are recorded as declared by the operator, not verified in banks or in Pay Market. A sale takes stock only once. Cash collections are included in a cash register only when there is an open day for that location.</span>
    </div>
    {notice && <p className="form-message success" role="status">{notice}</p>}

    {creating && <SaleForm key={business.id + ':' + formVersion}
      business={business} items={items} locations={locations} movements={movements} sessions={sessions}
      accounts={accounts} onSaved={saved} onQrCreated={qrCreated} onCancel={() => setCreating(false)}/>}

    {selectedQr && <QrDemoPanel key={selectedQr.id} intent={selectedQr} business={business}
      onApproved={(saleId) => {
        setQrDetailId(null)
        setDetailId(saleId)
        setNotice('SIMULATE approval completed. A single DEMO sale was created; no real money was received.')
      }}
      onCanceled={() => {
        setNotice('QR DEMO intent cancelled. No sale or stock was recorded.')
      }}
      onClose={() => setQrDetailId(null)}
    />}
    {qrIntents.length > 0 && <section className="form-panel qr-demo-list">
      <div className="business-section-heading">
        <div><Icon name="credit" size={20}/><h2>Intentions QR DEMO</h2></div>
        <span>{qrIntents.filter(intent => intent.status === 'PENDIENTE').length} pendientes</span>
      </div>
      <div className="qr-demo-entries">
        {qrIntents.slice(0, 100).map((intent) => <div className="qr-demo-entry" key={intent.id}>
          <div>
            <strong>{moneyDisplay(intent.amountCents)}</strong>
            <small>{new Date(intent.createdAt).toLocaleString('es-AR')} · {intent.status === 'PENDIENTE' ? 'Pending' : intent.status === 'CANCELADO' ? 'Canceled' : 'Approved (simulated)'}</small>
          </div>
          <button type="button" className="button button-secondary"
            onClick={() => { setQrDetailId(intent.id); setDetailId(null); setCreating(false) }}>
            {intent.status === 'PENDIENTE' ? 'See QR DEMO' : 'View details'}
          </button>
        </div>)}
      </div>
      <p className="qr-demo-muted">A pending or cancelled QR does not appear as a sale or affect inventory.</p>
    </section>}

    <section className="form-panel sales-history">
      <div className="business-section-heading">
        <div><Icon name="receipt" size={21}/><h2>Sales history</h2></div>
        <span>{shown.length} visible from {sales.length}</span>
      </div>
      <label className="form-field sales-search"><span>Search for article, SKU or reference</span>
        <input type="search" placeholder="Search sales..." value={query} onChange={(event) => setQuery(event.target.value)}/>
      </label>
      {shown.length === 0 ? <div className="sales-empty">
        <Icon name="receipt" size={34}/>
        <h3>{sales.length ? 'No results for that search' : 'No registered sales yet'}</h3>
        <p>{sales.length ? 'Try another search.' : 'Register a test sale of goods or services from the "New Sale" button.'}</p>
      </div> : <div className="sales-list">
        {shown.slice(0, 100).map((sale) => <article className="sales-list-row" key={sale.id}>
          <span className="feature-icon blue"><Icon name="receipt" size={20}/></span>
          <div>
            <strong>Sale DEMO · {sale.lines.length} {sale.lines.length === 1 ? 'renglón' : 'renglones'}</strong>
            <small>{new Date(sale.createdAt).toLocaleString('es-AR')} · {sale.lines.map((line) => line.name).join(', ')}</small>
          </div>
          <strong>{moneyDisplay(sale.totalCents)}</strong>
          <button type="button" className="button button-secondary" onClick={() => { setQrDetailId(null); setDetailId(sale.id) }}>See voucher</button>
        </article>)}
      </div>}
      {shown.length > 100 && <p className="inventory-limit">Showing the first 100 sales. Use the search engine to refine.</p>}
    </section>

    {selected && <section className="form-panel sales-detail" aria-label="Demo retail details">
      <div className="business-section-heading">
        <div><Icon name="receipt" size={22}/><h2>DEMO sales check</h2></div>
        <button type="button" className="button button-secondary" onClick={() => setDetailId(null)}><Icon name="close" size={17}/> Close</button>
      </div>
      <p><strong>{business.name}</strong> · {new Date(selected.createdAt).toLocaleString('es-AR')} · <code>{selected.id}</code></p>
      <p>Location: {locations.find((location) => location.id === selected.locationId)?.name ?? 'No physical location (services)'}</p>
      <p>Cashier day: {selected.cashSessionId ? 'Linked to a DEMO day (only adds cash payments).' : 'No linked day; no box archeos.'}</p>
      <div className="sales-receipt-list">
        {selected.lines.map((line) => <div key={line.id}>
          <strong>{line.name}</strong><span>{quantityText(line.quantityMilli, line.unit)} × {moneyDisplay(line.unitPriceCents)}</span>
          <strong>{moneyDisplay(line.lineTotalCents)}</strong>
        </div>)}
      </div>
      <div className="sales-receipt-totals">
        <span>Subtotal</span><strong>{moneyDisplay(selected.subtotalCents)}</strong>
        <span>Discount</span><strong>− {moneyDisplay(selected.discountCents)}</strong>
        <span>Total registered</span><strong>{moneyDisplay(selected.totalCents)}</strong>
      </div>
      <h3>Declared payments</h3>
      {selected.payments.map((payment, index) => <p key={index}>{salePaymentLabels[payment.method]}: <strong>{moneyDisplay(payment.amountCents)}</strong>
        {payment.financialAccountLabelSnapshot && <small> · Account declared: {payment.financialAccountLabelSnapshot}</small>}</p>)}
      {selected.notes && <p>Observaciones: {selected.notes}</p>}
      <div className="informational-note"><Icon name="shield" size={17}/><span>Internal DEMO check. It does not prove actual collection nor does it represent tax proof.</span></div>
    </section>}
  </>
}

function SaleForm({ business, items, locations, movements, sessions, accounts, onSaved, onQrCreated, onCancel }: {
  business: DemoBusiness; items: DemoCatalogItem[]; locations: DemoLocation[]
  movements: InventoryMovement[]
  sessions: DemoCashSession[]
  accounts: DemoFinancialAccount[]
  onSaved: (id: string) => void; onQrCreated: (id: string) => void; onCancel: () => void
}) {
  const [requestId] = useState(() => 'demo-sale-request-' + crypto.randomUUID())
  const [qrRequestId] = useState(() => 'demo-qr-request-' + crypto.randomUUID())
  const [qrSaleRequestId] = useState(() => 'demo-sale-request-' + crypto.randomUUID())
  const [locationId, setLocationId] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([newLine()])
  const [payments, setPayments] = useState<DraftPayment[]>([newPayment()])
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const sellable = items.filter((item) => item.status === 'ACTIVO' && item.sellable)
  const sellLocations = locations.filter((location) => location.status === 'ACTIVA' && location.canSell)
  const byId = new Map(items.map((item) => [item.id, item]))
  const physicalSelected = lines.some((line) => line.catalogItemId && byId.get(line.catalogItemId)?.kind !== 'SERVICIO')
  const eligibleLocations = sellLocations.filter((location) => !physicalSelected || location.canStore)
  const linkedCashSession = sessions.find((session) => session.status === 'ABIERTA' && session.locationId === (locationId || null))
  const hasCash = payments.some((payment) => payment.method === 'EFECTIVO')

  const selectedMilli = new Map<string, number>()
  const selectedIds = new Set<string>()
  for (const line of lines) {
    const item = byId.get(line.catalogItemId)
    if (!item) continue
    selectedIds.add(item.id)
    try {
      selectedMilli.set(item.id, (selectedMilli.get(item.id) ?? 0) +
        parseQuantityMilli(line.quantity, item.unit))
    } catch {
      // Las cantidades incompletas se validarán en el formulario y al confirmar.
    }
  }

  function quickAddItem(itemId: string) {
    const item = byId.get(itemId)
    if (!item || item.status !== 'ACTIVO' || !item.sellable) return
    try {
      const existing = lines.find((line) => line.catalogItemId === item.id)
      const nextMilli = existing ? parseQuantityMilli(existing.quantity, item.unit) + 1000 : 1000
      if (item.kind !== 'SERVICIO') {
        const location = locations.find((loc) => loc.id === locationId)
        if (!location || location.status !== 'ACTIVA' || !location.canSell || !location.canStore) {
          throw new Error('I chose an active location enabled to sell and store.')
        }
        const available = stockBalances(movements).get(stockKey(location.id, item.id)) ?? 0
        if (nextMilli > available) throw new Error('Insufficient stock in this location. Check Inventory.')
      }
      if (existing) {
        patchLine(existing.key, { quantity: String(nextMilli / 1000) })
      } else {
        const empty = lines.find((line) => !line.catalogItemId)
        const fields = {
          catalogItemId: item.id, quantity: '1', price: moneyInput(item.priceCents),
        }
        if (empty) patchLine(empty.key, fields)
        else if (lines.length >= 30) throw new Error('The sale supports up to 30 different items.')
        else setLines((current) => [...current, { key: crypto.randomUUID(), ...fields }])
      }
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add article.')
    }
  }

  function patchLine(key: string, fields: Partial<DraftLine>) {
    setLines((old) => old.map((line) => line.key === key ? { ...line, ...fields } : line))
    setError('')
  }
  function chooseItem(key: string, itemId: string) {
    const item = byId.get(itemId)
    patchLine(key, { catalogItemId: item?.id ?? '', quantity: '1', price: item ? moneyInput(item.priceCents) : '' })
  }
  function patchPayment(key: string, fields: Partial<DraftPayment>) {
    setPayments((old) => old.map((p) => p.key === key ? { ...p, ...fields } : p))
    setError('')
  }
  function makeInput(): SaleInput {
    const validatedLines = lines.map((line, i) => {
      const item = byId.get(line.catalogItemId)
      if (!item) throw new Error('Select an item in the line ' + (i + 1) + '.')
      const unitPriceCents = parseMoneyCents(line.price)
      if (unitPriceCents === null) throw new Error('Enter the price of ' + item.name + '.')
      return {
        catalogItemId: item.id, unitPriceCents,
        quantityMilli: parseQuantityMilli(line.quantity, item.unit),
      }
    })
    const discountCents = parseMoneyCents(discount) ?? 0
    const parsedPayments = payments.map((payment) => {
      const amountCents = parseMoneyCents(payment.amount)
      if (amountCents === null) throw new Error('Complete each amount of payment declared.')
      return { method: payment.method, amountCents, financialAccountId: payment.financialAccountId || null }
    })
    return { locationId: locationId || null, lines: validatedLines, discountCents,
      payments: parsedPayments, notes }
  }

  let totals: ReturnType<typeof saleAmounts> | null = null
  try {
    const candidateLines = lines.map((line) => {
      const item = byId.get(line.catalogItemId)
      if (!item) throw new Error('Line without item.')
      const unitPriceCents = parseMoneyCents(line.price)
      if (unitPriceCents === null) throw new Error('Price pending.')
      return { quantityMilli: parseQuantityMilli(line.quantity, item.unit), unitPriceCents }
    })
    totals = saleAmounts(candidateLines, parseMoneyCents(discount) ?? 0)
  } catch { /* Mientras se completa el formulario no hay total final válido. */ }

  function fillPayment() {
    if (!totals || payments.length === 0) return
    try {
      const amounts = payments.map(payment => parseMoneyCents(payment.amount))
      const remainder = remainingLastSalePaymentCents(totals.totalCents, amounts)
      patchPayment(payments[payments.length - 1].key, { amount: moneyInput(remainder) })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not close temporary folder: %s')
    }
  }

  async function generateQr() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const intent = await demoGateway.createQrDemoIntent(business.id, makeInput(), qrRequestId, qrSaleRequestId)
      onQrCreated(intent.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create the intention QR DEMO.')
    } finally { setBusy(false) }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const sale = await demoGateway.registerSale(business.id, makeInput(), requestId)
      onSaved(sale.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not register the sale.')
    } finally { setBusy(false) }
  }

  return <section className="form-panel sales-form">
    <div className="business-section-heading"><div><Icon name="shopping" size={22}/><h2>Quick sale DEMO</h2></div><span>No actual bank charges</span></div>
    <form className="demo-form" onSubmit={(event) => void submit(event)}>
      <div className="sales-form-top">
        <label className="form-field"><span>Location of sale {physicalSelected ? '*' : '(optional for services)'}</span>
          <select value={locationId} required={Boolean(physicalSelected)} onChange={(event) => setLocationId(event.target.value)}>
            <option value="">No location</option>
            {eligibleLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>
        <p>To sell physical products, I chose an active location enabled to sell and store. Services do not require stock or deposit.</p>
      </div>

      <SaleCatalogPicker
        business={business} items={sellable} locationId={locationId}
        movements={movements} selectedMilli={selectedMilli}
        selectedIds={selectedIds} onAdd={quickAddItem}
      />

      <div className="sales-subheading"><h3>Cart and details of the sale</h3><button type="button" className="button button-secondary" disabled={lines.length >= 30}
        onClick={() => setLines((old) => [...old, newLine()])}><Icon name="plus" size={16}/> Add Line</button></div>
      {lines.map((line, index) => {
        const item = byId.get(line.catalogItemId)
        return <div className="sales-line" key={line.key}>
          <label className="form-field"><span>Item or service {index + 1}</span>
            <select required value={line.catalogItemId} onChange={(event) => chooseItem(line.key, event.target.value)}>
              <option value="">Select…</option>
              {sellable.map((available) => <option key={available.id} value={available.id}>
                {available.name} · {available.kind === 'SERVICIO' ? 'Service' : available.unit}
              </option>)}
            </select>
          </label>
          <label className="form-field"><span>Quantity {item ? '(' + item.unit + ')' : ''}</span>
            <input required type="text" inputMode="decimal" value={line.quantity}
              onChange={(event) => patchLine(line.key, { quantity: event.target.value })}/>
          </label>
          <label className="form-field"><span>Unit price ARS</span>
            <input required type="text" inputMode="decimal" placeholder="Ej.: 2500,00" value={line.price}
              onChange={(event) => patchLine(line.key, { price: event.target.value })}/>
          </label>
          <button type="button" className="button button-secondary sales-delete" disabled={lines.length === 1}
            aria-label={'Remove Line ' + (index + 1)}
            onClick={() => setLines((old) => old.filter((candidate) => candidate.key !== line.key))}>
            <Icon name="close" size={17}/>
          </button>
          {item && <div className="sales-line-preview">
            <DemoPhoto imageKey={demoImageKey('catalog', business.id, item.id)} alt={'Imagen de ' + item.name}
              fallback={<Icon name={item.kind === 'SERVICIO' ? 'briefcase' : 'package'} size={18}/>} className="feature-icon blue demo-photo-list"/>
            <span>{item.kind === 'SERVICIO' ? 'No physical inventory' : 'The sale will deduct stock at the selected location'} · {item.sku || 'Sin SKU'}</span>
            <strong>{(() => { try {
              const cents = parseMoneyCents(line.price)
              return cents === null ? 'A cotizar' : moneyDisplay(lineTotalCents(parseQuantityMilli(line.quantity, item.unit), cents))
            } catch { return 'Review quantity or price' } })()}</strong>
          </div>}
        </div>
      })}

      <div className="sales-summary-panel">
        <div className="sales-subheading"><h3>Discount and total</h3></div>
        <label className="form-field sales-discount"><span>Total discount (ARS, optional)</span>
          <input type="text" inputMode="decimal" value={discount}
            onChange={(event) => setDiscount(event.target.value)} placeholder="0,00"/>
        </label>
        <div className="sales-totals">
          <span>Subtotal</span><strong>{totals ? moneyDisplay(totals.subtotalCents) : '—'}</strong>
          <span>Discount</span><strong>{totals ? moneyDisplay(totals.discountCents) : '—'}</strong>
          <span>Total to register</span><strong>{totals ? moneyDisplay(totals.totalCents) : '—'}</strong>
        </div>
      </div>

      <div className="sales-subheading"><h3>Declared payments</h3>
        <button type="button" className="button button-secondary" disabled={payments.length >= 6}
          onClick={() => setPayments((old) => [...old, newPayment()])}><Icon name="plus" size={16}/> Add Media</button>
      </div>
      <div className="informational-note"><Icon name="shield" size={17}/><span>The amounts declared must add up exactly the total. Digital collections are not verified. To create a DEMO visual QR I chose a single means Mercado Pago declared by the total amount; an pending intention does not record any sale or stock account. The cash register only records associated cash on open day.</span></div>
      {hasCash && <p className={'cash-form-hint ' + (linkedCashSession ? 'linked' : 'unlinked')}>
        <Icon name={linkedCashSession ? 'shield' : 'clock'} size={17}/>
        {linkedCashSession
          ? 'The cash portion of this sale will be linked to the open day of the chosen location.'
          : 'There is no day open for this location. You can register the sale, but cash will not enter into any box arching.'}
      </p>}
      {payments.map((payment, index) => <div className={'sales-payment-row' + (payment.method !== 'EFECTIVO' && payment.method !== 'TARJETA' ? ' has-account' : '')} key={payment.key}>
        <label className="form-field"><span>Payment method {index + 1}</span>
          <select value={payment.method} onChange={(event) => patchPayment(payment.key, { method: event.target.value as SalePaymentMethod, financialAccountId: '' })}>
            {Object.entries(salePaymentLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="form-field"><span>Amount applied ARS</span>
          <input required type="text" inputMode="decimal" placeholder="0,00" value={payment.amount}
            onChange={(event) => patchPayment(payment.key, { amount: event.target.value })}/>
        </label>
        {payment.method !== 'EFECTIVO' && payment.method !== 'TARJETA' && <label className="form-field">
          <span>Receiving account declared (optional)</span>
          <select value={payment.financialAccountId}
            onChange={event => patchPayment(payment.key, { financialAccountId: event.target.value })}>
            <option value="">Unassociated account</option>
            {accounts.filter(a => accountSupportsDeclaredPayment(a, payment.method)).map(a =>
              <option key={a.id} value={a.id}>{a.label} · {a.kind === 'BANCARIA' ? 'Banco' : 'Billetera'}{a.isPrimary ? ' · Principal' : ''}</option>)}
          </select>
          {payment.method === 'TRANSFERENCIA' && <small>You can choose a bank account or virtual wallet with an alias/CVU declared.</small>}
        </label>}
        <button type="button" className="button button-secondary sales-delete" disabled={payments.length === 1}
          aria-label={'Remove Means of Payment ' + (index + 1)}
          onClick={() => setPayments((old) => old.filter((candidate) => candidate.key !== payment.key))}>
          <Icon name="close" size={17}/>
        </button>
      </div>)}
      <button type="button" className="button button-secondary sales-fill" onClick={fillPayment} disabled={!totals || busy}>
        Complete last average with outstanding balance
      </button>
      <label className="form-field"><span>Comments (optional)</span>
        <textarea rows={2} value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} placeholder="Internal sales information..."/>
      </label>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button button-secondary" disabled={busy} onClick={onCancel}>Cancel</button>
        <button type="button" className="button button-secondary" disabled={busy || !totals || (physicalSelected && !locationId)}
          onClick={() => void generateQr()}>
          <Icon name="credit" size={17}/> Generate QR DEMO
        </button>
        <button type="submit" className="button button-primary" disabled={busy || !totals || (physicalSelected && !locationId)}>
          <Icon name="receipt" size={17}/>{busy ? 'Registrando…' : 'Confirm sale DEMO'}
        </button>
      </div>
    </form>
  </section>
}
