import { useState } from 'react'
import { Icon } from '../../app/Icon'
import type { DemoBusiness, DemoCatalogItem, DemoLocation } from '../../data/demo/demoStore'
import type { InventoryMovement, InventoryOperation } from '../../data/demo/inventoryPolicy'
import { inventoryHistoryEntries, inventoryMovementLabels, stockBalances, stockKey } from '../../data/demo/inventoryPolicy'
import { quantityText } from '../../data/demo/purchasePolicy'
import { InventoryActionForm } from './InventoryActionForm'
import { InventoryBatchCount } from './InventoryBatchCount'
import { DemoPhoto } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'

type Tab = 'stock' | 'movements'
type Row = { item: DemoCatalogItem; location: DemoLocation; milli: number }
const movementsFilters = [
  { value: 'RECEPCION_COMPRA', label: 'Procurement receptions' },
  { value: 'VENTA_SALIDA', label: 'Sales outflows' },
  { value: 'TRANSFER', label: 'Transfers between locations' },
  { value: 'AJUSTE_CONTEO', label: 'Individual counting adjustments' },
  { value: 'BATCH_COUNT', label: 'Stock controls by location' },
] as const

export function InventoryPage({
  business, catalog, locations, movements, operations, initialTab,
}: {
  business: DemoBusiness
  catalog: DemoCatalogItem[]
  locations: DemoLocation[]
  movements: InventoryMovement[]
  operations: InventoryOperation[]
  initialTab: Tab
}) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [action, setAction] = useState<'TRANSFER' | 'COUNT' | 'BATCH' | null>(null)
  const [formVersion, setFormVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [notice, setNotice] = useState('')
  const [showEmpty, setShowEmpty] = useState(false)
  const physical = catalog.filter((item) => item.kind !== 'SERVICIO')
  const locById = new Map(locations.map((loc) => [loc.id, loc]))
  const itemById = new Map(physical.map((item) => [item.id, item]))
  const balances = stockBalances(movements)
  const positivePairs = [...balances.values()].filter((quantity) => quantity > 0).length
  const stockedArticles = new Set(
    [...balances].filter(([, quantity]) => quantity > 0).map(([key]) => (JSON.parse(key) as string[])[1]),
  ).size
  const receipts = movements.filter((movement) => movement.type === 'RECEPCION_COMPRA').length
  const history = inventoryHistoryEntries(movements, operations)

  const rows: Row[] = []
  if (locationFilter || showEmpty) {
    for (const location of locations) {
      if (locationFilter && location.id !== locationFilter) continue
      if (!location.canStore && ![...balances.keys()].some((key) => (JSON.parse(key) as string[])[0] === location.id)) continue
      for (const item of physical) {
        const milli = balances.get(stockKey(location.id, item.id)) ?? 0
        rows.push({ item, location, milli })
      }
    }
  } else {
    for (const [key, milli] of balances) {
      if (milli <= 0) continue
      const [locationId, itemId] = JSON.parse(key) as [string, string]
      const item = itemById.get(itemId)
      const location = locById.get(locationId)
      if (item && location) rows.push({ item, location, milli })
    }
  }
  const term = query.trim().toLocaleLowerCase('es-AR')
  const filteredRows = rows.filter(({ item, location, milli }) =>
    (locationFilter === '' || location.id === locationFilter) &&
    (!term || [item.name, item.sku, item.category, location.name].some((x) => x.toLocaleLowerCase('es-AR').includes(term))) &&
    (showEmpty || milli > 0 || locationFilter !== ''))
    .sort((a, b) => a.item.name.localeCompare(b.item.name, 'es') || a.location.name.localeCompare(b.location.name, 'es'))
  const shownRows = filteredRows.slice(0, 150)
  const filteredHistory = history.filter((entry) => {
    const places = entry.kind === 'TRANSFER'
      ? [entry.sourceLocationId, entry.destinationLocationId]
      : [entry.kind === 'BATCH_COUNT' ? entry.locationId : entry.movement.locationId]
    if (locationFilter && !places.includes(locationFilter)) return false
    if (typeFilter) {
      const isTransfer = entry.kind === 'TRANSFER' ||
        (entry.kind === 'MOVEMENT' && (entry.movement.type === 'TRASLADO_SALIDA' || entry.movement.type === 'TRASLADO_ENTRADA'))
      if (typeFilter === 'TRANSFER' && !isTransfer) return false
      if (typeFilter === 'BATCH_COUNT' && entry.kind !== 'BATCH_COUNT') return false
      if (typeFilter !== 'TRANSFER' && typeFilter !== 'BATCH_COUNT' &&
          (entry.kind !== 'MOVEMENT' || entry.movement.type !== typeFilter)) return false
    }
    if (!term) return true
    const searchable = entry.kind === 'BATCH_COUNT'
      ? [entry.reason, ...entry.lines.flatMap((line) => [
        line.itemNameSnapshot, itemById.get(line.catalogItemId)?.sku ?? '',
      ])]
      : entry.kind === 'TRANSFER'
        ? [entry.itemNameSnapshot, entry.reference, entry.reason, itemById.get(entry.catalogItemId)?.sku ?? '']
        : [entry.movement.itemNameSnapshot, entry.movement.reference,
          entry.movement.reason, itemById.get(entry.movement.catalogItemId)?.sku ?? '']
    return [...searchable, ...places.map((place) => locById.get(place)?.name ?? '')]
      .some((value) => value.toLocaleLowerCase('es-AR').includes(term))
  })
  const shownHistory = filteredHistory.slice(0, 90)
  const canMove = locations.filter((loc) => loc.status === 'ACTIVA' && loc.canStore).length >= 2
  const canCount = locations.some((loc) => loc.status === 'ACTIVA' && loc.canStore)
  const canAct = physical.some((item) => item.status === 'ACTIVO')

  function startAction(kind: 'TRANSFER' | 'COUNT' | 'BATCH') {
    setAction(kind)
    setFormVersion((n) => n + 1)
    setNotice('')
  }
  function completed(message: string) {
    setAction(null)
    setNotice(message)
    setTab('movements')
    setTypeFilter('')
  }

  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">OPERATIONS · DEMO COMPANY</p>
        <h1>{initialTab === 'movements' ? 'Inventory movements' : 'Inventory'}</h1>
        <p>Location stocks derived from receptions, transfers, counting and sales in "{business.name}».</p>
      </div>
      <div className="inventory-heading-actions">
        <button type="button" className="button button-secondary" disabled={!canAct || !canMove}
          onClick={() => startAction('TRANSFER')}><Icon name="truck" size={17}/> Trasladar</button>
        <button type="button" className="button button-secondary" disabled={!canAct || !canCount}
          onClick={() => startAction('COUNT')}><Icon name="plus" size={17}/> Quick adjustment</button>
        <button type="button" className="button button-primary" disabled={!canAct || !canCount}
          onClick={() => startAction('BATCH')}><Icon name="boxes" size={17}/> Stock Control</button>
      </div>
    </div>

    <section className="inventory-summary" aria-label="DEMO inventory indicators">
      <div><span className="feature-icon blue"><Icon name="package" size={20}/></span><small>Stocked items</small><strong>{stockedArticles}</strong></div>
      <div><span className="feature-icon mint"><Icon name="pin" size={20}/></span><small>Item/Location combinations with stock</small><strong>{positivePairs}</strong></div>
      <div><span className="feature-icon violet"><Icon name="receipt" size={20}/></span><small>Tickets by reception</small><strong>{receipts}</strong></div>
      <div><span className="feature-icon orange"><Icon name="clock" size={20}/></span><small>Inventory operations</small><strong>{history.length}</strong></div>
    </section>

    <div className="informational-note inventory-note">
      <Icon name="shield" size={20}/>
      <span>The balances are derived from receptions, transfers, counts and sales recorded in the <strong>unit of each article</strong>; no boxes with units or kilograms of grams are added. This DEMO does not include reserves, lots, production or actual concurrence between devices.</span>
    </div>
    {!canCount && <div className="inventory-attention">To register a count or transfer, first set at least one active location with "Can store" in Locations. For transfers you need two.</div>}
    {!canAct && <div className="inventory-attention">To operate, first add an active physical item (not a service) in Catalogue.</div>}
    {notice && <p className="form-message success inventory-notice" role="status">{notice}</p>}

    {action === 'BATCH' ? <InventoryBatchCount
      key={business.id + '-batch-' + formVersion}
      business={business} catalog={catalog} locations={locations} movements={movements}
      onDone={completed} onCancel={() => setAction(null)}
    /> : action && <InventoryActionForm
      key={business.id + '-' + action + '-' + formVersion}
      kind={action} business={business} catalog={catalog} locations={locations} movements={movements}
      onDone={completed} onCancel={() => setAction(null)}
    />}

    <section className="form-panel inventory-main-panel">
      <div className="inventory-tabs" role="tablist" aria-label="Inventory views">
        <button type="button" role="tab" aria-selected={tab === 'stock'} className={tab === 'stock' ? 'active' : ''}
          onClick={() => setTab('stock')}><Icon name="boxes" size={17}/> Existencias</button>
        <button type="button" role="tab" aria-selected={tab === 'movements'} className={tab === 'movements' ? 'active' : ''}
          onClick={() => setTab('movements')}><Icon name="truck" size={17}/> History of movements</button>
      </div>
      <div className="inventory-filters">
        <label className="form-field"><span>Search for article, SKU, location or motif</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar…"/>
        </label>
        <label className="form-field"><span>Location</span>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
            <option value="">All locations</option>
            {locations.map((location) =>
              <option key={location.id} value={location.id}>{location.name}{location.status === 'PAUSADA' ? ' (pausada)' : ''}</option>)}
          </select>
        </label>
        {tab === 'movements' && <label className="form-field"><span>Type of movement</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All moves</option>
            {movementsFilters.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>}
      </div>

      {tab === 'stock' ? <>
        <div className="inventory-table-heading">
          <div><h2>Physical stock</h2><p>{filteredRows.length} visible combinations · values in control unit</p></div>
          <label className="inventory-toggle"><input type="checkbox" checked={showEmpty} onChange={(event) => setShowEmpty(event.target.checked)}/> Include zero balances</label>
        </div>
        {filteredRows.length === 0 ? <div className="catalog-empty">
          <span className="feature-icon blue"><Icon name="boxes" size={25}/></span>
          <h3>No stock with these filters</h3>
          <p>The stock will appear when you confirm a purchase receipt or record a physical count. If you want to see items without balance, select a location or activate "Include balances in zero".</p>
        </div> : <>
          <div className="inventory-stock-list">
            {shownRows.map(({ item, location, milli }) => <article className="inventory-stock-row" key={stockKey(location.id, item.id)}>
              <DemoPhoto imageKey={demoImageKey('catalog', business.id, item.id)}
                alt={'Imagen de ' + item.name}
                fallback={<Icon name="package" size={20}/>}
                className="inventory-stock-photo inventory-stock-icon"/>
              <div className="inventory-stock-description">
                <strong>{item.name}</strong><small>{item.sku ? 'SKU: ' + item.sku + ' · ' : ''}{item.kind === 'INSUMO' ? 'Insumo' : item.kind === 'ELABORADO' ? 'Elaboración' : 'Reventa'}</small>
              </div>
              <div className="inventory-stock-location"><Icon name="pin" size={15}/>{location.name}{location.status === 'PAUSADA' ? ' · Pausada' : ''}</div>
              <div className={'inventory-stock-quantity ' + (milli > 0 ? 'positive' : 'zero')}>
                <strong>{quantityText(milli, item.unit)}</strong>
                <small>{milli > 0 ? 'Existencia registrada' : 'No stock'}</small>
              </div>
            </article>)}
          </div>
          {filteredRows.length > shownRows.length && <p className="inventory-limit">Showing the first {shownRows.length} combinations. Use filters to check the rest.</p>}
        </>}
      </> : <>
        <div className="inventory-table-heading">
          <div><h2>Traceability of movements</h2><p>{filteredHistory.length} operations · multiple transfers and controls are grouped by operation</p></div>
        </div>
        {filteredHistory.length === 0 ? <div className="catalog-empty">
          <span className="feature-icon blue"><Icon name="truck" size={25}/></span>
          <h3>There's still no movement.</h3><p>Confirmation of a purchase with physical goods appears here automatically.</p>
        </div> : <>
          <div className="inventory-movement-list">
            {shownHistory.map((entry) => entry.kind === 'TRANSFER' ? (
              <article className="inventory-movement-row" key={entry.id}>
                <span className="inventory-movement-icon transfer"><Icon name="truck" size={19}/></span>
                <div className="inventory-movement-info">
                  <strong>{entry.itemNameSnapshot}</strong>
                  <span><b>Transfer</b> · {locById.get(entry.sourceLocationId)?.name ?? 'Historical location'} → {locById.get(entry.destinationLocationId)?.name ?? 'Historical location'}</span>
                  <small>{entry.reason}{entry.reference ? ' · ' + entry.reference : ''}</small>
                </div>
                <div className="inventory-movement-aside">
                  <strong className="transfer-quantity">{quantityText(entry.quantityMilli, entry.unit)}</strong>
                  <small>Trasladadas · {new Date(entry.createdAt).toLocaleString('es-AR')}</small>
                </div>
              </article>
            ) : entry.kind === 'BATCH_COUNT' ? (
              <details className="inventory-audit-history" key={entry.id}>
                <summary className="inventory-movement-row">
                  <span className="inventory-movement-icon transfer"><Icon name="boxes" size={19}/></span>
                  <div className="inventory-movement-info">
                    <strong>Stock Control · {locById.get(entry.locationId)?.name ?? 'Historical location'}</strong>
                    <span>{entry.lines.length} Articles revised · {entry.lines.filter((line) => line.deltaMilli !== 0).length} diferencias</span>
                    <small>{entry.reason}</small>
                  </div>
                  <div className="inventory-movement-aside">
                    <strong className="transfer-quantity">One session</strong>
                    <small>{new Date(entry.createdAt).toLocaleString('es-AR')} · Ver detalle ▾</small>
                  </div>
                </summary>
                <div className="inventory-audit-history-lines">
                  {entry.lines.map((line) => <div key={line.catalogItemId}>
                    <strong>{line.itemNameSnapshot}</strong>
                    <span>Sistema: {quantityText(line.expectedMilli, line.unit)}</span>
                    <span>Contado: {quantityText(line.countedMilli, line.unit)}</span>
                    <strong className={line.deltaMilli > 0 ? 'positive' : line.deltaMilli < 0 ? 'negative' : 'muted'}>
                      {line.deltaMilli === 0 ? 'No difference' :
                        (line.deltaMilli > 0 ? '+ ' : '− ') + quantityText(Math.abs(line.deltaMilli), line.unit)}
                    </strong>
                  </div>)}
                </div>
              </details>
            ) : (
              <article className="inventory-movement-row" key={entry.id}>
                <span className={'inventory-movement-icon ' + (entry.movement.deltaMilli >= 0 ? 'inbound' : 'outbound')}>
                  <Icon name={entry.movement.type === 'RECEPCION_COMPRA' ? 'receipt' : entry.movement.type === 'AJUSTE_CONTEO' ? 'boxes' : 'truck'} size={19}/>
                </span>
                <div className="inventory-movement-info">
                  <strong>{entry.movement.itemNameSnapshot}</strong>
                  <span>{inventoryMovementLabels[entry.movement.type]} · {locById.get(entry.movement.locationId)?.name ?? 'Historical location'}</span>
                  <small>{entry.movement.reason}{entry.movement.reference ? ' · ' + entry.movement.reference : ''}</small>
                </div>
                <div className="inventory-movement-aside">
                  <strong className={entry.movement.deltaMilli >= 0 ? 'positive' : 'negative'}>
                    {entry.movement.deltaMilli > 0 ? '+' : '−'} {quantityText(Math.abs(entry.movement.deltaMilli), entry.movement.unit)}
                  </strong>
                  <small>{new Date(entry.createdAt).toLocaleString('es-AR')}</small>
                </div>
              </article>
            ))}
          </div>
          {filteredHistory.length > shownHistory.length && <p className="inventory-limit">Showing the {shownHistory.length} more recent operations. Refin the search to consult others.</p>}
        </>}
      </>}
    </section>
  </>
}
