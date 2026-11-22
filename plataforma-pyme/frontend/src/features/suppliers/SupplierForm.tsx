import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { DemoImagePicker } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import type { DemoSupplier } from '../../data/demo/demoStore'
import { mapsSearchUrl } from '../../data/demo/mapsLinks'
import {
  blankSupplier, supplierPaymentLabels, supplierPayments, weekdays,
} from '../../data/demo/supplierPolicy'
import type { SupplierInput, SupplierPayment, SupplierPromotion } from '../../data/demo/supplierPolicy'

function initial(supplier?: DemoSupplier): SupplierInput {
  if (!supplier) return { ...blankSupplier, paymentMethods: [], promotions: [] }
  return {
    name: supplier.name, offerings: supplier.offerings, contactPerson: supplier.contactPerson,
    phone: supplier.phone, whatsapp: supplier.whatsapp, email: supplier.email,
    address: supplier.address, mapsUrl: supplier.mapsUrl, website: supplier.website,
    instagram: supplier.instagram, notes: supplier.notes,
    paymentMethods: [...supplier.paymentMethods],
    promotions: supplier.promotions.map((promo) => ({ ...promo, days: [...promo.days] })),
  }
}

export function SupplierForm({
  supplier, businessName, onSave, onCancel,
}: {
  supplier?: DemoSupplier
  businessName: string
  onSave: (input: SupplierInput) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<SupplierInput>(() => initial(supplier))
  const [usePhoneForWhatsapp, setUsePhoneForWhatsapp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = <K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) => setDraft((current) => ({ ...current, [key]: value }))

  function togglePayment(method: SupplierPayment, checked: boolean) {
    setDraft((current) => ({
      ...current,
      paymentMethods: checked ? [...current.paymentMethods, method] : current.paymentMethods.filter((m) => m !== method),
    }))
  }

  function addPromotion() {
    setDraft((current) => ({
      ...current,
      promotions: [...current.promotions, {
        id: 'demo-promo-' + crypto.randomUUID(),
        days: [], paymentMethod: '', benefit: '',
      }],
    }))
  }

  function changePromotion(id: string, fields: Partial<SupplierPromotion>) {
    setDraft((current) => ({
      ...current,
      promotions: current.promotions.map((promo) => promo.id === id ? { ...promo, ...fields } : promo),
    }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await onSave(draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the supplier.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="form-panel supplier-editor" aria-label="Provider Form">
    <div className="form-panel-header">
      <span className="feature-icon blue"><Icon name="truck" size={22}/></span>
      <div><h2>{supplier ? 'Edit Provider: ' + supplier.name : 'Add Provider'}</h2><p>Contact and trading conditions of "{businessName}». Only the name is obligatory.</p></div>
    </div>
    <form className="demo-form" onSubmit={submit}>
      {supplier ? <DemoImagePicker imageKey={demoImageKey('supplier', supplier.businessId, supplier.id)} label="Commercial image of the supplier"/> :
        <p className="form-hint">Save the provider and then open Edit to choose your image.</p>}
      <div className="supplier-form-section">
        <h3>1. Commercial identification</h3>
        <div className="supplier-form-grid">
          <label className="form-field"><span>Trade name *</span>
            <input required minLength={2} maxLength={90} autoFocus value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Example: Distributor"/>
          </label>
          <label className="form-field"><span>Contact person (optional)</span>
            <input maxLength={100} value={draft.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} placeholder="E.g.: Commercial area"/>
          </label>
        </div>
        <label className="form-field"><span>Products or services offered (optional)</span>
          <input maxLength={240} value={draft.offerings} onChange={(e) => set('offerings', e.target.value)} placeholder="E.g.: Inputs, maintenance services, logistics..."/>
        </label>
      </div>

      <div className="supplier-form-section">
        <h3>2. Contact and location</h3>
        <div className="supplier-form-grid">
          <label className="form-field"><span>Commercial telephone (optional)</span>
            <input inputMode="tel" maxLength={35} value={draft.phone} onChange={(e) => { setDraft((current) => ({
              ...current, phone: e.target.value,
              ...(usePhoneForWhatsapp ? { whatsapp: e.target.value } : {}),
            })) }} placeholder="+5491112345678"/>
          </label>
          <div className="form-field"><label htmlFor="supplier-whatsapp">WhatsApp (format + country...)</label>
            <input id="supplier-whatsapp" inputMode="tel" maxLength={35} value={draft.whatsapp} disabled={usePhoneForWhatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+5491112345678"/>
            <label className="supplier-inline-check"><input type="checkbox" checked={usePhoneForWhatsapp} onChange={(e) => { setUsePhoneForWhatsapp(e.target.checked); if (e.target.checked) set('whatsapp', draft.phone) }}/> Use the commercial phone</label>
          </div>
          <label className="form-field"><span>E-mail (optional)</span>
            <input type="email" maxLength={120} value={draft.email} onChange={(e) => set('email', e.target.value)} placeholder="ventas@ejemplo.invalid"/>
          </label>
          <label className="form-field"><span>Address or reference (optional)</span>
            <input maxLength={160} value={draft.address} onChange={(e) => set('address', e.target.value)} placeholder="Fictificate supplier reference"/>
          </label>
          <label className="form-field"><span>Google Maps Link (optional)</span>
            <input type="url" maxLength={2048} value={draft.mapsUrl} onChange={(e) => set('mapsUrl', e.target.value)} placeholder="https://maps.app.goo.gl/..."/>
            {draft.address && <small><a href={mapsSearchUrl(draft.address) ?? '#'} target="_blank" rel="noopener noreferrer">Search this address in Google Maps</a> (not confirming the exact point)</small>}
          </label>
          <label className="form-field"><span>Website / digital catalog (HTTPS, optional)</span>
            <input type="url" maxLength={2048} value={draft.website} onChange={(e) => set('website', e.target.value)} placeholder="https://ejemplo.com"/>
          </label>
          <label className="form-field"><span>Instagram (user, optional)</span>
            <input maxLength={31} value={draft.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@proveedor_ejemplo"/>
          </label>
        </div>
      </div>

      <div className="supplier-form-section">
        <h3>3. Accepted means of payment (information)</h3>
        <fieldset className="supplier-payment-choices"><legend className="sr-only">Means of payment</legend>
          {supplierPayments.map((payment) => <label key={payment}>
            <input type="checkbox" checked={draft.paymentMethods.includes(payment)} onChange={(e) => togglePayment(payment, e.target.checked)}/>
            <span>{supplierPaymentLabels[payment]}</span>
          </label>)}
        </fieldset>
      </div>

      <div className="supplier-form-section">
        <div className="supplier-form-section-title">
          <h3>4. Promotional days and conditions (optional)</h3>
          <button className="button button-secondary" type="button" onClick={addPromotion} disabled={draft.promotions.length >= 8}><Icon name="plus" size={16}/> Add Rule</button>
        </div>
        <p className="form-hint">These benefits are reported by the provider and will not automatically apply when registering Purchases.</p>
        {draft.promotions.length === 0 && <p className="supplier-muted">No informed promotions.</p>}
        {draft.promotions.map((promotion, index) => <div key={promotion.id} className="supplier-promotion-editor">
          <div className="supplier-promotion-header"><strong>Regla {index + 1}</strong><button type="button" className="supplier-remove-link" onClick={() => set('promotions', draft.promotions.filter((x) => x.id !== promotion.id))}>Remove Rule</button></div>
          <fieldset className="supplier-days"><legend>Applicable days (empty = no specific days)</legend>
            {weekdays.map((day, i) => <label key={day}><input type="checkbox" checked={promotion.days.includes(i)} onChange={(e) => changePromotion(promotion.id, { days: e.target.checked ? [...promotion.days, i] : promotion.days.filter((d) => d !== i) })}/>{day.slice(0, 2)}</label>)}
          </fieldset>
          <div className="supplier-form-grid">
            <label className="form-field"><span>Required medium (optional)</span>
              <select value={promotion.paymentMethod} onChange={(e) => changePromotion(promotion.id, { paymentMethod: e.target.value as SupplierPayment | '' })}>
                <option value="">No specific requirement</option>
                {supplierPayments.map((method) => <option key={method} value={method}>{supplierPaymentLabels[method]}</option>)}
              </select>
            </label>
            <label className="form-field"><span>Information benefit *</span>
              <input required minLength={3} maxLength={160} value={promotion.benefit} onChange={(e) => changePromotion(promotion.id, { benefit: e.target.value })} placeholder="E.g.: 10% discount with transfer"/>
            </label>
          </div>
        </div>)}
      </div>

      <div className="supplier-form-section">
        <h3>5. Trade observations (optional)</h3>
        <label className="form-field"><span>Internal indications</span>
          <textarea rows={3} maxLength={650} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="E.g.: Delivery times, withdrawal, order conditions..."/>
        </label>
      </div>

      <p className="form-hint supplier-form-warning">Registration is local DEMO. Do not enter real personal contacts or confidential business information. Messages are not sent or promotions validated.</p>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : supplier ? 'Save Provider' : 'Add DEMO Provider'}</button>
      </div>
    </form>
  </section>
}
