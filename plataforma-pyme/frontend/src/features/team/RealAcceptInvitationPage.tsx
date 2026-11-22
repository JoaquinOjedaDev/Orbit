import { useMemo, useRef, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiHttpError, ApiTransportError } from '../../api/httpClient.ts'
import { canAcceptInvitationToken, createOperationsGateway, operationsError } from '../businesses/realOperationsGateway.ts'

type Props = { token: string; userId: string; onNavigate: (path: string) => void; onUnauthorized: () => void }

/** Invitation tokens are never placed in URLs, localStorage or browser history. */
export function RealAcceptInvitationPage({ token, userId, onNavigate, onUnauthorized }: Props) {
  const gateway = useMemo(() => createOperationsGateway(token, userId), [token, userId])
  const current = useRef({ valid: true })
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)

  useEffect(() => {
    const gate = current.current
    gate.valid = true
    return () => { gate.valid = false }
  }, [])

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canAcceptInvitationToken(secret.trim()) || busy || uncertain) {
      if (!busy && !uncertain) setError('The code must have 43 valid characters.')
      return
    }
    setBusy(true); setError('')
    try {
      const business = await gateway.acceptInvitation(secret.trim())
      if (!current.current.valid) return
      setSecret('')
      onNavigate('/real/empresas/' + business.id)
    } catch (err) {
      if (!current.current.valid) return
      if (err instanceof ApiHttpError && err.status === 401) { setSecret(''); onUnauthorized(); return }
      if (err instanceof ApiTransportError && err.outcomeUnknown) {
        setUncertain(true)
        setError('It was not possible to confirm whether the invitation was accepted. Consult "My companies" before repeating. The code is retained only on this screen.')
      } else {
        setError(operationsError(err))
      }
    } finally {
      if (current.current.valid) setBusy(false)
    }
  }

  return <section className="real-auth-card real-business-panel">
    <nav className="real-business-nav" aria-label="Real navigation">
      <button type="button" className="real-auth-link" onClick={() => onNavigate('/real/perfil')}>My real profile</button>
      <button type="button" className="real-auth-link" onClick={() => onNavigate('/real/empresas')}>My companies</button>
    </nav>
    <span className="real-auth-eyebrow">E2-7 · T04 · Invitations</span>
    <h1>Enter invitation code</h1>
    <p>Paste the code you received to join a company. You must have logged in with the same email that was sent the invitation to. The code will not be left on the URL or local storage.</p>
    <form className="real-auth-form" onSubmit={(event) => void accept(event)}>
      <label>43 character code
        <input type="password" required autoComplete="off" minLength={43} maxLength={43}
          value={secret} onChange={(e) => setSecret(e.target.value.trim())}
          aria-describedby="real-invite-help"/>
      </label>
      <p id="real-invite-help" className="real-auth-note">The invitation must correspond to the mail of your session. Do not post or share the code in screenshots.</p>
      <button className="real-auth-primary" type="submit" disabled={busy || uncertain || !canAcceptInvitationToken(secret)}>
        {busy ? 'Accepting in FastAPI...' : 'Accept invitation'}
      </button>
    </form>
    {uncertain && <div className="real-ops-warning real-auth-message">
      <p>First check if the company already appears among your businesses. We will not automatically send the code again.</p>
      <div className="real-auth-actions">
        <button type="button" className="real-auth-secondary" onClick={() => onNavigate('/real/empresas')}>Consult my companies</button>
        <button type="button" className="real-auth-secondary" onClick={() => {
          if (window.confirm('You confirmed that the company is not listed and you want to try the same code?')) {
            setUncertain(false); setError('')
          }
        }}>Enable manual retry</button>
      </div>
    </div>}
    {error && <p className="real-auth-message real-auth-error" role="alert">{error}</p>}
  </section>
}
