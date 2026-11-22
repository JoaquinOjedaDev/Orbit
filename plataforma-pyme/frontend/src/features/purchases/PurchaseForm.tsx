import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoCatalogItem, DemoSupplier } from '../../data/demo/demoStore'
import { moneyDisplay, moneyInput, parseMoneyCents } from '../../data/demo/catalogPolicy'
import {
  lineTotalCents, parseQuantityMilli, quantityText, sumLineTotals,
} from '../../data/demo/purchasePolicy'
import type { PurchaseInput, PurchaseLineInput, PurchaseUnit } from '../../data/demo/purchasePolicy'

type LineDraft = {
  id: string
  catalogId: string
  description: string
  quantityText: string
  costText: string
}
type Draft = {
  purchasedOn: string
  supplierId: string
  reference: string
  notes: string
  lines: LineDraft[]
}
const newLine = (): LineDraft => ({
  id: crypto.randomUUID(), catalogId: '', description: '',
  quantityText: '1', costText: '',
})
function todayLocal(): string {
  const date = new Date()
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-')
}

export function PurchaseForm({
  business, catalog, suppliers, onSaved, onCancel,
}: {
  business: DemoBusiness
  catalog: DemoCatalogItem[]
  suppliers: DemoSupplier[]
  onSaved: (purchaseId: string, containsPhysicalGoods: boolean) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(() => ({
    purchasedOn: todayLocal(), supplierId: '', reference: '', notes: '', lines: [newLine()],
  }))
  // Se conserva un ID de solicitud mientras el formulario está montado:
  // doble clic o reintento de envío no pueden crear una segunda compra DEMO.
  const [requestId] = useState(() => 'demo-request-' + crypto.randomUUID())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const activeCatalog = catalog.filter((item) => item.status === 'ACTIVO')
  const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'ACTIVO')
  const containsPhysicalGoods = draft.lines.some((line) =>
    catalog.some((item) => item.id === line.catalogId && item.kind !== 'SERVICIO'))

  function updateLine(id: string, fields: Partial<LineDraft>) {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => line.id === id ? { ...line, ...fields } : line),
    }))
  }

  function selectCatalog(id: string, catalogId: string) {
    const item = catalog.find((entry) => entry.id === catalogId && entry.status === 'ACTIVO')
    updateLine(id, {
      catalogId: item?.id ?? '',
      description: item?.name ?? '',
      costText: item?.referenceCostCents === null || !item ? '' : moneyInput(item.referenceCostCents),
      quantityText: '1',
    })
  }

  function makeInput(): PurchaseInput {
    const lines: PurchaseLineInput[] = draft.lines.map((line, i) => {
      const article = line.catalogId ? catalog.find((item) => item.id === line.catalogId) : undefined
      if (line.catalogId && !article) throw new Error('Item not available in line ' + (i + 1) + '.')
      const unit: PurchaseUnit = article?.unit ?? 'CONCEPTO'
      const cents = parseMoneyCents(line.costText)
      if (cents === null) throw new Error('Completing the unit cost of line ' + (i + 1) + ' (zero if cost-free).')
      return {
        catalogItemId: article?.id ?? null,
        description: article?.name ?? line.description,
        unit, quantityMilli: parseQuantityMilli(line.quantityText, unit),
        unitCostCents: cents,
      }
    })
    return {
      purchasedOn: draft.purchasedOn,
      supplierId: draft.supplierId || null,
      reference: draft.reference,
      notes: draft.notes,
      lines,
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const purchase = await demoGateway.registerPurchase(business.id, makeInput(), requestId)
      onSaved(purchase.id, containsPhysicalGoods)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The purchase could not be registered.')
    } finally {
      setSaving(false)
    }
  }

  let previewTotal: number | null = null
  try {
    const values = draft.lines.map((line) => {
      const item = line.catalogId ? catalog.find((entry) => entry.id === line.catalogId) : undefined
      const cents = parseMoneyCents(line.costText)
      if (cents === null) throw new Error('Uninformed cost.')
      return { totalCents: lineTotalCents(parseQuantityMilli(line.quantityText, item?.unit ?? 'CONCEPTO'), cents) }
    })
    previewTotal = sumLineTotals(values)
  } catch {
    // Preview incompleto: no modifica datos ni genera importes aproximados.
  }

  return <section className="form-panel purchase-editor">
    <div className="form-panel-header">
      <span className="feature-icon blue"><Icon name="shopping" size={24}/></span>
      <div><h2>Register purchase</h2><p>Checker and concepts of "{business.name}". It does not amount to payment or receipt of goods.</p></div>
    </div>
    <div className="purchase-flow-steps" aria-label="Registration and reception stages">
      <div className="purchase-flow-step current"><span className="purchase-flow-number">1</span>
        <div><strong>Register purchase</strong><small>I chose items, quantities and costs.</small></div>
      </div>
      <div className="purchase-flow-step"><span className="purchase-flow-number">2</span>
        <div><strong>Confirm location and reception</strong><small>After saving, only for physical goods.</small></div>
      </div>
    </div>
    <form className="demo-form" onSubmit={submit}>
      <section className="purchase-form-section">
        <h3>1. Purchase data</h3>
        <div className="purchase-form-grid">
          <label className="form-field"><span>Date of purchase *</span>
            <input required type="date" min="2000-01-01" max="2100-12-31"
              value={draft.purchasedOn} onChange={(e) => setDraft((d) => ({ ...d, purchasedOn: e.target.value }))}/>
          </label>
          <label className="form-field"><span>Provider (optional)</span>
            <select value={draft.supplierId} onChange={(e) => setDraft((d) => ({ ...d, supplierId: e.target.value }))}>
              <option value="">No assigned provider</option>
              {activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </label>
          <label className="form-field"><span>Number of vouchers or reference (optional)</span>
            <input maxLength={70} value={draft.reference} onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))} placeholder="Ej.: FACT-A-001 / ticket"/>
          </label>
          <label className="form-field"><span>Moneda</span><input readOnly value="ARS · Pesos argentinos (DEMO)"/></label>
        </div>
      </section>

      <section className="purchase-form-section">
        <div className="purchase-section-title">
          <div><h3>2. Products, services and concepts</h3><small>Up to 30 lines. Each free concept is informative and will not generate stocks.</small></div>
          <button type="button" className="button button-secondary" disabled={draft.lines.length >= 30 || saving}
            onClick={() => setDraft((d) => ({ ...d, lines: [...d.lines, newLine()] }))}>
            <Icon name="plus" size={16}/> Add Line
          </button>
        </div>
        {draft.lines.map((line, index) => {
          const item = line.catalogId ? catalog.find((entry) => entry.id === line.catalogId) : undefined
          const unit: PurchaseUnit = item?.unit ?? 'CONCEPTO'
          let lineValue: number | null = null
          try {
            const unitCost = parseMoneyCents(line.costText)
            if (unitCost !== null) lineValue = lineTotalCents(parseQuantityMilli(line.quantityText, unit), unitCost)
          } catch { /* No mostrar un subtotal erróneo. */ }
          return <div key={line.id} className="purchase-line">
            <div className="purchase-line-heading">
              <strong>Line {index + 1}</strong>
              <button type="button" className="button button-secondary" disabled={saving || draft.lines.length === 1}
                onClick={() => setDraft((d) => ({ ...d, lines: d.lines.filter((entry) => entry.id !== line.id) }))}>Remove</button>
            </div>
            <div className="purchase-line-grid">
              <label className="form-field purchase-line-selector"><span>Origin of the concept *</span>
                <select value={line.catalogId} onChange={(e) => selectCatalog(line.id, e.target.value)}>
                  <option value="">Free concept (out of stock)</option>
                  {activeCatalog.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.kind === 'SERVICIO' ? 'Service' : 'Physical article'}</option>)}
                </select>
              </label>
              <label className="form-field purchase-line-description"><span>Description *</span>
                <input value={item?.name ?? line.description} readOnly={!!item} required minLength={2} maxLength={140}
                  onChange={(e) => updateLine(line.id, { description: e.target.value })}
                  placeholder="E.g.: Packaging material, repair of equipment..."/>
              </label>
              <label className="form-field"><span>Cantidad *</span>
                <input required inputMode="decimal" maxLength={13} value={line.quantityText}
                  onChange={(e) => updateLine(line.id, { quantityText: e.target.value })} placeholder="1 o 0,500"/>
              </label>
              <label className="form-field"><span>Unit</span>
                <input readOnly value={unit === 'CONCEPTO' ? 'Concepto' : unit}/>
              </label>
              <label className="form-field"><span>Unit cost (ARS) *</span>
                <input required inputMode="decimal" value={line.costText} maxLength={14}
                  onChange={(e) => updateLine(line.id, { costText: e.target.value })} placeholder="Ej.: 1250,50"/>
              </label>
              <div className="purchase-line-subtotal"><span>Subtotal</span><strong>{lineValue === null ? 'Pending' : moneyDisplay(lineValue)}</strong></div>
            </div>
            <p className="purchase-line-footnote">
              {item?.kind === 'SERVICIO' ? 'Service: does not generate physical stock.' :
                item ? 'Catalogue Good: can be received in a storage location. Your original drive is maintained, without converting packages or boxes.' :
                'Free concept: it serves to document an expense or purchase without entering stock.'}
              {item && <> · {quantityText(1000, unit)} = 1 control unit.</>}
            </p>
          </div>
        })}
      </section>

      <section className="purchase-form-section">
        <h3>3. Observaciones</h3>
        <label className="form-field"><span>Internal notes (optional)</span>
          <textarea maxLength={500} rows={3} value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            placeholder="E.g.: Delivery agreed for next week..."/>
        </label>
      </section>

      <div className="purchase-total-box">
        <div><small>Total purchase (ARS)</small><strong>{previewTotal === null ? 'Complete costs and amounts' : moneyDisplay(previewTotal)}</strong></div>
        <p>{containsPhysicalGoods
          ? 'Step 1: Save the purchase. Then the detail will open, where you will choose the location and confirm the receipt. The stock does not change until then.'
          : 'When saving only the purchase is recorded. If you choose physical goods, the receipt and its location are confirmed later. This record does not represent a payment.'}</p>
      </div>
      {containsPhysicalGoods && <p className="purchase-location-pending" role="status">
        <Icon name="clock" size={17}/>
        <span><strong>The reception location is still to be confirmed.</strong> First keep these items; then I chose the destination in detail and confirm entry to Inventory.</span>
      </p>}
      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button button-secondary" disabled={saving} onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={saving}>
          <Icon name="receipt" size={17}/> {saving ? 'Guardando…' : containsPhysicalGoods ? 'Save purchase and choose location' : 'Register purchase DEMO'}
        </button>
      </div>
    </form>
  </section>
}
