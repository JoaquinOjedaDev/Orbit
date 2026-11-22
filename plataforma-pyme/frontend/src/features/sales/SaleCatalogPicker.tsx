import { useState } from 'react'
import { Icon } from '../../app/Icon'
import type { DemoBusiness, DemoCatalogItem } from '../../data/demo/demoStore'
import type { InventoryMovement } from '../../data/demo/inventoryPolicy'
import { stockBalances, stockKey } from '../../data/demo/inventoryPolicy'
import { moneyDisplay } from '../../data/demo/catalogPolicy'
import { quantityText } from '../../data/demo/purchasePolicy'
import { DemoPhoto } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'

function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim()
}

/**
 * Selector visual opcional para el POS. No escribe stock ni confirma ventas:
 * el gateway vuelve a validar existencias al enviar el checkout.
 */
export function SaleCatalogPicker({
  business, items, locationId, movements, selectedMilli, selectedIds, onAdd,
}: {
  business: DemoBusiness
  items: DemoCatalogItem[]
  locationId: string
  movements: InventoryMovement[]
  selectedMilli: ReadonlyMap<string, number>
  selectedIds: ReadonlySet<string>
  onAdd: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const balances = stockBalances(movements)
  const categories = Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'es'))
  const search = normalizeSearch(query)
  const visible = items.filter((item) =>
    (!category || item.category === category) &&
    (!search || normalizeSearch(item.name + ' ' + item.sku + ' ' + item.category + ' ' + item.description).includes(search)))

  return <section className="sales-picker" aria-label="Visual Article Selector">
    <div className="sales-subheading">
      <div><h3>Select articles</h3><p>I chose products or services from the catalog. You can also load them from the form below.</p></div>
      <span className="small-pill">{visible.length} Articles</span>
    </div>
    <div className="sales-picker-filters">
      <label className="form-field"><span>Search by name, SKU or description</span>
        <input type="search" value={query} placeholder="Search for products or services..." onChange={(event) => setQuery(event.target.value)}/>
      </label>
      <label className="form-field"><span>Category</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
    </div>
    {visible.length === 0 ? <div className="sales-picker-empty">We didn't find any items with those filters.</div> :
      <div className="sales-product-grid">
        {visible.slice(0, 100).map((item) => {
          const service = item.kind === 'SERVICIO'
          const available = service || !locationId ? 0 : balances.get(stockKey(locationId, item.id)) ?? 0
          const selected = selectedMilli.get(item.id) ?? 0
          const noLocation = !service && !locationId
          const outOfStock = !service && !noLocation && available - selected < 1000
          const atLimit = !selectedIds.has(item.id) && selectedIds.size >= 30
          return <article key={item.id} className={'salts-product-card' + (outOfStock ? ' is-out' : '')}>
            <div className="sales-product-card-top">
              <DemoPhoto imageKey={demoImageKey('catalog', business.id, item.id)} alt={'Imagen de ' + item.name}
                fallback={<Icon name={service ? 'briefcase' : 'package'} size={23}/>} className="sales-product-photo feature-icon blue"/>
              <span className="sales-product-category">{item.category}</span>
            </div>
            <strong className="sales-product-name">{item.name}</strong>
            <span className="sales-product-sku">{item.sku ? 'SKU: ' + item.sku : 'Sin SKU'}</span>
            <span className={'sales-product-stock' + (outOfStock ? ' is-out' : '')}>
              {service ? 'Service · no physical stock' : noLocation ? 'I chose a location to check stock' :
                outOfStock ? 'Stockless available' : quantityText(available - selected, item.unit) + ' disponibles'}
            </span>
            <div className="sales-product-footer">
              <strong>{moneyDisplay(item.priceCents)}</strong>
              <button type="button" className="button button-primary" disabled={noLocation || outOfStock || atLimit}
                onClick={() => onAdd(item.id)}>
                <Icon name="plus" size={15}/>
                {selected > 0 ? 'Agregar otro' : 'Add'}
              </button>
            </div>
            {selected > 0 && <small className="sales-product-selected">In the cart: {quantityText(selected, item.unit)}</small>}
          </article>
        })}
      </div>}
    {visible.length > 100 && <p className="inventory-limit">Showing 100 results. Use the filters to find other articles.</p>}
    <p className="sales-picker-footnote">Availability is indicative during selection. Stocks are re-checked upon confirmation of sale.</p>
  </section>
}
