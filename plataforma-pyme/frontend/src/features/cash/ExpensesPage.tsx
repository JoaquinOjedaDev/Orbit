import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway, activeCashSession } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoLocation, DemoSnapshot } from '../../data/demo/demoStore'
import { moneyDisplay, parseMoneyCents } from '../../data/demo/catalogPolicy'
import { expenseCategories, expensePaymentLabels } from '../../data/demo/cashPolicy'
import type { DemoExpense, ExpenseCategory, ExpensePaymentMethod } from '../../data/demo/cashPolicy'
import { accountSupportsDeclaredPayment } from '../../data/demo/financialAccountPolicy'
import { listDemoFinancialAccounts } from '../../data/demo/demoStore'

const today = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function ExpensesPage({ business, locations, expenses, snapshot }: {
  business: DemoBusiness; locations: DemoLocation[]; expenses: DemoExpense[]; snapshot: DemoSnapshot
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [requestId, setRequestId] = useState(() => 'demo-expense-request-' + crypto.randomUUID())
  const [paidOn, setPaidOn] = useState(today)
  const [category, setCategory] = useState<ExpenseCategory>('OTROS')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('EFECTIVO')
  const [financialAccountId, setFinancialAccountId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('TODOS')
  const accounts = listDemoFinancialAccounts(snapshot, business.id)
  const sum = expenses.reduce((total, entry) => total + entry.amountCents, 0)
  const cash = expenses.filter(entry => entry.paymentMethod === 'EFECTIVO')
    .reduce((total, entry) => total + entry.amountCents, 0)
  const selectedSession = activeCashSession(snapshot, business.id, locationId || null)
  const filtered = expenses.filter((entry) =>
    (methodFilter === 'TODOS' || entry.paymentMethod === methodFilter) &&
    (!query.trim() || [entry.description, entry.notes, entry.category]
      .join(' ').toLocaleLowerCase('es-AR').includes(query.trim().toLocaleLowerCase('es-AR'))))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const cents = parseMoneyCents(amount)
      if (cents === null) throw new Error('Please enter a valid amount in pesos.')
      const record = await demoGateway.registerExpense(business.id, {
        paidOn, category, description, amountCents: cents, paymentMethod,
        financialAccountId: financialAccountId || null,
        locationId: locationId || null, notes,
      }, requestId)
      setNotice('DEMO expenditure registered: ' + record.description +
        (record.cashSessionId ? '. Efectivo vinculado a la jornada abierta.' :
          '. No se actualizó ninguna cuenta bancaria ni saldo de caja fuera de jornada.'))
      setFormOpen(false)
      setRequestId('demo-expense-request-' + crypto.randomUUID())
      setDescription(''); setAmount(''); setNotes(''); setFinancialAccountId('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The expenditure could not be recorded.')
    } finally { setBusy(false) }
  }

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">FINANCES · DEMO COMPANY</p><h1>Expenses</h1>
        <p>Operational discharges of {business.name} and its means of payment declared.</p>
      </div>
      <button className="button button-primary" type="button" onClick={() => { setFormOpen((open) => !open); setError(''); setNotice('') }}>
        <Icon name={formOpen ? 'close' : 'plus'} size={18}/>{formOpen ? 'Cerrar formulario' : 'Registrar gasto'}
      </button>
    </div>
    <section className="sales-kpis">
      <div><span className="feature-icon blue"><Icon name="receipt"/></span><small>Recorded expenditure</small><strong>{expenses.length}</strong></div>
      <div><span className="feature-icon violet"><Icon name="wallet"/></span><small>Total declared (historic)</small><strong>{moneyDisplay(sum)}</strong></div>
      <div><span className="feature-icon mint"><Icon name="credit"/></span><small>Declared cash payments</small><strong>{moneyDisplay(cash)}</strong></div>
    </section>
    <div className="informational-note"><Icon name="shield" size={18}/><span>
      <strong>DEMO registration, not bank reconciliation.</strong> A purchase in Purchases does not automatically represent a paid expense. The outflows are recorded only once here; only the cash expenses associated with an open day make up the arching of that box.
    </span></div>
    {notice && <p className="form-message success" role="status">{notice}</p>}
    {formOpen && <section className="form-panel cash-form">
      <div className="business-section-heading"><div><Icon name="wallet" size={21}/><h2>New operational expenditure</h2></div><span>Amounts in ARS · no actual disbursement</span></div>
      <form className="demo-form" onSubmit={(event) => void submit(event)}>
        <div className="cash-form-grid">
          <label className="form-field"><span>Date of expenditure *</span><input type="date" required value={paidOn} onChange={(e) => setPaidOn(e.target.value)}/></label>
          <label className="form-field"><span>Category *</span><select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {Object.entries(expenseCategories).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select></label>
          <label className="form-field"><span>Concepto *</span><input type="text" maxLength={140} required value={description}
            onChange={(e) => setDescription(e.target.value)} placeholder="E.g.: Bags, hire post, freight..."/></label>
          <label className="form-field"><span>Amount (ARS) *</span><input type="text" inputMode="decimal" required value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="Ej.: 12500,00"/></label>
          <label className="form-field"><span>Declared means of payment *</span><select value={paymentMethod}
            onChange={(e) => { setPaymentMethod(e.target.value as ExpensePaymentMethod); setFinancialAccountId('') }}>
            {Object.entries(expensePaymentLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select></label>
          {paymentMethod !== 'EFECTIVO' && paymentMethod !== 'TARJETA' && <label className="form-field">
            <span>Declared Source Account (optional)</span>
            <select value={financialAccountId} onChange={event => setFinancialAccountId(event.target.value)}>
              <option value="">Unassociated account</option>
              {accounts.filter(a => accountSupportsDeclaredPayment(a, paymentMethod)).map(a =>
                <option key={a.id} value={a.id}>{a.label} · {a.kind === 'BANCARIA' ? 'Banco' : 'Billetera'}{a.isPrimary ? ' · Principal' : ''}</option>)}
            </select>
            {paymentMethod === 'TRANSFERENCIA' && <small>You can also declare a transfer from a virtual wallet.</small>}
          </label>}
          <label className="form-field"><span>Location (optional, general expenditure if omitted)</span>
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">General expenditure of the company</option>
              {locations.filter(l => l.status === 'ACTIVA').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select></label>
        </div>
        {paymentMethod === 'EFECTIVO' && <p className={'cash-form-hint ' + (selectedSession ? 'linked' : 'unlinked')}>
          <Icon name={selectedSession ? 'shield' : 'clock'} size={17}/>
          {selectedSession
            ? 'This cash will be associated with the open day of this location and will be deducted from the expected cash balance.'
            : 'There is no open day for this destination. The expense will be recorded outside the cash register and will not modify any arching.'}
        </p>}
        {paymentMethod !== 'EFECTIVO' && <p className="cash-form-hint">
          <Icon name="credit" size={17}/> The digital media is registered as an internal declaration. You can associate a declared account of this company. No money transfer or bank balance check.
        </p>}
        <label className="form-field"><span>Comments (optional)</span>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500}/>
        </label>
        {error && <p className="form-message error" role="alert">{error}</p>}
        <div className="form-actions"><button type="button" disabled={busy} className="button button-secondary"
          onClick={() => setFormOpen(false)}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>
            <Icon name="receipt" size={17}/>{busy ? 'Guardando…' : 'Register DEMO expenditure'}
          </button>
        </div>
      </form>
    </section>}

    <section className="form-panel cash-history">
      <div className="business-section-heading"><div><Icon name="receipt" size={21}/><h2>Expenditure history</h2></div>
        <span>{filtered.length} de {expenses.length}</span></div>
      <div className="cash-filters">
        <label className="form-field"><span>Search for concept or description</span><input type="search" value={query}
          onChange={e => setQuery(e.target.value)} placeholder="Find expenses..."/></label>
        <label className="form-field"><span>Payment method</span><select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
          <option value="TODOS">All means</option>
          {Object.entries(expensePaymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
      </div>
      {filtered.length ? <div className="cash-entry-list">{filtered.slice(0, 100).map((entry) => <article key={entry.id} className="cash-entry">
        <span className="feature-icon blue"><Icon name="wallet"/></span>
        <div><strong>{entry.description}</strong><small>{entry.paidOn} · {expenseCategories[entry.category]} · {expensePaymentLabels[entry.paymentMethod]}</small>
          <small>{locations.find(l => l.id === entry.locationId)?.name ?? 'Gasto general'} · {entry.cashSessionId ? 'Cash-in-cash' : 'No box movement'} · {new Date(entry.createdAt).toLocaleString('es-AR')}</small>
          {entry.financialAccountLabelSnapshot && <small>Account of origin declared: {entry.financialAccountLabelSnapshot}</small>}
          {entry.notes && <small>{entry.notes}</small>}</div>
        <strong>{moneyDisplay(entry.amountCents)}</strong>
      </article>)}</div> : <div className="sales-empty"><Icon name="wallet" size={30}/>
        <h3>{expenses.length ? 'No results for these filters' : 'No expenses yet'}</h3>
        <p>The company's discharges will appear here, without affecting the inventory.</p>
      </div>}
      {filtered.length > 100 && <p className="inventory-limit">Showing 100, use the search engine.</p>}
    </section>
  </>
}
