import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { DemoPhoto, DemoImagePicker } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import { demoGateway, profileInitials } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoMembership, DemoProfile } from '../../data/demo/demoStore'

export function ProfilePage({
  profile,
  businesses,
  memberships,
}: {
  profile: DemoProfile
  businesses: DemoBusiness[]
  memberships: Record<string, DemoMembership>
}) {
  const [name, setName] = useState(profile.displayName)
  const [email, setEmail] = useState(profile.email)
  const [avatarInitials, setAvatarInitials] = useState(profile.avatarInitials)
  const [contactPhone, setContactPhone] = useState(profile.contactPhone)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [selectedBusinessId, setSelectedBusinessId] = useState(businesses[0]?.id ?? '')
  const [jobDraft, setJobDraft] = useState(memberships[businesses[0]?.id ?? '']?.jobTitle ?? '')
  const [jobBusy, setJobBusy] = useState(false)
  const [jobError, setJobError] = useState('')
  const [jobNotice, setJobNotice] = useState('')

  function selectBusiness(id: string) {
    setSelectedBusinessId(id)
    setJobDraft(memberships[id]?.jobTitle ?? '')
    setJobError('')
    setJobNotice('')
  }

  async function savePersonalData(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await demoGateway.saveProfile({ displayName: name, email, avatarInitials, contactPhone })
      setNotice('DEMO profile updated in this browser.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.')
    } finally {
      setBusy(false)
    }
  }

  async function saveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (jobBusy || !selectedBusinessId) return
    setJobBusy(true)
    setJobError('')
    setJobNotice('')
    try {
      await demoGateway.saveMemberJobTitle(selectedBusinessId, jobDraft)
      setJobNotice('DEMO function saved only for the selected company.')
    } catch (err) {
      setJobError(err instanceof Error ? err.message : 'Could not save function.')
    } finally {
      setJobBusy(false)
    }
  }

  const previewInitials = profileInitials({ displayName: name, avatarInitials: avatarInitials.trim().toUpperCase() })
  const currentBusiness = businesses.find((item) => item.id === selectedBusinessId)

  return <>
    <div className="page-heading"><div><p className="eyebrow">PERSONAL WORKSPACE</p><h1>My profile</h1><p>A personal identity shared among all your companies.</p></div></div>
    <div className="form-layout">
      <div className="profile-edit-column">
        <section className="form-panel">
          <div className="form-panel-header"><span className="feature-icon blue"><Icon name="user" /></span><div><h2>DEMO personal data</h2><p>You can change your name, avatar and test contact means.</p></div></div>
          <form onSubmit={savePersonalData} className="demo-form">
            <div className="profile-avatar-editor">
              <DemoPhoto imageKey={demoImageKey('profile')} alt="Image from your DEMO profile" fallback={previewInitials}
                className="profile-avatar profile-avatar-preview"/>
              <div className="profile-avatar-editor-fields">
                <label className="form-field">
                  <span>Avatar / Initials (optional)</span>
                  <input maxLength={4} value={avatarInitials} autoComplete="off" onChange={(event) => { setAvatarInitials(event.target.value); setNotice('') }} placeholder="Ej.: AB" />
                </label>
                <p className="form-hint">Up to 4 letters. If you don't choose photo, we will use the initials of the visible name.</p>
              </div>
            </div>
            <DemoImagePicker imageKey={demoImageKey('profile')} label="Photo of the personal DEMO profile"/>
            <label className="form-field">
              <span>Visible name <strong>*</strong></span>
              <input required minLength={2} maxLength={70} autoComplete="off" value={name} onChange={(event) => { setName(event.target.value); setNotice('') }} placeholder="E.g.: DEMO user" />
            </label>
            <label className="form-field">
              <span>Demonstration mail (optional)</span>
              <input type="email" maxLength={120} autoComplete="off" value={email} onChange={(event) => { setEmail(event.target.value); setNotice('') }} placeholder="usuario@demo.invalid" />
            </label>
            <label className="form-field">
              <span>Telephone / contact (optional)</span>
              <input type="tel" maxLength={30} autoComplete="off" value={contactPhone} onChange={(event) => { setContactPhone(event.target.value); setNotice('') }} placeholder="Fictional number to test the interface" />
            </label>
            <p className="form-hint">This profile is unique to all companies. Don't enter real personal data: the prototype uses local storage without authentication.</p>
            {error && <p className="form-message error" role="alert">{error}</p>}
            {notice && <p className="form-message success" role="status">{notice}</p>}
            <div className="form-actions"><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Guardando…' : 'Save my DEMO profile'}</button></div>
          </form>
        </section>

        <section className="form-panel">
          <div className="form-panel-header"><span className="feature-icon mint"><Icon name="briefcase" /></span><div><h2>Labour role by company</h2><p>Your position may be different in each business; it does not change your administrative role.</p></div></div>
          <form className="demo-form" onSubmit={saveJob}>
            <label className="form-field">
              <span>Demonstration company</span>
              <select value={currentBusiness?.id ?? ''} onChange={(event) => selectBusiness(event.target.value)} disabled={jobBusy}>
                {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Position/Working position (optional)</span>
              <input maxLength={80} value={jobDraft} onChange={(event) => { setJobDraft(event.target.value); setJobNotice('') }} placeholder="E.g.: Trade coordination" disabled={!currentBusiness || jobBusy} />
            </label>
            <p className="form-hint">Only a DEMO job description for this membership. It does not grant permissions, cash access or authorization of operations.</p>
            {jobError && <p className="form-message error" role="alert">{jobError}</p>}
            {jobNotice && <p className="form-message success" role="status">{jobNotice}</p>}
            <div className="form-actions"><button type="submit" className="button button-primary" disabled={!currentBusiness || jobBusy}>{jobBusy ? 'Guardando…' : 'Save DEMO function'}</button></div>
          </form>
        </section>
      </div>

      <aside className="form-aside">
        <DemoPhoto imageKey={demoImageKey('profile')} alt="Photo from your DEMO profile"
          fallback={profileInitials(profile)} className="profile-avatar"/>
        <h2>{profile.displayName}</h2>
        <p>Single Profile · DEMO User</p>
        <div className="form-aside-stat"><Icon name="building" size={19}/><span>Available companies</span><strong>{businesses.length}</strong></div>
        {currentBusiness && <div className="profile-membership-summary">
          <small>EN {currentBusiness.name.toUpperCase()}</small>
          <strong>{memberships[currentBusiness.id]?.jobTitle || 'Function not indicated'}</strong>
          <span>Administrative holder (simulation)</span>
        </div>}
        <div className="form-aside-note"><Icon name="shield" size={18}/><span>There are no effective roles or permissions in this demonstration. Authorization will be implemented with the backend.</span></div>
      </aside>
    </div>
  </>
}
