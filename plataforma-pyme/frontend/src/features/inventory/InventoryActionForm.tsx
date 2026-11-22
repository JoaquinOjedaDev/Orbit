import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoCatalogItem, DemoLocation } from '../../data/demo/demoStore'
import type { InventoryMovement } from '../../data/demo/inventoryPolicy'
import { parseCountedMilli, stockBalance } from '../../data/demo/inventoryPolicy'
import { parseQuantityMilli, quantityText } from '../../data/demo/purchasePolicy'

export function InventoryActionForm({
  business, catalog, locations, movements, kind, onDone, onCancel,
}: {
  business: DemoBusiness
  catalog: DemoCatalogItem[]
  locations: DemoLocation[]
  movements: InventoryMovement[]
  kind: 'TRANSFER' | 'COUNT'
  onDone: (message: string) => void
  onCancel: () => void
}) {
  const [requestId] = useState(() => 'demo-inventory-request-' + crypto.randomUUID())
  const [itemId, setItemId] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const physical = catalog.filter((item) => item.status === 'ACTIVO' && item.kind !== 'SERVICIO')
  const allowedLocations = locations.filter((location) => location.status === 'ACTIVA' && location.canStore)
  const item = physical.find((entry) => entry.id === itemId)
  const current = item && sourceId ? stockBalance(movements, sourceId, itemId) : null
  let preview: string | null = null
  try {
    if (item && quantity.trim()) {
      const number = kind === 'COUNT'
        ? parseCountedMilli(quantity, item.unit)
        : parseQuantityMilli(quantity, item.unit)
      if (kind === 'COUNT' && current !== null) {
        const difference = number - current
        preview = difference === 0 ? 'The count matches the current balance.'
          : (difference > 0 ? 'Adjustment entry: ' : 'Set-off: ') + quantityText(Math.abs(difference), item.unit)
      } else if (kind === 'TRANSFER') {
        preview = 'A trasladar: ' + quantityText(number, item.unit)
      }
    }
  } catch {
    // No mostrar valores aproximados si el ingreso todavía es inválido.
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (!item) throw new Error('Select an active physical item.')
      const amount = kind === 'COUNT'
        ? parseCountedMilli(quantity, item.unit)
        : parseQuantityMilli(quantity, item.unit)
      if (kind === 'TRANSFER') {
        await demoGateway.transferInventory(
          business.id, item.id, sourceId, destinationId, amount, reason, requestId,
        )
        onDone('Registered DEMO transfer. The output and input are reflected together, without altering the total between locations.')
      } else {
        await demoGateway.countInventory(business.id, item.id, sourceId, amount, reason, requestId)
        onDone('Recorded DEMO count: the balance of that location was adjusted to the value counted.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not register movement.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="form-panel inventory-editor" aria-label={kind === 'TRANSFER' ? 'Move stocks' : 'Register physical count'}>
    <div className="form-panel-header">
      <span className="feature-icon blue"><Icon name={kind === 'TRANSFER' ? 'truck' : 'boxes'} size={23}/></span>
      <div>
        <h2>{kind === 'TRANSFER' ? 'Transfer goods' : 'Adjust by Physical Counting'}</h2>
        <p>{kind === 'TRANSFER'
          ? 'It moved an existing amount from one location to another within the same company.'
          : 'Indicate the amount actually counted; the difference shall be recorded against the previous balance.'}</p>
      </div>
    </div>
    <form className="demo-form" onSubmit={save}>
      <div className="inventory-form-grid">
        <label className="form-field"><span>Physical article of the Catalogue *</span>
          <select value={itemId} required disabled={busy} onChange={(event) => { setItemId(event.target.value); setQuantity('') }}>
            <option value="">Select article...</option>
            {physical.map((article) => <option key={article.id} value={article.id}>{article.name}{article.sku ? ' · ' + article.sku : ''}</option>)}
          </select>
        </label>
        <label className="form-field"><span>{kind === 'TRANSFER' ? 'Origin location *' : 'Count Location *'}</span>
          <select value={sourceId} required disabled={busy} onChange={(event) => { setSourceId(event.target.value); setDestinationId('') }}>
            <option value="">Select Location...</option>
            {allowedLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>
        {kind === 'TRANSFER' && <label className="form-field"><span>Destination location *</span>
          <select value={destinationId} required disabled={busy} onChange={(event) => setDestinationId(event.target.value)}>
            <option value="">Select Destination...</option>
            {allowedLocations.filter((location) => location.id !== sourceId).map((location) =>
              <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>}
        <label className="form-field"><span>{kind === 'TRANSFER' ? 'Amount to be transferred *' : 'Counted amount (may be zero) *'}</span>
          <input value={quantity} required disabled={busy} inputMode="decimal" maxLength={13}
            placeholder={item?.unit === 'KILOGRAMO' ? 'Ej.: 0,500' : 'Ej.: 5'}
            onChange={(event) => setQuantity(event.target.value)}/>
          <small>Unidad: {item?.unit ?? 'Select an article'}. No se convierten cajas, kg ni paquetes.</small>
        </label>
      </div>
      {item && sourceId && <div className="inventory-current">
        <span>Current balance in selected location</span>
        <strong>{quantityText(current ?? 0, item.unit)}</strong>
      </div>}
      {preview && <p className="inventory-preview"><Icon name="shield" size={17}/> {preview}</p>}
      <label className="form-field"><span>Motion Reason * (minimum 5 characters)</span>
        <textarea value={reason} required minLength={5} maxLength={180} rows={2} disabled={busy}
          placeholder={kind === 'TRANSFER' ? 'E.g.: Replacement of the premises from warehouse' : 'E.g.: Weekly count, difference detected on shelf'}
          onChange={(event) => setReason(event.target.value)}/>
      </label>
      <p className="form-hint">This operation will be saved in the DEMO history. Movements are not edited or deleted; corrections are made with a new count.</p>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={busy || physical.length === 0 || allowedLocations.length < (kind === 'TRANSFER' ? 2 : 1)}>
          <Icon name="shield" size={16}/>
          {busy ? 'Registrando…' : kind === 'TRANSFER' ? 'Register Demo Transfer' : 'Save DEMO Count'}
        </button>
      </div>
    </form>
  </section>
}
