import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness } from '../../data/demo/demoStore'
import { blankFinancialAccount, financialAccountShareText, financialChannelLabels, financialKindLabels, maskedAccountIdentifier } from '../../data/demo/financialAccountPolicy'
import type { DemoFinancialAccount, FinancialAccountChannel, FinancialAccountInput, FinancialAccountKind } from '../../data/demo/financialAccountPolicy'

type StatusFilter = 'TODAS' | DemoFinancialAccount['status']
type KindFilter = 'TODAS' | FinancialAccountKind

export function FinancialAccountsPage({ business, accounts }: {
  business: DemoBusiness; accounts: DemoFinancialAccount[]
}) {
  const [editingId, setEditingId] = useState<string | 'nueva' | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVA')
  const [kindFilter, setKindFilter] = useState<KindFilter>('TODAS')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const active = accounts.filter(a => a.status === 'ACTIVA').length
  const walletCount = accounts.filter(a => a.kind === 'BILLETERA').length
  const mainAccount = accounts.find(a => a.isPrimary && a.status === 'ACTIVA')
  const term = query.trim().toLocaleLowerCase('es-AR')
  const filtered = accounts.filter((account) =>
    (statusFilter === 'TODAS' || account.status === statusFilter) &&
    (kindFilter === 'TODAS' || account.kind === kindFilter) &&
    (!term || [account.label, account.institution, account.alias, account.holder, account.notes]
      .some((value) => value.toLocaleLowerCase('es-AR').includes(term))))
  const editing = editingId && editingId !== 'nueva' ? accounts.find(a => a.id === editingId) : undefined

  function showForm(id: string | 'nueva') {
    setEditingId(id)
    setConfirmId(null)
    setNotice('')
    setError('')
  }
  async function save(input: FinancialAccountInput) {
    if (!editingId) return
    if (editingId === 'nueva') {
      const created = await demoGateway.createFinancialAccount(business.id, input)
      setNotice('DEMO account \'' + created.label + '» registered for ' + business.name + '. No se vinculó a ningún banco real.')
    } else {
      await demoGateway.updateFinancialAccount(business.id, editingId, input)
      setNotice('Updated reference data. No previous sales, expenses or archeoies were altered.')
    }
    setEditingId(null)
    setStatusFilter('TODAS')
  }
  async function changeStatus(account: DemoFinancialAccount) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const next = account.status === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA'
      await demoGateway.setFinancialAccountStatus(business.id, account.id, next)
      setNotice(next === 'INACTIVA'
        ? 'Account disabled only on the platform: no longer appears for new payments or collections. Previous records remain, and the external bank is not modified.'
        : 'Reactivated account. Your data is still only DEMO reference.')
      setConfirmId(null)
      setStatusFilter('TODAS')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Couldn\'t change the state.')
    } finally { setBusy(false) }
  }
  async function setMain(account: DemoFinancialAccount) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      await demoGateway.setPrimaryFinancialAccount(business.id, account.id)
      setNotice('«' + account.label + '» marked as main account reference. It does not redirect collections or transfers.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not change main account.')
    } finally { setBusy(false) }
  }
  async function copy(account: DemoFinancialAccount) {
    setError(''); setNotice('')
    try {
      await navigator.clipboard.writeText(financialAccountShareText(account))
      setNotice('DEMO data copied to the clipboard. Check them before sharing.')
    } catch {
      setError('Could not be copied automatically. Try from localhost in a browser with clipboard permissions.')
    }
  }

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">ADMINISTRATION · DEMO COMPANY</p>
        <h1>Accounts and means of payment</h1>
        <p>Organises bank accounts and reference wallets for «{business.name}».</p>
      </div>
      <button className="button button-primary" type="button" disabled={busy}
        onClick={() => editingId ? setEditingId(null) : showForm('nueva')}>
        <Icon name={editingId ? 'close' : 'plus'} size={18}/>
        {editingId ? 'Cerrar formulario' : 'Add Account'}
      </button>
    </div>
    <section className="sales-kpis" aria-label="Summary of accounts">
      <div><span className="feature-icon blue"><Icon name="credit"/></span><small>Registered accounts</small><strong>{accounts.length}</strong></div>
      <div><span className="feature-icon mint"><Icon name="shield"/></span><small>Activas</small><strong>{active}</strong></div>
      <div><span className="feature-icon violet"><Icon name="wallet"/></span><small>Billeteras</small><strong>{walletCount}</strong></div>
    </section>
    <div className="informational-note"><Icon name="shield" size={19}/><span>
      <strong>Local directory, not financial connection.</strong> Use only fictitious data. aliases and CBU/CVU are not verified or sent to banks or wallets. No warehouse passwords, tokens, cards or real financial information.
      <strong> Cash register</strong> is a separate physical cash register; this screen does not calculate balances or credit charges. A virtual wallet can also be selected for transfers declared by alias or CVU, without external connection.
    </span></div>
    <div className="financial-principal-note">
      <span className="feature-icon blue"><Icon name="credit" size={20}/></span>
      <div><strong>Main reference account</strong>
        <p>{mainAccount ? mainAccount.label + ' · ' + mainAccount.institution :
          'No main account active. You can select it from the directory.'}</p>
      </div>
      <span className="financial-chip">No banking connection</span>
    </div>
    {notice && <p className="form-message success" role="status">{notice}</p>}
    {error && <p className="form-message error" role="alert">{error}</p>}

    {editingId && <FinancialAccountForm key={editingId} account={editing} onSave={save}
      onCancel={() => setEditingId(null)} />}

    <section className="form-panel financial-list">
      <div className="business-section-heading"><div><Icon name="credit" size={21}/><h2>Directory of accounts</h2></div>
        <span>{filtered.length} visible from {accounts.length}</span></div>
      <div className="financial-filters">
        <label className="form-field"><span>Search by name, institution, holder or alias</span>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search account..."/></label>
        <label className="form-field"><span>Type</span><select value={kindFilter}
          onChange={e => setKindFilter(e.target.value as KindFilter)}>
          <option value="TODAS">All types</option><option value="BANCARIA">Bancarias</option>
          <option value="BILLETERA">Billeteras</option></select></label>
        <label className="form-field"><span>Status</span><select value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}>
          <option value="ACTIVA">Activas</option><option value="INACTIVA">Inactivas</option>
          <option value="TODAS">All</option></select></label>
      </div>

      {filtered.length ? <div className="financial-card-grid">{filtered.map(account =>
        <article className={'financial-card' + (account.isPrimary ? ' is-primary' : '')} key={account.id}>
          <div className="financial-card-heading">
            <span className={'feature-icon ' + (account.kind === 'BANCARIA' ? 'blue' : 'violet')}>
              <Icon name={account.kind === 'BANCARIA' ? 'building' : 'wallet'} size={24}/>
            </span>
            <div><h3>{account.label}</h3><p>{account.institution}</p></div>
            <span className={'financial-chip ' + (account.status === 'ACTIVA' ? 'active' : 'inactive')}>
              {account.status === 'ACTIVA' ? 'Active' : 'Inactiva'}
            </span>
          </div>
          <div className="financial-card-badges">
            <span className="financial-chip">{financialKindLabels[account.kind]}</span>
            {account.isPrimary && <span className="financial-chip primary">Main</span>}
          </div>
          <div className="financial-details">
            <div><small>Reference holder</small><strong>{account.holder || 'No informado'}</strong></div>
            <div><small>Alias</small><strong>{account.alias || 'No informado'}</strong></div>
            <div><small>{account.kind === 'BANCARIA' ? 'CBU' : 'CVU'} (oculto)</small>
              <strong>{maskedAccountIdentifier(account.identifier)}</strong></div>
            <div><small>Means of collection</small><strong>{financialChannelLabels[account.channel]}</strong></div>
          </div>
          {account.notes && <p className="financial-notes">{account.notes}</p>}
          {account.status === 'INACTIVA' && <p className="financial-warning">Inactive reference: not used for new collections.</p>}
          <div className="financial-card-actions">
            <button type="button" className="button button-secondary" onClick={() => void copy(account)}>
              <Icon name="receipt" size={16}/> Copy DEMO data
            </button>
            {account.status === 'ACTIVA' && <>
              <button type="button" className="button button-secondary" onClick={() => showForm(account.id)}>
                Edit</button>
              {!account.isPrimary && <button type="button" className="button button-secondary"
                disabled={busy} onClick={() => void setMain(account)}>Main Dial</button>}
            </>}
            <button type="button" disabled={busy} className="button button-secondary"
              onClick={() => setConfirmId(confirmId === account.id ? null : account.id)}>
              {account.status === 'ACTIVA' ? 'Desactivar' : 'Reactivar'}
            </button>
          </div>
          {confirmId === account.id && <div className="financial-confirm" role="group" aria-label="Confirm Status Change">
            <p>{account.status === 'ACTIVA'
              ? 'Deactivate this account? Your file will not be deleted or historical records altered.'
              : 'Reactivate this DEMO reference account?'}</p>
            <button type="button" className="button button-secondary" disabled={busy}
              onClick={() => setConfirmId(null)}>Cancel</button>
            <button type="button" className="button button-primary" disabled={busy}
              onClick={() => void changeStatus(account)}>Confirm</button>
          </div>}
        </article>)}</div> :
        <div className="sales-empty"><Icon name="credit" size={31}/>
          <h3>{accounts.length ? 'No accounts with these filters' : 'No associated accounts yet'}</h3>
          <p>Add a DEMO account or wallet to organize your business references.</p>
          {!accounts.length && <button type="button" className="button button-primary"
            onClick={() => showForm('nueva')}><Icon name="plus" size={17}/> Add First Account</button>}
        </div>}
    </section>
    <div className="financial-future-note"><Icon name="shield" size={18}/><span>
      <strong>Later integrations:</strong> partner accounts to claimed and declared payments, role authorization and reconciliation. Market Real Payment will require each company to connect its own account through a secure backend. An article QR is not a collection QR.
    </span></div>
  </>
}

function FinancialAccountForm({ account, onSave, onCancel }: {
  account?: DemoFinancialAccount
  onSave: (input: FinancialAccountInput) => Promise<void>
  onCancel: () => void
}) {
  const initial = account ?? blankFinancialAccount
  const [label, setLabel] = useState(initial.label)
  const [kind, setKind] = useState<FinancialAccountKind>(initial.kind)
  const [channel, setChannel] = useState<FinancialAccountChannel>(initial.channel)
  const [institution, setInstitution] = useState(initial.institution)
  const [holder, setHolder] = useState(initial.holder)
  const [alias, setAlias] = useState(initial.alias)
  const [identifier, setIdentifier] = useState(initial.identifier)
  const [notes, setNotes] = useState(initial.notes)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      await onSave({ label, kind, channel, institution, holder, alias, identifier, notes })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not close temporary folder: %s')
    } finally { setBusy(false) }
  }

  return <section className="form-panel financial-form" aria-label={account ? 'Edit DEMO Account' : 'Add DEMO account'}>
    <div className="business-section-heading"><div><Icon name="credit" size={21}/>
      <h2>{account ? 'Edit Reference Account' : 'Add account or wallet'}</h2></div>
      <span>No banking connection</span>
    </div>
    <form className="demo-form" onSubmit={(event) => void submit(event)}>
      <div className="financial-form-grid">
        <label className="form-field"><span>Account name *</span>
          <input required maxLength={80} value={label} onChange={e => setLabel(e.target.value)}
            placeholder="E.g.: Main Account · Bank Example"/></label>
        <label className="form-field"><span>Account type *</span><select value={kind}
          onChange={e => {
            const next = e.target.value as FinancialAccountKind
            setKind(next)
            if (next === 'BANCARIA') setChannel('TRANSFERENCIA')
          }}>
          <option value="BANCARIA">Bank account</option>
          <option value="BILLETERA">Virtual wallet</option>
        </select></label>
        <label className="form-field"><span>Bank or wallet *</span>
          <input maxLength={80} required value={institution} onChange={e => setInstitution(e.target.value)}
            placeholder={kind === 'BANCARIA' ? 'E.g.: Bank Example' : 'Example: Billetera'}/></label>
        <label className="form-field"><span>Means of reference collection *</span><select value={channel}
          onChange={e => setChannel(e.target.value as FinancialAccountChannel)}>
          {Object.entries(financialChannelLabels).filter(([value]) =>
            kind !== 'BANCARIA' || value === 'TRANSFERENCIA').map(([value, text]) =>
            <option key={value} value={value}>{text}</option>)}
        </select></label>
        <label className="form-field"><span>Reference holder (optional)</span>
          <input maxLength={90} value={holder} onChange={e => setHolder(e.target.value)}
            placeholder="Only fictitious name for DEMO"/></label>
        <label className="form-field"><span>Fictional alias (optional)</span>
          <input maxLength={20} value={alias} onChange={e => setAlias(e.target.value)}
            placeholder="E.g.: shop.cobros.demo" autoComplete="off"/></label>
        <label className="form-field"><span>{kind === 'BANCARIA' ? 'CBU' : 'CVU'} fictitious (optional)</span>
          <input inputMode="numeric" maxLength={22} value={identifier} autoComplete="off"
            onChange={e => setIdentifier(e.target.value)} placeholder="22 digits invented"/></label>
        <label className="form-field"><span>Moneda</span>
          <input value="Pesos argentinos (ARS) · DEMO" disabled readOnly/></label>
      </div>
      <label className="form-field"><span>Internal comments (optional)</span>
        <textarea rows={2} maxLength={350} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Administrative reference without passwords or private data"/></label>
      <p className="cash-form-hint"><Icon name="shield" size={17}/>
        Enter an example alias (6 to 20 characters) or a {kind === 'BANCARIA' ? 'CBU' : 'CVU'} invented 22 digits. This DEMO validates only the format: does not confirm that there is an account or that it belongs to the company.
      </p>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="button button-secondary"
        onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={busy}>
          <Icon name="shield" size={17}/>{busy ? 'Guardando…' : (account ? 'Save DEMO Changes' : 'Register DEMO account')}
        </button>
      </div>
    </form>
  </section>
}
