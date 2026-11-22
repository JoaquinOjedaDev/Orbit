import { useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness, DemoLocation, DemoSale } from '../../data/demo/demoStore'
import { moneyDisplay, parseMoneyCents } from '../../data/demo/catalogPolicy'
import { cashSessionTotals } from '../../data/demo/cashPolicy'
import type { DemoCashSession, DemoExpense } from '../../data/demo/cashPolicy'

export function CashSessionsPage({ business, locations, sessions, sales, expenses }: {
  business: DemoBusiness
  locations: DemoLocation[]
  sessions: DemoCashSession[]
  sales: DemoSale[]
  expenses: DemoExpense[]
}) {
  const [scope, setScope] = useState('')
  const [openingAmount, setOpeningAmount] = useState('0')
  const [openId, setOpenId] = useState(() => 'demo-cash-open-' + crypto.randomUUID())
  const [closeId, setCloseId] = useState(() => 'demo-cash-close-' + crypto.randomUUID())
  const [toCloseId, setToCloseId] = useState<string | null>(null)
  const [countedAmount, setCountedAmount] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const openSessions = sessions.filter(s => s.status === 'ABIERTA')
  const closedSessions = sessions.filter(s => s.status === 'CERRADA')
  const eligibleLocations = locations.filter(loc => loc.status === 'ACTIVA' && loc.canSell)
  const openAtSelected = openSessions.find(session => session.locationId === (scope || null))
  const closing = openSessions.find(session => session.id === toCloseId)
  const selectedDetail = sessions.find(session => session.id === detailId)

  function scopeLabel(locationId: string | null) {
    return locations.find(location => location.id === locationId)?.name ?? 'General box · no physical location'
  }
  function totals(session: DemoCashSession) {
    return session.status === 'CERRADA' && session.closeSnapshot ?
      session.closeSnapshot : cashSessionTotals(session, sales, expenses)
  }
  async function openSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      const value = parseMoneyCents(openingAmount)
      if (value === null) throw new Error('Enter an initial background in pesos. You can use 0.')
      const session = await demoGateway.openCashSession(business.id, scope || null, value, openId)
      setOpenId('demo-cash-open-' + crypto.randomUUID())
      setNotice('Open DEMO Day for ' + scopeLabel(session.locationId) + '. Los cobros y gastos en efectivo nuevos se asociarán a esta caja.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open the box.')
    } finally { setBusy(false) }
  }
  async function closeSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !closing) return
    setBusy(true); setError(''); setNotice('')
    try {
      const value = parseMoneyCents(countedAmount)
      if (value === null) throw new Error('Cash cash is entered.')
      const closed = await demoGateway.closeCashSession(business.id, closing.id, {
        countedCashCents: value, notes: closeNotes,
      }, closeId)
      setNotice('DEMO closure saved with immutable snapshot: ' + scopeLabel(closed.locationId) + '.')
      setToCloseId(null); setDetailId(closed.id); setCountedAmount(''); setCloseNotes('')
      setCloseId('demo-cash-close-' + crypto.randomUUID())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Couldn\'t close the day.')
    } finally { setBusy(false) }
  }

  return <>
    <div className="page-heading"><div>
      <p className="eyebrow">BOX · DEMO COMPANY</p><h1>Cash sessions</h1>
      <p>Control the cash of the days of {business.name}, by location and with obligatory arching.</p>
    </div></div>
    <section className="sales-kpis">
      <div><span className="feature-icon mint"><Icon name="wallet"/></span><small>Open days</small><strong>{openSessions.length}</strong></div>
      <div><span className="feature-icon blue"><Icon name="receipt"/></span><small>Saved closures</small><strong>{closedSessions.length}</strong></div>
      <div><span className="feature-icon violet"><Icon name="building"/></span><small>Locations enabled to sell</small><strong>{eligibleLocations.length}</strong></div>
    </section>
    <div className="informational-note"><Icon name="shield" size={18}/><span><strong>DEMO physical box.</strong>
      Only cash sales payments and cash expenses recorded while this day was open are included. Pre-opening sales, unpaid purchases and digital media are not cash cash. Closings do not move inventory or bank balances.
    </span></div>
    {notice && <p className="form-message success" role="status">{notice}</p>}
    {error && <p className="form-message error" role="alert">{error}</p>}

    <section className="form-panel cash-form">
      <div className="business-section-heading"><div><Icon name="plus" size={21}/><h2>Open a Day</h2></div>
        <span>One day open by location</span></div>
      <form className="demo-form" onSubmit={(event) => void openSession(event)}>
        <div className="cash-form-grid">
          <label className="form-field"><span>Location / box *</span><select value={scope}
            onChange={event => { setScope(event.target.value); setError('') }}>
            <option value="">General box (no physical location)</option>
            {eligibleLocations.map(location => <option value={location.id} key={location.id}>{location.name}</option>)}
          </select></label>
          <label className="form-field"><span>Initial Fund counted (ARS) *</span>
            <input type="text" inputMode="decimal" value={openingAmount} required onChange={event => setOpeningAmount(event.target.value)} placeholder="Ej.: 5000,00"/>
          </label>
        </div>
        <p className="cash-form-hint">
          <Icon name="clock" size={17}/>{openAtSelected
            ? 'There is already an open day for this box. First close it with your arching to start another.'
            : 'The opening records the initial physical background. Digital media is independent.'}
        </p>
        <div className="form-actions"><button type="submit" disabled={busy || Boolean(openAtSelected)} className="button button-primary">
          <Icon name="plus" size={17}/>{busy ? 'Guardando…' : 'Open DEMO Box'}
        </button></div>
      </form>
    </section>

    <section className="form-panel cash-history">
      <div className="business-section-heading"><div><Icon name="wallet" size={21}/><h2>Open days</h2></div>
        <span>{openSessions.length} activas</span></div>
      {openSessions.length ? <div className="cash-session-grid">{openSessions.map(session => {
        const summary = totals(session)
        return <article key={session.id} className="cash-session-card">
          <div className="cash-session-head"><span className="small-pill">ABIERTA</span><small>{new Date(session.openedAt).toLocaleString('es-AR')}</small></div>
          <h3>{scopeLabel(session.locationId)}</h3>
          <div className="sales-receipt-totals">
            <span>Initial Fund</span><strong>{moneyDisplay(session.openingCashCents)}</strong>
            <span>Cash sales</span><strong>+ {moneyDisplay(summary.cashSalesCents)}</strong>
            <span>Cash expenses</span><strong>− {moneyDisplay(summary.cashExpensesCents)}</strong>
            <span>Expected cash</span><strong>{moneyDisplay(summary.expectedCashCents)}</strong>
          </div>
          <p className="cash-quiet">{summary.saleIds.length} cash sales · {summary.expenseIds.length} cash-related expenses</p>
          <button type="button" className="button button-primary" onClick={() => {
            setToCloseId(session.id); setCountedAmount(''); setCloseNotes(''); setError(''); setNotice('');
            setCloseId('demo-cash-close-' + crypto.randomUUID())
          }}>Make arching and closing</button>
        </article>
      })}</div> : <div className="sales-empty"><Icon name="clock" size={31}/>
        <h3>There is no day open</h3><p>You can start a day by loading a cash fund.</p>
      </div>}
    </section>

    {closing && <section className="form-panel cash-close-panel" aria-label="Arching and closing of the day">
      <div className="business-section-heading">
        <div><Icon name="wallet" size={21}/><h2>Arqueo · {scopeLabel(closing.locationId)}</h2></div>
        <button type="button" className="button button-secondary" onClick={() => { setToCloseId(null); setError('') }}>
          <Icon name="close" size={16}/> Cancel Archaeology
        </button>
      </div>
      <p className="cash-quiet">Checking the arching does not block sales. By confirming, you fix the cut and save an immutable snapshot with the movements of this box.</p>
      <div className="cash-close-preview">
        <div><small>Initial Fund</small><strong>{moneyDisplay(closing.openingCashCents)}</strong></div>
        <div><small>Cash income</small><strong>{moneyDisplay(totals(closing).cashSalesCents)}</strong></div>
        <div><small>Cash outflows</small><strong>{moneyDisplay(totals(closing).cashExpensesCents)}</strong></div>
        <div><small>Esperado</small><strong>{moneyDisplay(totals(closing).expectedCashCents)}</strong></div>
      </div>
      <form className="demo-form" onSubmit={(event) => void closeSession(event)}>
        <div className="cash-form-grid">
          <label className="form-field"><span>Physically counted cash (ARS) *</span>
            <input required type="text" inputMode="decimal" value={countedAmount} onChange={event => setCountedAmount(event.target.value)}
              placeholder="Enter the amount counted, even if it is 0"/>
          </label>
          <label className="form-field"><span>Closing observation</span>
            <textarea rows={2} maxLength={500} value={closeNotes} onChange={event => setCloseNotes(event.target.value)}
              placeholder="Mandatory if there is a difference between expected and counted"/>
          </label>
        </div>
        {(() => {
          try {
            const cents = parseMoneyCents(countedAmount)
            if (cents === null) return null
            const difference = cents - totals(closing).expectedCashCents
            return <p className={'cash-form-hint ' + (difference === 0 ? 'linked' : 'unlinked')}>
              <Icon name="receipt" size={17}/>
              Estimated variance: {moneyDisplay(difference)}. {difference === 0 ? 'Arqueo coincidente.' : 'If you make a difference, explain the reason.'}
            </p>
          } catch {
            return <p className="cash-form-hint unlinked">Check the amount counted: do not use thousands separators.</p>
          }
        })()}
        <div className="form-actions"><button type="submit" className="button button-primary" disabled={busy}>
          <Icon name="shield" size={17}/>{busy ? 'Cerrando…' : 'Confirm closing and saving DEMO arching'}
        </button></div>
      </form>
    </section>}

    <section className="form-panel cash-history">
      <div className="business-section-heading"><div><Icon name="receipt" size={21}/><h2>Closing history</h2></div>
        <span>{closedSessions.length} snapshots</span></div>
      {closedSessions.length ? <div className="cash-entry-list">{closedSessions.slice(0, 100).map(session => {
        const closed = session.closeSnapshot!
        return <div className="cash-entry" key={session.id}>
          <span className="feature-icon blue"><Icon name="shield"/></span>
          <div><strong>{scopeLabel(session.locationId)}</strong>
            <small>{new Date(closed.closedAt).toLocaleString('es-AR')} · CERRADA · {closed.saleIds.length} ventas · {closed.expenseIds.length} cash costs</small>
            <small>Difference of arching: {moneyDisplay(closed.differenceCents)}</small>
          </div>
          <strong>{moneyDisplay(closed.expectedCashCents)}</strong>
          <button type="button" className="button button-secondary" onClick={() => setDetailId(session.id)}>See closure</button>
        </div>
      })}</div> : <div className="sales-empty"><Icon name="receipt" size={30}/><h3>No closures recorded</h3><p>When you confirm an arching, the snapshot will be available here.</p></div>}
    </section>

    {selectedDetail && selectedDetail.closeSnapshot && <section className="form-panel cash-close-panel" aria-label="Snapshot of the historic closure">
      <div className="business-section-heading">
        <div><Icon name="shield" size={21}/><h2>Saved closure · {scopeLabel(selectedDetail.locationId)}</h2></div>
        <button className="button button-secondary" type="button" onClick={() => setDetailId(null)}><Icon name="close" size={16}/> Close detail</button>
      </div>
      <p className="cash-quiet">Unchangeable snapshot of the {new Date(selectedDetail.closeSnapshot.closedAt).toLocaleString('es-AR')} · Responsible: DEMO User</p>
      <div className="cash-close-preview">
        <div><small>Initial Fund</small><strong>{moneyDisplay(selectedDetail.closeSnapshot.openingCashCents)}</strong></div>
        <div><small>Cash sales</small><strong>{moneyDisplay(selectedDetail.closeSnapshot.cashSalesCents)}</strong></div>
        <div><small>Cash expenses</small><strong>{moneyDisplay(selectedDetail.closeSnapshot.cashExpensesCents)}</strong></div>
        <div><small>Expected cash</small><strong>{moneyDisplay(selectedDetail.closeSnapshot.expectedCashCents)}</strong></div>
        <div><small>Cash counted</small><strong>{moneyDisplay(selectedDetail.closeSnapshot.countedCashCents)}</strong></div>
        <div><small>Diferencia</small><strong>{moneyDisplay(selectedDetail.closeSnapshot.differenceCents)}</strong></div>
      </div>
      <p>Observaciones: {selectedDetail.closeSnapshot.notes || 'No informed difference.'}</p>
      <details className="cash-detail-refs"><summary>Operations included in the tonnage</summary>
        <strong>Ventas: {selectedDetail.closeSnapshot.saleIds.length}</strong>
        <div>{selectedDetail.closeSnapshot.saleIds.length ? selectedDetail.closeSnapshot.saleIds.map(id => <code key={id}>{id} </code>) : 'No cash sales'}</div>
        <strong>Gastos: {selectedDetail.closeSnapshot.expenseIds.length}</strong>
        <div>{selectedDetail.closeSnapshot.expenseIds.length ? selectedDetail.closeSnapshot.expenseIds.map(id => <code key={id}>{id} </code>) : 'No cash charges'}</div>
      </details>
      <div className="informational-note"><Icon name="shield" size={18}/><span>This closure cannot be reopened or edited from DEMO. It does not involve deposits or transfers to bank accounts.</span></div>
    </section>}
  </>
}
