import { useEffect, useRef } from 'react'
import { Icon } from '../../app/Icon'
import { DemoPhoto } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import type { IconName } from '../../app/navigation'
import type { DemoCatalogItem } from '../../data/demo/demoStore'
import { catalogKindLabels, catalogUnitLabels, moneyDisplay } from '../../data/demo/catalogPolicy'

const kindIcon: Record<DemoCatalogItem['kind'], IconName> = {
  ELABORADO: 'package',
  REVENTA: 'shopping',
  INSUMO: 'boxes',
  SERVICIO: 'briefcase',
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No disponible'
  return date.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Modal nativo: foco modal, Escape y bloqueo del contenido de fondo.
 * Es una vista del catálogo DEMO; no simula inventario, proveedores ni permisos.
 */
export function CatalogDetailDialog({
  item, onClose, onEdit,
}: {
  item: DemoCatalogItem
  onClose: () => void
  onEdit: (item: DemoCatalogItem) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  // React StrictMode vuelve a ejecutar el cleanup de efectos en desarrollo.
  // Escuchar close confunde ese cierre programático con uno solicitado por el usuario.
  // Por eso se usa cancel para Escape y botones/clic de backdrop para el resto.
  return <dialog
    ref={dialogRef}
    className="catalog-detail-modal"
    aria-labelledby="catalog-detail-heading"
    onCancel={(event) => {
      event.preventDefault()
      onClose()
    }}
    onClick={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    <div className="catalog-detail-body">
      <header className="catalog-detail-topline">
        <div className="catalog-detail-return"><span className="eyebrow">CATALOGUE SHEET · DEMO</span></div>
        <button type="button" className="icon-button" aria-label="Close article sheet" onClick={onClose}>
          <Icon name="close" size={21} />
        </button>
      </header>

      <div className="catalog-detail-hero">
        <DemoPhoto imageKey={demoImageKey('catalog', item.businessId, item.id)} alt={'Foto de ' + item.name}
          fallback={<Icon name={kindIcon[item.kind]} size={30}/>} className="catalog-detail-symbol demo-photo-detail"/>
        <div className="catalog-detail-main">
          <div className="catalog-detail-name-row">
            <h2 id="catalog-detail-heading">{item.name}</h2>
            <span className={'catalog-state ' + (item.status === 'ACTIVO' ? 'is-active' : 'is-inactive')}>
              {item.status === 'ACTIVO' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p>{catalogKindLabels[item.kind]} · {item.category}</p>
          <div className="catalog-tags"><span>{catalogUnitLabels[item.unit]}</span>
            {item.sku && <span>SKU: {item.sku}</span>}
          </div>
        </div>
        <button type="button" className="button button-primary catalog-detail-edit" onClick={() => onEdit(item)}>
          <Icon name="arrow" size={17} /> Edit Tab
        </button>
      </div>

      <section className="catalog-detail-metrics" aria-label="Commercial information">
        <div><small>List price</small><strong>{item.sellable ? moneyDisplay(item.priceCents) : 'Not offered for sale'}</strong></div>
        <div><small>Reference cost</small><strong>{item.referenceCostCents === null ? 'No informado' : moneyDisplay(item.referenceCostCents)}</strong></div>
        <div><small>Control unit</small><strong>{catalogUnitLabels[item.unit]}</strong></div>
        <div><small>Trade status</small><strong>{item.sellable ? 'Available to offer' : 'Internal / non-soldable use'}</strong></div>
      </section>

      <div className="catalog-detail-sections">
        <section className="catalog-detail-section">
          <h3><Icon name="book" size={18}/> Commercial description</h3>
          <p>{item.description || 'A commercial description was not entered.'}</p>
        </section>

        <section className="catalog-detail-section catalog-detail-private">
          <h3><Icon name="receipt" size={18}/> Internal comments</h3>
          <p>{item.observations || 'No internal observations.'}</p>
          <small>Internal field of use in this local DEMO. Reading permissions will be validated from the backend.</small>
        </section>

        <section className="catalog-detail-section">
          <h3><Icon name="boxes" size={18}/> Related operations</h3>
          <p>{item.kind === 'SERVICIO'
            ? 'It is a service: it does not accumulate physical stocks. The inputs used to provide it will be associated later.'
            : 'There are still no movements, purchases, suppliers, lots or stocks linked to this file.'}</p>
          <div className="catalog-detail-planned">
            <span>Suppliers: no integration</span>
            <span>Images: slope</span>
            {item.kind === 'ELABORADO' && <span>Components and guides: pending</span>}
            {item.kind !== 'SERVICIO' && <span>Stock and maturities: outstanding</span>}
          </div>
        </section>
      </div>

      <footer className="catalog-detail-footer">
        <div className="catalog-detail-dates">
          <span>Creado: {formatDate(item.createdAt)}</span>
          <span>Last edition DEMO: {formatDate(item.updatedAt)}</span>
        </div>
        <button type="button" className="button button-secondary" onClick={onClose}>Close tab</button>
      </footer>
    </div>
  </dialog>
}
