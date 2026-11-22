import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoCatalogItem, DemoLocation } from '../../data/demo/demoStore'
import type { InventoryCountInput, InventoryMovement } from '../../data/demo/inventoryPolicy'
import { parseCountedMilli, stockBalance } from '../../data/demo/inventoryPolicy'
import { quantityText } from '../../data/demo/purchasePolicy'

type PreviewLine = InventoryCountInput & { item: DemoCatalogItem; deltaMilli: number }

export function InventoryBatchCount({
  business, catalog, locations, movements, onDone, onCancel,
}: {
  business: DemoBusiness
  catalog: DemoCatalogItem[]
  locations: DemoLocation[]
  movements: InventoryMovement[]
  onDone: (message: string) => void
  onCancel: () => void
}) {
  const [requestId] = useState(() => 'demo-inventory-request-' + crypto.randomUUID())
  const [locationId, setLocationId] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [reason, setReason] = useState('')
  const [stage, setStage] = useState<'count' | 'review'>('count')
  const [review, setReview] = useState<PreviewLine[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const locationsAllowed = locations.filter((location) => location.status === 'ACTIVA' && location.canStore)
  const physical = catalog.filter((item) => item.status === 'ACTIVO' && item.kind !== 'SERVICIO')
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const term = search.trim().toLocaleLowerCase('es-AR')
  const visible = physical.filter((item) =>
    [item.name, item.sku, item.category].some((text) => text.toLocaleLowerCase('es-AR').includes(term)))
    .slice(0, 200)
  const counted = physical.filter((item) => values[item.id] !== undefined && values[item.id].trim() !== '')
  const progress = physical.length ? Math.round(counted.length * 100 / physical.length) : 0
  const chosenLocation = locationsAllowed.find((location) => location.id === locationId)

  function write(id: string, next: string) {
    setValues((previous) => ({ ...previous, [id]: next }))
    setError('')
  }
  function stepValue(item: DemoCatalogItem, direction: 1 | -1) {
    const oldValue = values[item.id]
    if ((!oldValue || !oldValue.trim()) && direction === -1) {
      setError('The article is still not counted. We use ‘Mark 0’ if you checked that there are no stocks.')
      return
    }
    let milli = 0
    try {
      milli = oldValue && oldValue.trim() ? parseCountedMilli(oldValue, item.unit) : 0
    } catch {
      setError('I fixed the amount entered before using + or −.')
      return
    }
    const next = Math.max(0, milli + 1000 * direction)
    write(item.id, next === 0 ? '0' : quantityText(next, item.unit).split(' ')[0].replace(/\./g, ''))
  }

  function reviewCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      if (!chosenLocation) throw new Error('Select an active location enabled to store.')
      if (counted.length === 0) throw new Error('Tell at least one article. Uncounted ones remain unchanged.')
      if (counted.length > 200) throw new Error('The session allows up to 200 articles. I divided control in several sessions.')
      if (reason.trim().length < 5 || reason.trim().length > 180) {
        throw new Error('Enter a motif between 5 and 180 characters.')
      }
      const lines = counted.map((item) => {
        const countedMilli = parseCountedMilli(values[item.id], item.unit)
        const expectedMilli = stockBalance(movements, locationId, item.id)
        return {
          catalogItemId: item.id, item, expectedMilli, countedMilli,
          deltaMilli: countedMilli - expectedMilli,
        }
      })
      setReview(lines)
      setStage('review')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not prepare the count.')
    }
  }

  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const operation = await demoGateway.countInventoryBatch(
        business.id, locationId,
        review.map(({ catalogItemId, expectedMilli, countedMilli }) => ({ catalogItemId, expectedMilli, countedMilli })),
        reason, requestId,
      )
      if (operation.kind !== 'BATCH_COUNT') throw new Error('Unexpected count response.')
      const modified = operation.lines.filter((line) => line.deltaMilli !== 0).length
      onDone('Saved DEMO control: ' + operation.lines.length + ' revised articles and ' + modified +
        ' stock adjustments. Items not counted were not modified.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not confirm session.')
      setStage('count')
    } finally {
      setBusy(false)
    }
  }

  return <section className="form-panel inventory-editor audit-panel" aria-label="Stock Control by Location">
    <div className="form-panel-header">
      <span className="feature-icon blue"><Icon name="boxes" size={24}/></span>
      <div>
        <h2>Stock Control · Counting by Location</h2>
        <p>Count several items, review differences and apply all adjustments to a single DEMO operation.</p>
      </div>
    </div>
    <div className="informational-note inventory-note">
      <Icon name="shield" size={18}/>
      <span><strong>Not counting doesn't mean zero.</strong> Only articles with an entry quantity shall be modified. To record a zero existence, use ‘Mark 0’.</span>
    </div>
    {stage === 'count' ? <form className="demo-form" onSubmit={reviewCount}>
      <div className="inventory-audit-head">
        <label className="form-field"><span>Location to control *</span>
          <select required value={locationId} onChange={(event) => { setLocationId(event.target.value); setValues({}) }}>
            <option value="">Select Location...</option>
            {locationsAllowed.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>
        <div className="inventory-audit-progress">
          <div><strong>Count Progress</strong><span>{counted.length} de {physical.length} articles counted</span></div>
          <div className="inventory-audit-progress-track"><span style={{ width: progress + '%' }}/></div>
        </div>
      </div>
      <label className="form-field inventory-audit-search"><span>Search by name or SKU</span>
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for articles..."/>
      </label>
      {physical.length === 0 ? <p className="inventory-attention">Add physical items to the Catalogue before counting.</p> :
        !chosenLocation ? <p className="inventory-attention">Select a location to load the quantities.</p> :
        <div className="inventory-audit-list" aria-label="Articles to count">
          {visible.map((item) => {
            const oldMilli = stockBalance(movements, locationId, item.id)
            const input = values[item.id] ?? ''
            let delta: number | null = null
            if (input.trim()) {
              try { delta = parseCountedMilli(input, item.unit) - oldMilli } catch { delta = null }
            }
            return <div className="inventory-audit-row" key={item.id}>
              <div className="inventory-audit-article">
                <strong>{item.name}</strong>
                <small>{item.sku || 'Sin SKU'} · {item.unit}</small>
              </div>
              <div className="inventory-audit-expected"><small>In System</small><strong>{quantityText(oldMilli, item.unit)}</strong></div>
              <div className="inventory-audit-controls">
                <small>Actual count</small>
                <div>
                  <button type="button" aria-label={'Restar a ' + item.name} onClick={() => stepValue(item, -1)}>−</button>
                  <input aria-label={'Amount counted ' + item.name} inputMode="decimal" value={input} maxLength={13}
                    placeholder="Not counting" onChange={(event) => write(item.id, event.target.value)}/>
                  <button type="button" aria-label={'Sumar a ' + item.name} onClick={() => stepValue(item, 1)}>+</button>
                  <button type="button" onClick={() => write(item.id, '0')}>Marcar 0</button>
                  {input.trim() && <button type="button" onClick={() => write(item.id, '')}>Not counting</button>}
                </div>
              </div>
              <div className="inventory-audit-difference"><small>Diferencia</small>
                <strong className={delta === null ? 'muted' : delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'muted'}>
                  {delta === null ? 'Not counting' : delta === 0 ? 'No difference' : (delta > 0 ? '+ ' : '− ') + quantityText(Math.abs(delta), item.unit)}
                </strong>
              </div>
            </div>
          })}
          {visible.length === 0 && <p className="inventory-limit">There are no articles with that search.</p>}
          {physical.length > visible.length && <p className="inventory-limit">Showing up to 200 matches. You can use the search engine to continue counting other articles from the same session (maximum 200 counts).</p>}
        </div>}
      <label className="form-field"><span>Reason or observation of control *</span>
        <textarea rows={2} required minLength={5} maxLength={180} value={reason}
          placeholder="E.g.: Weekly count of goods in storage"
          onChange={(event) => setReason(event.target.value)}/>
      </label>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button className="button button-primary" type="submit" disabled={!chosenLocation || counted.length === 0}>
          Review Differences <Icon name="arrow" size={17}/>
        </button>
      </div>
    </form> : <div className="inventory-audit-review">
      <div className="inventory-audit-review-top">
        <h3>Summary before confirmation</h3>
        <p>Location: <strong>{chosenLocation?.name}</strong> · Counted items: <strong>{review.length}</strong> · With differences: <strong>{review.filter((line) => line.deltaMilli !== 0).length}</strong></p>
        <p>Changes apply together. No omitted articles will be altered.</p>
      </div>
      <div className="inventory-audit-list">
        {review.map((line) => <div className="inventory-audit-review-row" key={line.catalogItemId}>
          <strong>{line.item.name}</strong>
          <span>Sistema: {quantityText(line.expectedMilli, line.item.unit)}</span>
          <span>Real: {quantityText(line.countedMilli, line.item.unit)}</span>
          <strong className={line.deltaMilli > 0 ? 'positive' : line.deltaMilli < 0 ? 'negative' : 'muted'}>
            {line.deltaMilli === 0 ? 'No difference' : (line.deltaMilli > 0 ? '+ ' : '− ') + quantityText(Math.abs(line.deltaMilli), line.item.unit)}
          </strong>
        </div>)}
      </div>
      <div className="inventory-audit-reason"><strong>Comment:</strong> {reason}</div>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button button-secondary" disabled={busy} onClick={() => setStage('count')}>Re-amend</button>
        <button type="button" className="button button-primary" disabled={busy} onClick={() => void confirm()}>
          <Icon name="shield" size={17}/>{busy ? 'Confirmando…' : 'Confirm DEMO control'}
        </button>
      </div>
    </div>}
  </section>
}
