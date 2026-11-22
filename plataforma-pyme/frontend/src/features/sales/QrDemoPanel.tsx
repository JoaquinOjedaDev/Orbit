import { useState } from 'react'
import { Icon } from '../../app/Icon'
import { demoGateway } from '../../data/demo/demoStore'
import type { DemoBusiness } from '../../data/demo/demoStore'
import { moneyDisplay } from '../../data/demo/catalogPolicy'
import { demoQrVisualCells, qrStatusLabels } from '../../data/demo/qrDemoPolicy'
import type { DemoQrIntent } from '../../data/demo/qrDemoPolicy'

export function QrDemoPanel({ intent, business, onApproved, onCanceled, onClose }: {
  intent: DemoQrIntent
  business: DemoBusiness
  onApproved: (saleId: string) => void
  onCanceled: () => void
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const cells = demoQrVisualCells(intent.id)
  async function act(action: 'approve' | 'cancel') {
    if (busy) return
    setBusy(true); setError('')
    try {
      if (action === 'approve') {
        const sale = await demoGateway.simulateQrDemoApproval(business.id, intent.id)
        onApproved(sale.id)
      } else {
        await demoGateway.cancelQrDemoIntent(business.id, intent.id)
        onCanceled()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not complete QR simulation.')
    } finally { setBusy(false) }
  }

  return <section className="form-panel qr-demo-panel" aria-label="Demonstration QR collection intent">
    <div className="business-section-heading">
      <div><Icon name="credit" size={22}/><h2>Demo QR payment</h2></div>
      <button type="button" className="button button-secondary" onClick={onClose}><Icon name="close" size={16}/> Close detail</button>
    </div>
    <div className="qr-demo-content">
      <div className="qr-demo-visual">
        <svg viewBox="0 0 29 29" role="img" aria-label="Illustrative graphic pattern, not a scanning QR or payment link">
          <rect width="29" height="29" fill="#ffffff"/>
          {cells.map(cell => <rect key={cell.x + '-' + cell.y} x={cell.x} y={cell.y} width="1" height="1" fill="#163b6d"/>)}
        </svg>
        <strong>DEMO ILLUSTRATION</strong>
        <small>Not Scannable · No Transfer of Money</small>
      </div>
      <div className="qr-demo-info">
        <span className={'qr-demo-state ' + (intent.status === 'PENDIENTE' ? 'pending' : intent.status === 'CANCELADO' ? 'cancelled' : 'approved')}>{qrStatusLabels[intent.status]}</span>
        <p className="qr-demo-amount">{moneyDisplay(intent.amountCents)}</p>
        <p>Company: <strong>{business.name}</strong></p>
        <p>Method: <strong>Mercado Pago (recorded only)</strong></p>
        <p>Items or services: <strong>{intent.input.lines.length}</strong></p>
        <p>Internal reference: <code>{intent.id}</code></p>
        <div className="informational-note">
          <Icon name="shield" size={18}/>
          <span><strong>Only local simulation.</strong> This sample QR cannot accept payments. Pending requests leave sales and stock unchanged. Simulated approval records a demo sale.</span>
        </div>
        {error && <p className="form-message error" role="alert">{error}</p>}
        {intent.status === 'PENDIENTE' && <div className="form-actions qr-demo-actions">
          <button type="button" className="button button-secondary" disabled={busy} onClick={() => void act('cancel')}>Cancel Intent</button>
          <button type="button" className="button button-primary" disabled={busy} onClick={() => void act('approve')}>
            <Icon name="shield" size={16}/>{busy ? 'Procesando…' : 'Simulate approval (no actual charge)'}
          </button>
        </div>}
        {intent.status === 'SIMULADO_APROBADO' && <p className="cash-form-hint linked"><Icon name="receipt" size={17}/> A single DEMO sale was registered. It can be consulted in the sales history.</p>}
        {intent.status === 'CANCELADO' && <p className="cash-form-hint unlinked"><Icon name="clock" size={17}/> Intention cancelled. No sales were generated; to try again create a new QR.</p>}
      </div>
    </div>
  </section>
}
