import { useEffect, useMemo, useRef, useState } from 'react'
import { RealPhotoPreview } from '../photos/RealPhotos.tsx'
import { ApiHttpError, ApiTransportError } from '../../api/httpClient.ts'
import { centsToPesos, pesosToCents } from '../catalog/realCatalogGateway.ts'
import type { CatalogItem } from '../catalog/realCatalogGateway.ts'
import type { LocationRecord } from '../businesses/realOperationsGateway.ts'
import type { PosCartLine } from './realPosDraft.ts'
import { previewPosCart, posQuantityText } from './realPosDraft.ts'
import type { SaleCommand, SaleTotals } from './realSaleCommand.ts'
import { SALE_PAYMENT_METHODS } from './realSaleCommand.ts'
import { completeLastPosPayment, composePosCheckout, POS_PAYMENT_LABELS } from './realPosCheckoutDraft.ts'
import type { PosPaymentDraft } from './realPosCheckoutDraft.ts'
import { createSaleWriteCoordinator } from './realSaleWriteCoordinator.ts'
import type { ConfirmedSale } from './realSaleWriteCoordinator.ts'
import { createPaymentConnectionGateway } from '../payments/paymentConnectionGateway.ts'
import { createQrIntentGateway, makeQrIntentCommand, qrIntentError } from '../payments/qrIntentGateway.ts'
import {
  qrPendingJournal, qrPendingScope, newQrPending,
} from '../payments/qrPendingJournal.ts'
import type { QrPending } from '../payments/qrPendingJournal.ts'
import { salePendingOld } from './salePendingJournal.ts'
import type { SalePending } from './salePendingJournal.ts'

type Props = {
  token: string
  userId: string
  businessId: string
  businessName: string
  role: string
  businessActive: boolean
  location: LocationRecord | null
  items: readonly CatalogItem[]
  cart: readonly PosCartLine[]
  discountText: string
  onDraftLock: (locked: boolean) => void
  onStageChange: (stage: PosCheckoutStage) => void
  onConfirmed: () => void
  onUnauthorized: () => void
  onNavigate: (path: string) => void
}

/**
 * T10-D: explicit confirmation + IndexedDB-first POST, no automatic replay.
 * REAL sale mutation is OFF by default outside explicitly authorized environments.
 * This front-end switch is not RBAC: FastAPI validates every write.
 */
const MUTATIONS_ENABLED = import.meta.env.VITE_PYME_ENABLE_REAL_SALES === '1'
const EXHIBITION_UI = import.meta.env.VITE_PYME_QR_EXHIBITION === '1'
const pesos = (c: number) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS',
}).format(c / 100)
export type PosCheckoutStage = 'checking' | 'editing' | 'review' | 'sending' | 'pending' | 'confirmed' | 'blocked'
type Stage = PosCheckoutStage
type Review = { body: SaleCommand; totals: SaleTotals }
const initialPayment = (amount: number | null): PosPaymentDraft => ({
  method: 'EFECTIVO', amountText: centsToPesos(amount), reference: '',
})

function readableError(error: unknown): string {
  if (error instanceof ApiHttpError) {
    if (error.status === 401) return 'The original attempt is still saved: I re-entered.'
    if (error.status === 403) return 'The API denied this sale by permission, location or pricing policy.'
    if (error.status === 409) return 'The API rejected the operation (stock or request conflict). Don\'t generate another key: see the original attempt.'
    if (error.status === 422) return 'API rejected the command. Check prices, stock, headquarters and data; the original request is retained.'
    return 'API responded to HTTP ' + error.status + '. Consultá el estado antes de intentar nuevamente.'
  }
  if (error instanceof ApiTransportError)
    return 'No reliable confirmation was received (' + error.reason +
      ') The sale could have been registered. Consult by request_id; you don’t believe another sale.'
  return error instanceof Error ? error.message : 'The status of the sale could not be verified.'
}

export function RealPosCheckout({
  token, userId, businessId, businessName, role, businessActive, location,
  items, cart, discountText, onDraftLock, onStageChange, onConfirmed, onUnauthorized, onNavigate,
}: Props) {
  const coordinator = useMemo(
    () => createSaleWriteCoordinator(token, userId, businessId),
    [token, userId, businessId],
  )
  const qrApi = useMemo(() => createQrIntentGateway(token, businessId), [token, businessId])
  const connectionApi = useMemo(() => createPaymentConnectionGateway(token, businessId), [token, businessId])
  const [qrConnection, setQrConnection] = useState<'loading' | 'active' | 'inactive' | 'error'>(EXHIBITION_UI ? 'active' : 'loading')
  const [qrUnknown, setQrUnknown] = useState(false)
  const [qrBusy, setQrBusy] = useState(false)
  const qrAttempt = useRef<QrPending | null>(null)
  const qrNavigateRef = useRef(onNavigate)
  useEffect(() => { qrNavigateRef.current = onNavigate }, [onNavigate])
  const qrScope = useMemo(() => qrPendingScope(userId, businessId), [userId,businessId])
  const [qrRecoveryChecked, setQrRecoveryChecked] = useState(false)
  const [stage, setStage] = useState<Stage>('checking')
  const [payments, setPayments] = useState<PosPaymentDraft[]>([initialPayment(null)])
  const [paymentModified, setPaymentModified] = useState(false)
  const [notes, setNotes] = useState('')
  const [review, setReview] = useState<Review | null>(null)
  const [pending, setPending] = useState<SalePending | null>(null)
  const [confirmed, setConfirmed] = useState<ConfirmedSale | null>(null)
  const [notice, setNotice] = useState('')
  const [ack, setAck] = useState(false)
  const [recoveryChecked, setRecoveryChecked] = useState(false)
  const busy = useRef(false)
  useEffect(()=>onStageChange(stage),[stage,onStageChange])

  useEffect(() => {
    if (EXHIBITION_UI) return // No consultar ni exigir vínculos con Mercado Pago.
    const ctrl = new AbortController()
    setQrConnection('loading')
    void connectionApi.get(ctrl.signal).then(row => {
      if (!ctrl.signal.aborted) setQrConnection(row.status === 'ACTIVA' ? 'active' : 'inactive')
    }).catch(err => {
      if (ctrl.signal.aborted) return
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else setQrConnection('error')
    })
    return () => ctrl.abort()
  }, [connectionApi, onUnauthorized])

  const draft = useMemo(() => {
    try {
      const discount = pesosToCents(discountText)
      if (discount === null) throw new RangeError('Enter a valid discount.')
      const value = previewPosCart(role, businessActive, location, items, cart, discount)
      return { totals: value.totals, problem: '' }
    } catch (error) {
      return { totals: null, problem: error instanceof Error ? error.message : 'Invalid cart.' }
    }
  }, [role, businessActive, location, items, cart, discountText])

  // Antes de una edición manual, el pago único sigue el total del carrito
  // directamente en el render. Evita sincronizar estado derivado con useEffect.
  const shownPayments = !paymentModified && stage === 'editing'
    ? [initialPayment(draft.totals?.total_cents ?? null)]
    : payments

  useEffect(() => {
    let mounted = true
    onDraftLock(true) // fail closed until IndexedDB verifies absence of pending command
    void Promise.all([coordinator.pending(), qrPendingJournal.load(qrScope)]).then(async ([row, qrRow]) => {
      if (!mounted) return
      setPending(row)
      // Recuperación automática del QR de exhibición: no exigir F12,
      // IndexedDB ni comandos manuales para volver a utilizar el POS.
      if (EXHIBITION_UI && qrRow) {
        try {
          const existing = await qrApi.byRequest(qrRow.key)
          if (!mounted) return
          await qrPendingJournal.close(qrRow, existing)
          if (!mounted) return
          qrAttempt.current = null
          setQrUnknown(false)
          onDraftLock(Boolean(row))
          setStage(row ? 'pending' : 'editing')
          qrNavigateRef.current('/real/empresas/' + businessId + '/qr-cobros/' + existing.id)
          return
        } catch (error) {
          if (error instanceof ApiHttpError && error.status === 404) {
            // Solo un GET 404 autenticado habilita el descarte local.
            // Un timeout, 500 o sesión vencida conserva la solicitud.
            try {
              await qrPendingJournal.discardAbsent(qrRow)
              if (!mounted) return
              qrAttempt.current = null
              setQrUnknown(false)
              setNotice('An earlier QR request was cleared that does not exist on this evidence base.')
              setStage(row ? 'pending' : 'editing')
              onDraftLock(Boolean(row))
              return
            } catch {
              // Si IndexedDB cambió o falló, conservar el bloqueo existente.
            }
          }
        }
      }
      if (!mounted) return
      qrAttempt.current = qrRow
      setQrUnknown(Boolean(qrRow))
      setStage(row ? 'pending' : 'editing')
      onDraftLock(Boolean(row || qrRow))
    }).catch(error => {
      if (!mounted) return
      setStage('blocked')
      setNotice(readableError(error))
      onDraftLock(true)
    })
    return () => { mounted = false }
  }, [coordinator, onDraftLock, qrScope, qrApi, businessId])

  const changePayment = (i: number, changes: Partial<PosPaymentDraft>) => {
    setPaymentModified(true)
    setPayments(shownPayments.map((row, index) => index === i ? { ...row, ...changes } : row))
  }

  const reviewSale = () => {
    if (qrUnknown || busy.current) return
    setNotice('')
    try {
      if (!draft.totals) throw new RangeError(draft.problem || 'Invalid cart.')
      const command = composePosCheckout(
        location?.id ?? null, cart, draft.totals.discount_cents, notes, shownPayments,
      )
      if (command.totals.total_cents !== draft.totals.total_cents)
        throw new RangeError('The total changed during the review.')
      setReview(command)
      setStage('review')
      setAck(false)
      onDraftLock(true)
    } catch (error) { setNotice(readableError(error)) }
  }

  async function beginQrIntent(replayOnly = false) {
    if (busy.current || stage !== 'editing' || qrConnection !== 'active') return
    if (qrUnknown && !replayOnly) return
    if (replayOnly && !qrRecoveryChecked) return
    setNotice('')
    busy.current = true
    setQrBusy(true)
    setStage('sending')
    onDraftLock(true)
    try {
      let saved: QrPending
      if (replayOnly) {
        const original = await qrPendingJournal.load(qrScope)
        if (!original || original.key !== qrAttempt.current?.key)
          throw new Error('The saved QR attempt changed. I recovered again for GET.')
        saved = await qrPendingJournal.reserve(original)
      } else {
        if (!draft.totals) throw new RangeError(draft.problem || 'The cart has no total valid.')
        const command = makeQrIntentCommand(location?.id ?? null, cart, draft.totals.discount_cents, notes)
        saved = await qrPendingJournal.reserve(newQrPending(userId, businessId, command))
      }
      qrAttempt.current = saved
      setQrUnknown(true)
      setQrRecoveryChecked(false)
      // El cuerpo y la clave se persistieron y releyeron de IndexedDB ANTES de POST.
      const result = await qrApi.create(saved.body, saved.key)
      await qrPendingJournal.close(saved, result)
      qrAttempt.current = null
      setQrUnknown(false)
      onNavigate('/real/empresas/' + businessId + '/qr-cobros/' + result.id)
    } catch (error) {
      setQrUnknown(true)
      setQrRecoveryChecked(false)
      setNotice(qrIntentError(error) + ' It will recover the original attempt by GET before retrying.')
      setStage('editing')
      onDraftLock(true)
      if (error instanceof ApiHttpError && error.status === 401) onUnauthorized()
    } finally {
      busy.current = false
      setQrBusy(false)
    }
  }

  async function recoverQrAttempt() {
    if (busy.current) return
    busy.current = true
    setQrBusy(true)
    setNotice('')
    setQrRecoveryChecked(false)
    try {
      const original = await qrPendingJournal.load(qrScope)
      if (!original) throw new Error('There is no QR attempt saved for this account and company.')
      qrAttempt.current = original
      const found = await qrApi.byRequest(original.key)
      await qrPendingJournal.close(original, found)
      qrAttempt.current = null
      setQrUnknown(false)
      onNavigate('/real/empresas/' + businessId + '/qr-cobros/' + found.id)
    } catch (error) {
      setQrUnknown(true)
      if (error instanceof ApiHttpError && error.status === 404) {
        if (EXHIBITION_UI && qrAttempt.current) {
          // La exhibición no mueve dinero: si el servidor confirma que
          // el QR no existe, liberar el POS sin limpiar todo el navegador.
          try {
            await qrPendingJournal.discardAbsent(qrAttempt.current)
            qrAttempt.current = null
            setQrUnknown(false)
            setQrRecoveryChecked(false)
            setNotice('Previous non-existent QR: you can already generate a new one.')
            setStage('editing')
            onDraftLock(Boolean(pending))
          } catch {
            setNotice('Local QR request could not be cleared. We kept the lock to avoid duplicating it.')
            onDraftLock(true)
          }
        } else {
          setQrRecoveryChecked(true)
          setNotice('GET returned 404. The previous POST may not have arrived. You can explicitly retry the same key and saved body.')
          onDraftLock(true)
        }
      } else {
        setNotice(qrIntentError(error))
        onDraftLock(true)
        if (error instanceof ApiHttpError && error.status === 401) onUnauthorized()
      }
    } finally {
      busy.current = false
      setQrBusy(false)
    }
  }

  const acceptConfirmed = (result: ConfirmedSale) => {
    setConfirmed(result)
    setPending(null)
    setReview(null)
    setNotice(result.journalCleared ? '' :
      'The sale is confirmed in PostgreSQL, but could not be cleaned IndexedDB. Recover it by GET before another sale.')
    setStage('confirmed')
    setAck(false)
    if (result.journalCleared) {
      onConfirmed()
      onDraftLock(false)
    } else {
      onDraftLock(true)
    }
  }

  const readPendingAfterError = async (error: unknown) => {
    setNotice(readableError(error))
    setReview(null)
    setAck(false)
    setRecoveryChecked(false)
    onDraftLock(true)
    if (error instanceof ApiHttpError && error.status === 401) onUnauthorized()
    try {
      const row = await coordinator.pending()
      if (row) { setPending(row); setStage('pending') }
      else { setStage('blocked') }
    } catch { setStage('blocked') }
  }

  async function confirmReviewed() {
    if (busy.current || !MUTATIONS_ENABLED || !ack || !review || stage !== 'review') return
    busy.current = true
    setStage('sending')
    setNotice('')
    try {
      // Ordering is critical: durable IndexedDB write + read-back BEFORE POST.
      const saved = await coordinator.prepare(review.body)
      setPending(saved)
      const result = await coordinator.sendApproved(saved.key, true)
      acceptConfirmed(result)
    } catch (error) { await readPendingAfterError(error) }
    finally { busy.current = false }
  }

  async function recoverOriginal() {
    if (busy.current) return
    busy.current = true
    setStage('sending')
    setRecoveryChecked(false)
    setNotice('')
    try {
      const result = await coordinator.recover() // GET only
      if (result.state === 'confirmed') acceptConfirmed(result)
      else if (result.state === 'not-found') {
        setPending(result.pending)
        setRecoveryChecked(true)
        setNotice('GET returned 404: this does NOT show that the original POST did not arrive. You can explicitly retry the SAME key and body, without modifying amounts.')
        setStage('pending')
      } else {
        setPending(null)
        setStage('editing')
        onDraftLock(false)
      }
    } catch (error) {
      setNotice(readableError(error))
      setStage('pending')
      if (error instanceof ApiHttpError && error.status === 401) onUnauthorized()
    } finally { busy.current = false }
  }

  async function replayOriginal() {
    if (busy.current || !MUTATIONS_ENABLED || stage !== 'pending' ||
      !pending || !recoveryChecked || !ack) return
    busy.current = true
    setStage('sending')
    setRecoveryChecked(false)
    setNotice('')
    try {
      const result = await coordinator.sendApproved(pending.key, true)
      acceptConfirmed(result)
    } catch (error) {
      await readPendingAfterError(error)
    } finally { busy.current = false }
  }

  async function verifyStorage() {
    if (busy.current) return
    busy.current = true
    setNotice('')
    try {
      const [row, qrRow] = await Promise.all([coordinator.pending(), qrPendingJournal.load(qrScope)])
      setPending(row)
      qrAttempt.current = qrRow
      setQrUnknown(Boolean(qrRow))
      setStage(row ? 'pending' : 'editing')
      onDraftLock(Boolean(row || qrRow))
    } catch (error) {
      setNotice(readableError(error)); setStage('blocked')
      onDraftLock(true)
    } finally { busy.current = false }
  }

  const totalPayments = shownPayments.reduce((acc, payment) => {
    try {
      const amount = pesosToCents(payment.amountText)
      return amount === null ? acc : acc + BigInt(amount)
    } catch { return acc }
  }, 0n)
  const currentTotal = draft.totals?.total_cents ?? null
  const outstandingCents=currentTotal===null?null:BigInt(currentTotal)-totalPayments
  function fillLastPayment(){
    setNotice('')
    try{
      if(currentTotal===null)throw new RangeError('First arm a cart with valid total.')
      setPayments(completeLastPosPayment(currentTotal,shownPayments))
      setPaymentModified(true)
    }catch(err){
      setNotice(readableError(err))
    }
  }

  return <section className={'real-ops-subpanel real-pos-checkout e3-pos-checkout e3-pos-checkout-'+stage}
      aria-label="Real Payments and Confirmation" data-stage={stage}>
    <h2>{stage==='review'?'Final detail to confirm sale'
      :stage==='pending'?'Recover pending sale'
      :stage==='confirmed'?'Confirmed sale'
      :stage==='sending'?'Processing sale'
      :stage==='blocked'?'Verify pending sale'
      :'4. Declared payments and confirmation'}</h2>
    <p className="real-auth-note"><strong>Payments are seller's statements.</strong> No money is consulted or credited in banks, cards, ID Account or Payment Market. A confirmed sale does generate proof and, if it includes physical goods, accounts stock at PostgreSQL.</p>

    {stage === 'checking' && <p role="status">Checking pending sales in IndexedDB...</p>}
    {stage === 'blocked' && <>
      <p role="alert" className="real-auth-message real-auth-error">{notice || 'Could not verify if an outstanding sale exists. No POST will be sent.'}</p>
      <button type="button" className="real-auth-secondary" onClick={() => void verifyStorage()}>Recheck local storage</button>
    </>}

    {stage === 'editing' && <>
      <p>Check the amounts and declare them in one or more means. The amounts must add up exactly to the total of the sale.</p>
      {draft.totals && <div className="e3-pos-payment-breakdown" aria-label="Calculation of total receivable" role="status">
        <span>Subtotal items <strong>{pesos(draft.totals.subtotal_cents)}</strong></span>
        <span>Discount applied to sale <strong>−{pesos(draft.totals.discount_cents)}</strong></span>
        <span>Total receivable <strong>{pesos(draft.totals.total_cents)}</strong></span>
        <small>The discount changes the total to pay; it does not alter the unit prices of catalog.</small>
      </div>}
      <div className="e3-pos-qr-action" aria-label={EXHIBITION_UI ? "Unpayable display QR" : "Alternative payment with QR DEMO"}>
        <h3>{EXHIBITION_UI ? 'Display QR · NOT PAYABLE' : 'Mercado Pago QR (demo)'}</h3>
        <p>{EXHIBITION_UI
          ? 'Only display: will show items, quantities, discounts and total of the cart. The code does not open Mercado Pago, neither creates orders nor records sales or payments. To register a real sale you will use declared means.'
          : 'Alternative to declared payments: generates an attempt for the complete total of the cart, without registering sale or charging money. You can see items, quantities and discounts next to the QR.'}</p>
        {qrConnection === 'loading' && <p role="status">Checking the Linking Mercado Pago...</p>}
        {qrConnection === 'error' && <p role="alert">I opened up the means of collection and tried again.</p>}
        {qrConnection === 'inactive' && <p role="status">Before generating a QR, link the DEMO Payment Market account of this company.</p>}
        {qrUnknown && <p role="alert" className="real-auth-message real-ops-warning">
          There is a previous QR request pending. We are checking your status to avoid duplicates.
        </p>}
        <div className="e3-pos-qr-buttons">
          {qrConnection === 'active' && <button type="button" className="real-auth-primary"
            disabled={!draft.totals || qrBusy || qrUnknown}
            onClick={() => void beginQrIntent()}>
              {qrBusy ? 'Generating QR…' : EXHIBITION_UI ? 'Generate Display QR' : 'Generate collection QR (DEMO)'}
          </button>}
          {qrUnknown && <button type="button" className="real-auth-secondary"
            disabled={qrBusy} onClick={() => void recoverQrAttempt()}>
            Consult attempt by request
          </button>}
          {qrUnknown && <button type="button" className="real-auth-secondary"
            disabled={qrBusy || !qrRecoveryChecked} onClick={() => void beginQrIntent(true)}>
            Retry QR and key
          </button>}
          <button type="button" className="real-auth-secondary"
            onClick={() => onNavigate('/real/empresas/' + businessId + '/cobros-qr')}>
            {EXHIBITION_UI ? 'View Previous Display QR' : 'See previous QR collections'}
          </button>
          {qrConnection !== 'active' && <button type="button" className="real-auth-secondary"
            onClick={() => onNavigate('/real/empresas/' + businessId + '/medios-de-cobro')}>
            Go to Media
          </button>}
        </div>
      </div>
      {shownPayments.map((row, i) => <div className="real-pos-payment" key={i}>
        <label>Payment method {i + 1}
          <select aria-label={'Payment method ' + (i + 1)} value={row.method} onChange={event =>
            changePayment(i, { method: event.target.value as PosPaymentDraft['method'] })}>
            {SALE_PAYMENT_METHODS.map(method =>
              <option value={method} key={method}>{POS_PAYMENT_LABELS[method]}</option>)}
          </select>
        </label>
        <label>Amount declared (ARS) {i + 1}
          <input aria-label={'Importe declarado ' + (i + 1)} inputMode="decimal"
            value={row.amountText} onChange={event => changePayment(i, { amountText: event.target.value })}/>
        </label>
        <label>Reference (optional) {i + 1}
          <input aria-label={'Payment reference ' + (i + 1)} maxLength={120}
            value={row.reference} onChange={event => changePayment(i, { reference: event.target.value })}/>
        </label>
        {i===shownPayments.length-1&&<div className="e3-pos-fill-payment-block">
          <button type="button" className="real-auth-secondary e3-pos-fill-payment"
            aria-label="Complete balance with last payment medium" onClick={fillLastPayment}
            disabled={currentTotal===null}>Complete outstanding balance</button>
          {currentTotal===null&&<small role="status">
            First add items to your cart and I obtained a valid total to complete the balance.
          </small>}
          {currentTotal!==null&&<small>
            Calculates the remaining amount after discount and previous media. It does not record sale.
          </small>}
        </div>}
        {shownPayments.length > 1 && <button className="real-auth-link" type="button" onClick={() => {
          setPaymentModified(true)
          setPayments(shownPayments.filter((_, index) => index !== i))
        }}>Remove medium {i + 1}</button>}
      </div>)}
      <button type="button" className="real-auth-secondary" disabled={shownPayments.length >= 6}
        onClick={() => {
          setPaymentModified(true)
          setPayments([...shownPayments, { method: 'TRANSFERENCIA', amountText: '', reference: '' }])
        }}>Add another means of payment</button>
      <p className="real-pos-payment-summary" role="status">Payments entered: <strong>{pesos(Number(totalPayments))}</strong>
        {' · '} Total to declare: <strong>{currentTotal === null ? '—' : pesos(currentTotal)}</strong>
        {outstandingCents!==null&&<span className={'e3-pos-outstanding'+
          (outstandingCents===0n?' e3-pos-paid':outstandingCents<0n?' e3-pos-excess':'')}>
          {outstandingCents===0n?' · Importe cubierto'
            :outstandingCents>0n?' · Falta declarar: '+pesos(Number(outstandingCents))
            :' · Excedente: '+pesos(Number(-outstandingCents))}
        </span>}
      </p>
      <label>Sales notes (optional)
        <textarea aria-label="Sales notes" rows={2} maxLength={500}
          value={notes} onChange={event => setNotes(event.target.value)}/>
      </label>
      {notice && <p role="alert" className="real-auth-message real-auth-error">{notice}</p>}
      <div className="e3-pos-finalize-bar">
        <p>The next step shows the full detail and asks for confirmation. It does not yet record the sale or move stock.</p>
        <button type="button" className="real-auth-primary" disabled={!currentTotal || qrBusy || qrUnknown}
          onClick={reviewSale}>End sale</button>
      </div>
    </>}

    {stage === 'review' && review && <>
      <div className="real-pos-final-review" aria-label="Final review of the sale">
        <h3>Complete details of the sale · pending confirmation</h3>
        <p><strong>Empresa:</strong> {businessName}</p>
        <p><strong>Sede:</strong> {location?.name ?? 'No head office · services'}</p>
        <div className="e3-pos-review-lines" aria-label="Items on sale">
          {review.body.lines.map((line,i)=>{
            const item=items.find(entry=>entry.id===line.catalog_item_id)
            return <div key={line.catalog_item_id} className="e3-pos-review-line">
              {item&&<RealPhotoPreview token={token} owner={{kind:'CATALOG',businessId,resourceId:item.id}}
                alt={'Current cover of '+item.name} className="e3-pos-review-photo"/>}
              <div><strong>{item?.name??'Item'}</strong>
                <small>{posQuantityText(line.quantity_milli)} {item?.unit??''} × {pesos(line.unit_price_cents)} per unit</small>
              </div>
              <strong>{pesos(review.totals.line_totals_cents[i])}</strong>
            </div>
          })}
        </div>
        <p className="e3-photo-reference-note">The images are visual references of the current catalogue; they are not part of the voucher nor modify amounts.</p>
        <div className="e3-pos-review-totals" aria-label="Total discount">
          <p>Subtotal items <strong>{pesos(review.totals.subtotal_cents)}</strong></p>
          <p>Discount applied <strong>−{pesos(review.totals.discount_cents)}</strong></p>
          <p className="real-pos-final-total">Total receivable <strong>{pesos(review.totals.total_cents)}</strong></p>
        </div>
        <h4>Declared payments</h4>
        <div className="e3-pos-review-payments">
          {review.body.payments.map((payment,i)=>
            <div key={i}><span>{POS_PAYMENT_LABELS[payment.method]}{payment.reference?' · '+payment.reference:''}</span>
              <strong>{pesos(payment.amount_cents)}</strong></div>)}
        </div>
        {review.body.notes && <p>Notas: {review.body.notes}</p>}
      </div>
      <label className="real-pos-ack">
        <input type="checkbox" aria-label="I agree to register this REAL sale"
          checked={ack} onChange={e => setAck(e.target.checked)}/>
        I confirm company, headquarters, prices, quantities and means declared. I understand that a confirmed sale records proof and affects physical stock.
      </label>
      {!MUTATIONS_ENABLED && <p className="real-auth-note">The REAL sales log is disabled in this environment. It is only enabled by explicit configuration in an authorized environment; you can review the data without registering operations.</p>}
      <div className="real-pos-confirm-actions e3-pos-confirm-actions">
        <button type="button" className="real-auth-secondary" onClick={() => {
          setStage('editing'); setReview(null); setAck(false); onDraftLock(false)
        }}>Reedit</button>
        <button type="button" className="real-auth-primary"
          disabled={!ack || !MUTATIONS_ENABLED} onClick={() => void confirmReviewed()}>
          Confirm and register REAL sale
        </button>
      </div>
    </>}

    {stage === 'sending' && <p role="status">{qrBusy ? 'Generating a DEMO QR and saving your detail in PostgreSQL...' : 'Checking and sending the original request for sale... Do not close the session until you see the result.'}</p>}

    {stage === 'pending' && pending && <>
      <p role="alert" className="real-auth-message real-ops-warning">
        There is a saved sale request that requires recovery. Do NOT create another sale or change its content.
      </p>
      <p><strong>Clave original:</strong> <code>{pending.key}</code></p>
      <p><strong>Original total:</strong> {pesos(
        pending.body.lines.reduce((total, line) =>
          total + Number((BigInt(line.quantity_milli) * BigInt(line.unit_price_cents) + 500n) / 1000n), 0)
        - pending.body.discount_cents)}</p>
      {salePendingOld(pending) &&
        <p className="real-auth-note">This attempt has more than 30 days. It is not automatically deleted.</p>}
      {notice && <p role="alert" className="real-auth-message real-ops-warning">{notice}</p>}
      <button type="button" className="real-auth-secondary" onClick={() => void recoverOriginal()}>
        Recover proof by request (GET)
      </button>
      {recoveryChecked && <>
        <label className="real-pos-ack">
          <input type="checkbox" aria-label="I agree to forward the same request"
            checked={ack} onChange={event => setAck(event.target.checked)}/>
          I understand that 404 is ambiguous. I authorize to retry the same saved request (same key and body).
        </label>
        <button type="button" className="real-auth-primary"
          disabled={!MUTATIONS_ENABLED || !ack} onClick={() => void replayOriginal()}>
          Retry this sale exactly
        </button>
      </>}
    </>}

    {stage === 'confirmed' && confirmed && <>
      <p role="status" className="real-auth-message real-ops-success">Confirmed sale at PostgreSQL. REAL Checker: {confirmed.receipt.id}</p>
      <p><strong>Application key:</strong> <code>{confirmed.receipt.request_id}</code></p>
      <p><strong>Total confirmed:</strong> {pesos(confirmed.receipt.total_cents)}</p>
      <p><strong>Pagos:</strong> declared, without external accreditation.</p>
      {!confirmed.journalCleared && <p role="alert" className="real-auth-message real-ops-warning">{notice}</p>}
      {confirmed.journalCleared
        ? <button type="button" className="real-auth-secondary" onClick={() => {
          setConfirmed(null); setPaymentModified(false); setPayments([initialPayment(null)])
          setNotes(''); setAck(false); setStage('editing'); onDraftLock(false)
        }}>Prepare another sale</button>
        : <button type="button" className="real-auth-secondary" onClick={() => void recoverOriginal()}>
            Retry cleaning using GET
          </button>}
      <button type="button" className="real-auth-link"
        onClick={() => onNavigate('/real/empresas/' + businessId + '/ventas')}>
        Open REAL History
      </button>
    </>}
  </section>
}
