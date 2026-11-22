import { receiptDisplay } from './receiptViewModel.ts'
import type { ReceiptViewer, ReceiptActor } from './receiptViewModel.ts'
import type { Purchase, PurchaseReceipt } from './realSupplyGateway.ts'
import type { LocationRecord } from '../businesses/realOperationsGateway.ts'

type Props={
  receipt:PurchaseReceipt
  purchase:Purchase|null
  locations:LocationRecord[]
  viewer:ReceiptViewer
  actors?:ReadonlyArray<ReceiptActor>
  onClose:()=>void
}
export function RealReceiptDetail({receipt,purchase,locations,viewer,actors=[],onClose}:Props){
  const info=receiptDisplay(receipt,purchase,locations,viewer,actors)
  return <section className="real-supply-receipt-detail" aria-label="Confirmed reception detail">
    <div className="real-supply-receipt-heading">
      <div>
        <h3>Reception detail</h3>
        <p>{info.purchaseTitle}</p>
      </div>
      <span className="real-catalog-status real-catalog-active">CONFIRMED</span>
    </div>
    <dl className="real-supply-receipt-facts">
      <div><dt>Reception location</dt><dd>{info.locationName}</dd></div>
      <div><dt>Date and time of confirmation</dt><dd>{info.confirmedAt}</dd></div>
      <div><dt>He registered the purchase.</dt><dd>{info.purchaseCreatorName}</dd></div>
      <div><dt>Confirmed reception</dt><dd>{info.responsibleName}</dd></div>
    </dl>
    <div className="real-supply-receipt-movements">
      <h4>Inventory entries <span>({info.movementLines.length})</span></h4>
      {info.movementLines.length===0
        ?<p>No physical movements were reported for this voucher.</p>
        :<ul>{info.movementLines.map(m=><li key={m.id}>
          <div><strong>{m.description}</strong>
            <small>{m.balanceAfter===null?'Uninformed posterior balance':`Saldo posterior: ${m.balanceAfter} ${m.unit}`}</small>
          </div>
          <strong className="real-supply-receipt-delta">+{m.entered} {m.unit}</strong>
        </li>)}</ul>}
    </div>
    <div className="real-supply-receipt-footer">
      <p>Internal registration confirmed in FastAPI and PostgreSQL. It is not a supplier invoice or PDF file.</p>
      <details>
        <summary>Traceability identifiers</summary>
        <dl>
          <dt>Receipt</dt><dd className="real-supply-receipt-id">{info.receiptId}</dd>
          <dt>Location</dt><dd className="real-supply-receipt-id">{info.locationId}</dd>
          {info.purchaseCreatorId&&<><dt>User who registered the purchase</dt><dd className="real-supply-receipt-id">{info.purchaseCreatorId}</dd></>}
          <dt>User who confirmed receipt</dt><dd className="real-supply-receipt-id">{info.responsibleId}</dd>
        </dl>
      </details>
      <button className="real-auth-secondary" type="button" onClick={onClose}>Close detail</button>
    </div>
  </section>
}
