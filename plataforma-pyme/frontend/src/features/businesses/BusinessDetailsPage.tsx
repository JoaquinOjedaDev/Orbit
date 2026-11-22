import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { DemoPhoto, DemoImagePicker } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import { businessHref } from '../../app/navigation'
import type { IconName } from '../../app/navigation'
import type { Navigate } from '../../app/types'
import { demoGateway, kindLabels } from '../../data/demo/demoStore'
import type { BusinessDetailsPatch, DemoBusiness, DemoProfile, EditableBusinessField } from '../../data/demo/demoStore'

type FieldDefinition = {
  key: EditableBusinessField
  label: string
  icon: IconName
  tone: string
  max: number
  multiline?: boolean
  wide?: boolean
}
const editableFields: FieldDefinition[] = [
  { key: 'name', label: 'Trade name', icon: 'building', tone: 'blue', max: 80 },
  { key: 'category', label: 'Rubro', icon: 'briefcase', tone: 'mint', max: 120 },
  { key: 'taxId', label: 'CUIT (optional)', icon: 'receipt', tone: 'violet', max: 15 },
  { key: 'slogan', label: 'Eslogan', icon: 'book', tone: 'orange', max: 120 },
  { key: 'description', label: 'Presentation / commercial biography', icon: 'book', tone: 'blue', max: 350, multiline: true, wide: true },
]

export function BusinessDetailsPage({
  business,
  profile,
  jobTitle,
  navigate,
}: {
  business: DemoBusiness
  profile: DemoProfile
  jobTitle: string
  navigate: Navigate
}) {
  const [editing, setEditing] = useState<EditableBusinessField | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function startEdit(key: EditableBusinessField) {
    setEditing(key)
    setDraft(business[key])
    setError('')
    setNotice('')
  }

  function cancelEdit() {
    setEditing(null)
    setDraft('')
    setError('')
  }

  async function saveField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (editing === null || busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const patch = { [editing]: draft } as BusinessDetailsPatch
      await demoGateway.updateBusinessDetails(business.id, patch)
      setEditing(null)
      setDraft('')
      setNotice('Change saved in the selected DEMO company. It is maintained when reloading if browser allows local storage.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save change.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">ADMINISTRATION · DEMO COMPANY</p><h1>Company Data</h1><p>Commercial information from «{business.name}», separated from the personal profile.</p></div>
    </div>

    <section className="company-summary">
      <DemoPhoto imageKey={demoImageKey('business', business.id, 'logo')} alt={'Logo de ' + business.name}
        fallback={business.initials} className={'company-emblem ' + business.accent}/>
      <div className="company-summary-copy">
        <div className="company-summary-title"><h2>{business.name}</h2><span className="small-pill">{business.source === 'created' ? 'Created in DEMO' : 'Sample company'}</span></div>
        <p>{business.slogan || business.description || business.category}</p>
        <span className="company-summary-category"><Icon name="briefcase" size={16}/>{kindLabels[business.kind]}</span>
      </div>
    </section>

    <div className="business-details-layout">
      <section className="form-panel business-data-panel">
        <div className="business-section-heading">
          <div><Icon name="building" size={22}/><h2>General information</h2></div>
          <span>Contextual editing</span>
        </div>

        <div className="brand-identity-row">
          <DemoPhoto imageKey={demoImageKey('business', business.id, 'logo')} alt={'Imagen de ' + business.name}
            fallback={business.initials} className={'company-emblem company-emblem-small ' + business.accent}/>
          <div><strong>Image of the company</strong><p>You can use a logo or photograph from your computer. If there is no photo, the initials are shown.</p></div>
        </div>

        <DemoImagePicker imageKey={demoImageKey('business', business.id, 'logo')} label="Logo or business image of the company"/>
        {notice && <p className="form-message success" role="status">{notice}</p>}

        <div className="business-fields-grid">
          {editableFields.map((field) => {
            const active = editing === field.key
            const value = business[field.key]
            return <div className={'business-field-card' + (field.wide ? ' business-field-wide' : '') + (active ? ' field-editing' : '')} key={field.key}>
              <div className="business-field-head">
                <span className={'feature-icon ' + field.tone}><Icon name={field.icon} size={19}/></span>
                <div className="business-field-info">
                  <span className="business-field-label">{field.label}</span>
                  {!active && <strong className={value ? '' : 'field-empty'}>{value || 'No informado'}</strong>}
                </div>
                {!active && <button type="button" className="field-edit-button" onClick={() => startEdit(field.key)} aria-label={'Edit ' + field.label}><span>Edit</span><Icon name="arrow" size={15}/></button>}
              </div>

              {active && <form className="business-edit-form" onSubmit={saveField}>
                <label htmlFor={'business-edit-' + field.key} className="sr-only">{field.label}</label>
                {field.multiline
                  ? <textarea id={'business-edit-' + field.key} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={field.max} rows={4} autoFocus />
                  : <input id={'business-edit-' + field.key} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={field.max} required={field.key === 'name'} minLength={field.key === 'name' ? 2 : undefined} autoFocus placeholder={field.key === 'taxId' ? '11 fictitious digits (optional)' : 'Enter a value'} />}
                <span className="business-char-count">{draft.length} / {field.max}</span>
                {field.key === 'taxId' && <p className="form-hint">Only DEMO. Do not carry a real CUIT; the format is validated, not the fiscal identity.</p>}
                {error && <p className="form-message error" role="alert">{error}</p>}
                <div className="business-edit-actions">
                  <button type="button" className="button button-secondary" onClick={cancelEdit} disabled={busy}>Cancel</button>
                  <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Guardando…' : 'Save'}</button>
                </div>
              </form>}
            </div>
          })}
        </div>
      </section>

      <aside className="business-details-aside">
        <section className="form-panel">
          <div className="business-aside-heading"><span className="feature-icon violet"><Icon name="book" size={21}/></span><div><h2>Documentos</h2><p>Recording of company documentation.</p></div></div>
          <span className="small-pill amber-pill">Coming soon</span>
          <p className="business-aside-description">There is still no file loading or documentary storage. No figures or fictitious documents are shown.</p>
        </section>
        <section className="form-panel">
          <div className="business-aside-heading"><span className="feature-icon mint"><Icon name="shield" size={21}/></span><div><h2>Your link to the company</h2><p>Work and administrative responsibility are different data.</p></div></div>
          <dl className="business-owner-facts">
            <div><dt>Personal profile</dt><dd>{profile.displayName}</dd></div>
            <div><dt>Work in this company</dt><dd>{jobTitle || 'No indicada'}</dd></div>
            <div><dt>Administrative liability (DEMO)</dt><dd>Initial administrative holder</dd></div>
            <div><dt>Internal ID</dt><dd>{business.id}</dd></div>
          </dl>
          <p className="business-aside-description">The job function describes your position; it does not change your administrative responsibility. None of these values sets actual server permissions.</p>
        </section>
      </aside>
    </div>

    <section className="form-panel business-contacts-preview">
      <div className="business-section-heading"><div><Icon name="users" size={22}/><h2>Contact means and networks</h2></div><span className="small-pill amber-pill">Coming soon</span></div>
      <p>In another increase you can register contact channels and establish their visibility. No phones, accounts or links are imported from HTML examples.</p>
    </section>

    <div className="business-footer-actions">
      <p>Changes to this screen are saved field by field, immediately, only in the local DEMO.</p>
      <button type="button" className="button button-secondary" onClick={() => navigate(businessHref(business.id, 'inicio'))}><Icon name="arrow-left" size={17}/> Return to Business Start</button>
    </div>
  </>
}
