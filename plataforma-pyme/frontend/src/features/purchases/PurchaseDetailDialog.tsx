import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoPurchase, DemoBusiness, DemoLocation } from '../../data/demo/demoStore'
import { moneyDisplay } from '../../data/demo/catalogPolicy'
import { physicalPurchaseLines, quantityText } from '../../data/demo/purchasePolicy'

export function PurchaseDetailDialog({
  purchase, business, locations, onClose,
}: {
  purchase: DemoPurchase
  business: DemoBusiness
  locations: DemoLocation[]
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [locationId, setLocationId] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const physical = physicalPurchaseLines(purchase.lines)
  const availableLocations = locations.filter((location) => location.status === 'ACTIVA' && location.canStore)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  async function receive() {
    if (busy || !locationId || purchase.receipt) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await demoGateway.receivePurchase(business.id, purchase.id, locationId)
      setNotice('DEMO reception confirmed once. Purchase and movements were saved.')
      setConfirming(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'It was not possible to confirm the reception.')
    } finally {
      setBusy(false)
    }
  }

  const locationName = purchase.receipt
    ? locations.find((location) => location.id === purchase.receipt?.locationId)?.name ?? 'Location retained in history'
    : null

  return <dialog
    ref={dialogRef}
    className="catalog-detail-modal purchase-detail-modal"
    aria-labelledby="purchase-detail-title"
    onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
  >
    <div className="catalog-detail-body">
      <div className="catalog-detail-topline">
        <p className="eyebrow">BUY REGISTRADA · DEMO</p>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close purchase detail"><Icon name="close" size={20}/></button>
      </div>
      <header className="purchase-detail-head">
        <div>
          <div className="purchase-title-line"><h2 id="purchase-detail-title">Purchase details</h2><span className="catalog-state is-active">Registrada</span></div>
          <p>{new Date(purchase.purchasedOn + 'T12:00:00').toLocaleDateString('es-AR')} · {purchase.supplierNameSnapshot || 'No assigned provider'}</p>
          <p className="purchase-detail-reference">{purchase.reference ? 'Comprobante: ' + purchase.reference : 'No voucher number'}</p>
        </div>
        <span className="purchase-detail-total">{moneyDisplay(purchase.totalCents)}</span>
      </header>
      <section className="purchase-detail-section">
        <h3><Icon name="receipt" size={18}/> Lines saved</h3>
        <div className="purchase-table-wrap">
          <table className="purchase-table">
            <thead><tr><th>Concepto</th><th>Quantity</th><th>Costo unit.</th><th>Subtotal</th></tr></thead>
            <tbody>{purchase.lines.map((line) => <tr key={line.id}>
              <td><strong>{line.description}</strong><small>{line.kind === 'BIEN' ? 'Physically good catalog' : line.kind === 'SERVICIO' ? 'Servicio sin stock' : 'Concepto libre'}{line.sku && ' · SKU ' + line.sku}</small></td>
              <td>{quantityText(line.quantityMilli, line.unit)}</td>
              <td>{moneyDisplay(line.unitCostCents)}</td>
              <td>{moneyDisplay(line.totalCents)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {purchase.notes && <div className="purchase-notes"><strong>Observaciones</strong><p>{purchase.notes}</p></div>}
        <p className="purchase-detail-muted">The amounts, concepts and the name of the supplier are a historical photo: they do not change when editing later Catalog or Suppliers. Registering this purchase does not represent a payment.</p>
      </section>

      <section className="purchase-detail-section">
        <h3><Icon name="boxes" size={18}/> Step 2 · Location and receipt of goods</h3>
        {purchase.receipt ? <>
          <div className="purchase-received-banner"><Icon name="shield" size={20}/><span>Receipt confirmed · {locationName} · {new Date(purchase.receipt.createdAt).toLocaleString('es-AR')}</span></div>
          <div className="purchase-received-lines">{purchase.receipt.movements.map((movement) => {
            const line = purchase.lines.find((entry) => entry.id === movement.purchaseLineId)
            return <div key={movement.id}><span>{line?.description ?? 'Catalogue Article'}</span><strong>+ {quantityText(movement.quantityMilli, movement.unit)}</strong></div>
          })}</div>
          <p className="purchase-detail-muted">Unique reception for this purchase. Re-inquire or retry does not duplicate movements. These events will feed the Inventory by location.</p>
        </> : physical.length === 0 ? <p className="purchase-detail-muted">This purchase contains only services or free concepts. There are no physical goods from the Catalogue to enter the inventory.</p>
          : <>
            <p className="purchase-location-pending"><Icon name="clock" size={17}/><span><strong>Saved purchase · location to be confirmed.</strong> The articles have not yet entered the Inventory. I chose where they were received and confirmed their entry.</span></p>
            <p className="purchase-detail-muted">Received {physical.length} {physical.length === 1 ? 'physical line' : 'physical lines'} Free services and concepts do not enter stock. No conversions of boxes, packages, kilos or other units are made.</p>
            {availableLocations.length === 0 ? <div className="purchase-warning">
              To receive a location you need <strong>activa</strong> that has the capacity "Can store" enabled. Create or edit it in <strong>Locations</strong>.
            </div> : <>
              <div className="purchase-receipt-preview">
                {physical.map((line) => <div key={line.id}><span>{line.description}</span><strong>+ {quantityText(line.quantityMilli, line.unit)}</strong></div>)}
              </div>
              <label className="form-field purchase-location-select"><span>Reception location (to be confirmed) *</span>
                <select value={locationId} onChange={(event) => { setLocationId(event.target.value); setConfirming(false) }}>
                  <option value="">Select active location with storage...</option>
                  {availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.kind}</option>)}
                </select>
              </label>
              {!confirming && <button type="button" className="button button-primary" disabled={!locationId || busy} onClick={() => setConfirming(true)}>
                <Icon name="truck" size={17}/> Check location and merchandise
              </button>}
              {confirming && <div className="purchase-confirm-receipt">
                <strong>Confirmation of entry</strong>
                <p>To be registered {physical.length} {physical.length === 1 ? 'entrada' : 'entradas'} en «{availableLocations.find((location) => location.id === locationId)?.name}». This operation cannot be edited or repeated; partial receptions will be incorporated in another increment.</p>
                <div>
                  <button type="button" className="button button-secondary" disabled={busy} onClick={() => setConfirming(false)}>Back</button>
                  <button type="button" className="button button-primary" disabled={busy || !locationId} onClick={receive}>{busy ? 'Confirmando…' : 'Confirm location and enter Inventory'}</button>
                </div>
              </div>}
            </>}
          </>}
        {notice && <p className="form-message success purchase-inline-feedback" role="status">{notice}</p>}
        {error && <p className="form-message error purchase-inline-feedback" role="alert">{error}</p>}
      </section>
      <footer className="catalog-detail-footer">
        <div className="catalog-detail-dates"><span>Empresa: {business.name}</span><span>Registered in DEMO: {new Date(purchase.createdAt).toLocaleString('es-AR')}</span></div>
        <button type="button" className="button button-secondary" disabled={busy} onClick={onClose}>Close detail</button>
      </footer>
    </div>
  </dialog>
}
