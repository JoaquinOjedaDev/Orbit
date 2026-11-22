import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway, profileInitials } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoInvitation, DemoMembership, DemoProfile, DemoTeamMember } from '../../data/demo/demoStore'
import { displayInvitationStatus, inviteRoleLabels } from '../../data/demo/teamPolicy'
import type { InvitationDisplayStatus, InviteRole } from '../../data/demo/teamPolicy'

const statusLabels: Record<InvitationDisplayStatus, string> = {
  PENDIENTE: 'Pending',
  ACEPTADA: 'Accepted in DEMO',
  RECHAZADA: 'Rejected in DEMO',
  CANCELADA: 'Canceled',
  EXPIRADA: 'Vencida',
}

export function TeamPage({
  business,
  profile,
  owner,
  members,
  invitations,
}: {
  business: DemoBusiness
  profile: DemoProfile
  owner: DemoMembership
  members: DemoTeamMember[]
  invitations: DemoInvitation[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('TRABAJADOR')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [responseId, setResponseId] = useState<string | null>(null)

  const pending = invitations.filter((item) => displayInvitationStatus(item) === 'PENDIENTE')
  const activeMembers = 1 + members.length

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await demoGateway.createInvitation(business.id, email, role)
      setEmail('')
      setRole('TRABAJADOR')
      setShowForm(false)
      setNotice('DEMO invitation registered as pending. No mail was sent or access granted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'It was not possible to register the invitation.')
    } finally {
      setBusy(false)
    }
  }

  async function updateInvitation(invitation: DemoInvitation, action: 'ACEPTAR' | 'RECHAZAR' | 'CANCELAR') {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (action === 'CANCELAR') {
        await demoGateway.cancelInvitation(business.id, invitation.id)
        setNotice('DEMO invitation cancelled. No member added.')
      } else {
        await demoGateway.simulateInvitationResponse(business.id, invitation.id, action)
        setNotice(action === 'ACEPTAR'
          ? 'Simulated acceptance: a fictitious member was created in this company, without real account or server permissions.'
          : 'Simulated rejection: no membership was created.')
      }
      setResponseId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the status of the invitation.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">ADMINISTRATION · DEMO COMPANY</p><h1>Team</h1><p>Members, functions and invitations to "{business.name}».</p></div>
      <button type="button" className="button button-primary" onClick={() => { setShowForm((old) => !old); setResponseId(null); setError(''); setNotice('') }} disabled={busy}>
        <Icon name={showForm ? 'close' : 'plus'} size={18}/>{showForm ? 'Cerrar formulario' : 'New DEMO invitation'}
      </button>
    </div>

    <section className="team-summary" aria-label="Summary of equipment">
      <div><span className="feature-icon blue"><Icon name="users" size={21}/></span><span><small>Active members DEMO</small><strong>{activeMembers}</strong></span></div>
      <div><span className="feature-icon orange"><Icon name="clock" size={21}/></span><span><small>Outstanding invitations</small><strong>{pending.length}</strong></span></div>
      <div><span className="feature-icon mint"><Icon name="shield" size={21}/></span><span><small>Initial administrative holder</small><strong>1</strong></span></div>
    </section>

    <div className="informational-note team-info-note">
      <Icon name="shield" size={19}/>
      <span>This whole module is a local simulation. It does not send emails, it does not authenticate contributors and it does not create real permissions. <strong>no</strong> is an active membership. To test an acceptance, only use fictitious emails as <code>colaborador@ejemplo.invalid</code>.</span>
    </div>

    {error && <p className="form-message error team-feedback" role="alert">{error}</p>}
    {notice && <p className="form-message success team-feedback" role="status">{notice}</p>}

    {showForm && <section className="form-panel team-invite-form">
      <div className="form-panel-header"><span className="feature-icon violet"><Icon name="plus"/></span><div><h2>Prepare nominative invitation</h2><p>It is registered in this DEMO, but it is not sent to a real mail.</p></div></div>
      <form className="demo-form" onSubmit={createInvitation}>
        <div className="team-form-grid">
          <label className="form-field"><span>Fictional mail of addressee *</span>
            <input type="email" maxLength={120} required value={email} autoComplete="off" onChange={(event) => setEmail(event.target.value)} placeholder="colaborador@ejemplo.invalid"/>
          </label>
          <label className="form-field"><span>Proposed role *</span>
            <select value={role} onChange={(event) => setRole(event.target.value as InviteRole)}>
              <option value="TRABAJADOR">Staff member</option>
              <option value="ENCARGADO">Manager</option>
            </select>
          </label>
        </div>
        <p className="form-hint">You cannot invite a "owner" or transfer ownership from this form. The invitation expires at 7 days (date of demonstration); the answer will also be simulated.</p>
        <div className="form-actions">
          <button type="button" className="button button-secondary" onClick={() => setShowForm(false)} disabled={busy}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Registrando…' : 'Register DEMO invitation'}</button>
        </div>
      </form>
    </section>}

    <div className="team-content-layout">
      <div className="team-main">
        <section className="form-panel">
          <div className="business-section-heading"><div><Icon name="users" size={22}/><h2>Integrantes</h2></div><span>{activeMembers} assets in DEMO</span></div>

          <article className="team-person team-owner">
            <span className="team-avatar">{profileInitials(profile)}</span>
            <div className="team-person-details">
              <h3>{profile.displayName}</h3><p>Personal profile DEMO · {profile.email || 'No DEMO mail'}</p>
              <span>Work: {owner.jobTitle || 'No indicada'}</span>
            </div>
            <div className="team-person-status"><span className="small-pill">Administrative holder</span><small>Initial responsible</small></div>
          </article>

          {members.length === 0 && <div className="team-empty"><Icon name="users" size={23}/><span>There are no DEMO collaborators active yet. You can register an invitation and simulate a response to test this route.</span></div>}

          {members.map((member) => <article className="team-person" key={member.id}>
            <span className="team-avatar team-avatar-guest"><Icon name="user" size={21}/></span>
            <div className="team-person-details"><h3>DEMO member</h3><p>{member.email}</p><span>Fictuous membership · no user account</span></div>
            <div className="team-person-status"><span className="small-pill">{inviteRoleLabels[member.role]}</span><small>Activate only in this DEMO</small></div>
          </article>)}
        </section>

        <section className="form-panel">
          <div className="business-section-heading"><div><Icon name="clock" size={22}/><h2>Nominative invitations</h2></div><span>{invitations.length} registradas</span></div>
          {invitations.length === 0 && <div className="team-empty"><Icon name="book" size={22}/><span>There are still no demonstration invitations in this company.</span></div>}
          <div className="team-invitation-list">
            {invitations.map((invitation) => {
              const status = displayInvitationStatus(invitation)
              return <article className="team-invitation" key={invitation.id}>
                <div className="team-invitation-top">
                  <span className="feature-icon violet"><Icon name="user" size={20}/></span>
                  <div className="team-invitation-identity"><strong>{invitation.email}</strong><span>{inviteRoleLabels[invitation.role]} · DEMO Record</span></div>
                  <span className={'team-invite-status status-' + status.toLowerCase()}>{statusLabels[status]}</span>
                </div>
                <div className="team-invitation-meta"><span>Creada: {new Date(invitation.createdAt).toLocaleDateString('es-AR')}</span><span>Vence: {new Date(invitation.expiresAt).toLocaleDateString('es-AR')}</span></div>
                {status === 'PENDIENTE' && <div className="team-invitation-actions">
                  <button type="button" className="button button-secondary" onClick={() => setResponseId(responseId === invitation.id ? null : invitation.id)} disabled={busy}>Simulate response</button>
                  <button type="button" className="button button-secondary" onClick={() => updateInvitation(invitation, 'CANCELAR')} disabled={busy}>Cancel invitation</button>
                </div>}
                {status === 'PENDIENTE' && responseId === invitation.id && <div className="team-response-box">
                  <p>Local simulation: I chose a fictitious response from the recipient. <strong>No mail will be sent or real access granted.</strong></p>
                  <div><button type="button" className="button button-primary" onClick={() => updateInvitation(invitation, 'ACEPTAR')} disabled={busy}>{busy ? 'Procesando…' : 'Simulate acceptance'}</button>
                  <button type="button" className="button button-secondary" onClick={() => updateInvitation(invitation, 'RECHAZAR')} disabled={busy}>Simulate rejection</button>
                  <button type="button" className="button button-secondary" onClick={() => setResponseId(null)} disabled={busy}>Back</button></div>
                </div>}
              </article>
            })}
          </div>
        </section>
      </div>

      <aside className="team-side">
        <section className="form-panel">
          <div className="business-aside-heading"><span className="feature-icon blue"><Icon name="shield" size={22}/></span><div><h2>Roles and responsibilities</h2><p>Proposal for business structure.</p></div></div>
          <div className="team-role-explain"><strong>Administrative holder</strong><span>Initial responsibility of the company. It is not transferred or eliminated from DEMO.</span></div>
          <div className="team-role-explain"><strong>Manager</strong><span>Business role proposed for future server authorization.</span></div>
          <div className="team-role-explain"><strong>Staff member</strong><span>Proposed business role of lesser scope; still no effective permits.</span></div>
          <p className="business-aside-description">The role of the labour force (e.g. "Programming") remains independent of the role.</p>
        </section>
        <section className="form-panel">
          <div className="business-aside-heading"><span className="feature-icon orange"><Icon name="book" size={22}/></span><div><h2>Request by link or QR</h2><p>Another incorporation circuit.</p></div></div>
          <span className="small-pill amber-pill">Coming soon</span>
          <p className="business-aside-description">A future link will allow you to request access, but it will never automatically give a membership. No fake links or QRs are displayed.</p>
        </section>
      </aside>
    </div>
  </>
}
