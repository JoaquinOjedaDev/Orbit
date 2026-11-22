import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { businessHref } from '../../app/navigation'
import type { Navigate } from '../../app/types'
import { demoGateway, kindLabels } from '../../data/demo/demoStore'
import type { BusinessKind, DemoProfile } from '../../data/demo/demoStore'

export function CreateBusinessPage({ navigate, profile }: { navigate: Navigate; profile: DemoProfile }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [kind, setKind] = useState<BusinessKind>('PRODUCTOS')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const business = await demoGateway.createBusiness({ name, category, kind, description })
      navigate(businessHref(business.id, 'inicio'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create DEMO.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="page-heading"><div><p className="eyebrow">PERSONAL SPACE · E1-A2</p><h1>Create company</h1><p>It will set an example business of any category, without having to have local or stock.</p></div></div>
    <div className="form-layout">
      <section className="form-panel">
        <div className="form-panel-header"><span className="feature-icon blue"><Icon name="building" /></span><div><h2>Initial business information</h2><p>The company will be available in the top selector and your Start.</p></div></div>
        <form onSubmit={submit} className="demo-form">
          <label className="form-field">
            <span>Name of the company <strong>*</strong></span>
            <input required minLength={2} maxLength={80} autoComplete="off" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="E.g.: My entrepreneurship" />
          </label>
          <label className="form-field">
            <span>Type of activity <strong>*</strong></span>
            <select value={kind} onChange={(event) => setKind(event.target.value as BusinessKind)}>
              <option value="PRODUCTOS">{kindLabels.PRODUCTOS}</option>
              <option value="SERVICIOS">{kindLabels.SERVICIOS}</option>
              <option value="MIXTO">{kindLabels.MIXTO}</option>
            </select>
          </label>
          <label className="form-field">
            <span>Specific activity or rubric (optional)</span>
            <input maxLength={120} autoComplete="off" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="E.g.: Clothing, digital services, food..." />
          </label>
          <label className="form-field">
            <span>Description (optional)</span>
            <textarea rows={3} maxLength={350} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell us briefly what this business is about" />
          </label>
          {error && <p className="form-message error" role="alert">{error}</p>}
          <p className="form-hint">Only a demonstration company is created in this browser. You do not request CUIT, bank account, branches or real information.</p>
          <div className="form-actions">
            <button type="button" className="button button-secondary" onClick={() => navigate('/inicio')} disabled={busy}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Creando…' : 'Create a DEMO company'}</button>
          </div>
        </form>
      </section>
      <aside className="form-aside">
        <span className="feature-icon mint"><Icon name="shield" size={25}/></span>
        <h2>Initial liability</h2>
        <p>In the prototype, the profile "{profile.displayName}» will be the historical founder and initial administrative holder of this company.</p>
        <div className="form-aside-note"><Icon name="users" size={19}/><span>Only one active DEMO membership is generated. Invitation to collaborators and transfer of title remain pending.</span></div>
      </aside>
    </div>
  </>
}

