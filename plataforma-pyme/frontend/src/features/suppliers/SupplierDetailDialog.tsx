import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../app/Icon'
import { DemoPhoto } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import type { DemoBusiness, DemoSupplier } from '../../data/demo/demoStore'
import {
  supplierPaymentLabels, weekdays,
  emailUrl, phoneUrl, whatsappUrl, instagramUrl, supplierShareText,
} from '../../data/demo/supplierPolicy'
import { getLocationMapsLink } from '../../data/demo/mapsLinks'

export function SupplierDetailDialog({
  supplier, business, onClose, onEdit,
}: {
  supplier: DemoSupplier
  business: DemoBusiness
  onClose: () => void
  onEdit: (supplier: DemoSupplier) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [shareFallback, setShareFallback] = useState('')
  const [copyNotice, setCopyNotice] = useState('')
  useEffect(() => {
    const modal = ref.current
    if (!modal) return
    if (!modal.open) modal.showModal()
    return () => { if (modal.open) modal.close() }
  }, [])

  const phone = phoneUrl(supplier.phone)
  const whatsapp = whatsappUrl(supplier.whatsapp)
  const email = emailUrl(supplier.email)
  const instagram = instagramUrl(supplier.instagram)
  const maps = getLocationMapsLink({ address: supplier.address, mapUrl: supplier.mapsUrl })

  async function copyContact() {
    const value = supplierShareText(business.name, supplier)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('The browser does not support automatic clipboard.')
      await navigator.clipboard.writeText(value)
      setShareFallback('')
      setCopyNotice('Contact details copied. Check the content before sharing.')
    } catch {
      setShareFallback(value)
      setCopyNotice('Could not copy automatically. Select the text and manually copy it.')
    }
  }

  return <dialog
    ref={ref}
    className="catalog-detail-modal supplier-detail-modal"
    aria-labelledby="supplier-detail-title"
    onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
  >
    <div className="catalog-detail-body">
      <div className="catalog-detail-topline">
        <p className="eyebrow">PROVEDER SHEET · DEMO</p>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close supplier"><Icon name="close" size={20}/></button>
      </div>
      <header className="supplier-detail-header">
        <DemoPhoto imageKey={demoImageKey('supplier', business.id, supplier.id)} alt={'Foto de ' + supplier.name}
          fallback={supplier.name.slice(0, 1).toUpperCase()} className="supplier-monogram"/>
        <div>
          <div className="supplier-title-row">
            <h2 id="supplier-detail-title">{supplier.name}</h2>
            <span className={'catalog-state '+(supplier.status === 'ACTIVO' ? 'is-active' : 'is-inactive')}>{supplier.status === 'ACTIVO' ? 'Active' : 'Inactive'}</span>
          </div>
          <p>{supplier.offerings || 'No specified products or services'}</p>
        </div>
        <button type="button" className="button button-primary" onClick={() => onEdit(supplier)}>Edit Tab</button>
      </header>

      <div className="supplier-detail-sections">
        <section className="supplier-detail-box">
          <h3><Icon name="user" size={19}/> Commercial details and contact</h3>
          <dl className="supplier-detail-fields">
            <div><dt>Contact person</dt><dd>{supplier.contactPerson || 'No informada'}</dd></div>
            <div><dt>Phone</dt><dd>{supplier.phone || 'No informado'}</dd></div>
            <div><dt>WhatsApp</dt><dd>{supplier.whatsapp || 'No informado'}</dd></div>
            <div><dt>Email</dt><dd>{supplier.email || 'No informado'}</dd></div>
            <div><dt>Address/reference</dt><dd>{supplier.address || 'No informada'}</dd></div>
            <div><dt>Sitio web</dt><dd>{supplier.website || 'No informado'}</dd></div>
            <div><dt>Instagram</dt><dd>{supplier.instagram || 'No informado'}</dd></div>
          </dl>
          <div className="supplier-direct-links">
            {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp <Icon name="arrow" size={15}/></a>}
            {phone && <a href={phone}>Llamar <Icon name="arrow" size={15}/></a>}
            {email && <a href={email}>Correo <Icon name="arrow" size={15}/></a>}
            {maps && <a href={maps.url} target="_blank" rel="noopener noreferrer">{maps.source === 'shared' ? 'See Map location' : 'Search for address in Maps'} <Icon name="arrow" size={15}/></a>}
            {supplier.website && <a href={supplier.website} target="_blank" rel="noopener noreferrer">Sitio web <Icon name="arrow" size={15}/></a>}
            {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer">Instagram <Icon name="arrow" size={15}/></a>}
          </div>
          {supplier.whatsapp && !whatsapp && <p className="supplier-help-note">WhatsApp contact is not internationally valid for opening a chat.</p>}
          {maps?.source === 'search' && <p className="supplier-help-note">Maps will perform a search, not a confirmed location.</p>}
          <button type="button" className="button button-secondary supplier-copy-button" onClick={copyContact}><Icon name="receipt" size={16}/> Copy Contact Details</button>
          {copyNotice && <p role="status" className="supplier-help-note">{copyNotice}</p>}
          {shareFallback && <label className="form-field supplier-copy-fallback">
            <span>Text to select and copy</span>
            <textarea readOnly rows={6} value={shareFallback} onFocus={(e) => e.target.select()}/>
          </label>}
        </section>

        <section className="supplier-detail-box">
          <h3><Icon name="credit" size={19}/> Means and commercial conditions</h3>
          <h4>Payment means reported by the provider</h4>
          <div className="supplier-payment-tags">
            {supplier.paymentMethods.length ? supplier.paymentMethods.map((method) => <span key={method}>{supplierPaymentLabels[method]}</span>) : <small>Not informed</small>}
          </div>
          <h4>Informed promotions</h4>
          {supplier.promotions.length === 0 && <p className="supplier-muted">No promotions registered.</p>}
          {supplier.promotions.map((promotion) => <div key={promotion.id} className="supplier-detail-promo">
            <strong>{promotion.benefit}</strong>
            <span>{promotion.days.length ? promotion.days.map((day) => weekdays[day]).join(', ') : 'No specific days'} · {promotion.paymentMethod ? supplierPaymentLabels[promotion.paymentMethod] : 'Any means/unspecified'}</span>
          </div>)}
          <p className="supplier-help-note">Promotions are declared by the provider, not verified or automatically applied in Purchases.</p>
        </section>
      </div>

      <section className="supplier-detail-box supplier-detail-notes">
        <h3><Icon name="book" size={19}/> Trade observations</h3>
        <p>{supplier.notes || 'No comment.'}</p>
        <small>Internal information saved only in this demo browser.</small>
      </section>
      <section className="supplier-detail-box supplier-detail-related">
        <h3><Icon name="shopping" size={19}/> Purchases and related products</h3>
        <p>There are no purchases or relationships with implemented articles yet. No amounts or fictitious transactions are shown.</p>
      </section>
      <footer className="catalog-detail-footer">
        <div className="catalog-detail-dates"><span>Creado: {new Date(supplier.createdAt).toLocaleDateString('es-AR')}</span><span>Last edition: {new Date(supplier.updatedAt).toLocaleDateString('es-AR')}</span></div>
        <button type="button" className="button button-secondary" onClick={onClose}>Close tab</button>
      </footer>
    </div>
  </dialog>
}
