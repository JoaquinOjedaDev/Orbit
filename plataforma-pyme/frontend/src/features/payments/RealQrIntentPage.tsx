import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiHttpError, ApiTransportError } from '../../api/httpClient.ts'
import { RealPhotoPreview } from '../photos/RealPhotos.tsx'
import { createOperationsGateway } from '../businesses/realOperationsGateway.ts'
import { createQrIntentGateway, qrIntentError } from './qrIntentGateway.ts'
import type { QrIntent, QrPaymentEvent, QrSimAction } from './qrIntentGateway.ts'
import type { SaleReceipt } from '../sales/realSalesReadGateway.ts'
import { qrEffectiveStatus, qrStatusPresentation } from './qrUx.ts'
import { createMpOfficialTestGateway } from './mpOfficialTestGateway.ts'
import type { MpTestConnection, MpTestOrder, MpSharedQaConnection, MpSharedQaOrder } from './mpOfficialTestGateway.ts'
import './realQrIntent.css'

type Props = {
  token: string
  userId: string
  businessId: string
  intentId: string
  onNavigate: (path: string) => void
  onUnauthorized: () => void
}

const EXHIBITION_UI = import.meta.env.VITE_PYME_QR_EXHIBITION === '1'
const EXHIBITION_DECISIONS_UI = EXHIBITION_UI &&
  import.meta.env.VITE_PYME_QR_EXHIBITION_DECISIONS === '1'
const LAB_UI_ENABLED = !EXHIBITION_UI && import.meta.env.VITE_PYME_ENABLE_QR_DEMO_LAB === '1'
const FINALIZE_QA_ENABLED = LAB_UI_ENABLED && import.meta.env.VITE_PYME_ENABLE_QR_FINALIZATION_QA === '1'
const ACTIONS: { action: QrSimAction; label: string }[] = [
  { action: 'APROBAR', label: 'Simulate approval' },
  { action: 'RECHAZAR', label: 'Simulate rejection' },
  { action: 'EXPIRAR', label: 'Simulate maturity' },
  { action: 'INDETERMINAR', label: 'Simulate uncertain result' },
]
const pesos = (c: number) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS',
}).format(c / 100)

function qty(milli: number): string {
  const i = Math.floor(milli / 1000)
  const fraction = String(milli % 1000).padStart(3, '0').replace(/0+$/, '')
  return fraction ? i + ',' + fraction : String(i)
}

export function RealQrIntentPage({
  token, userId, businessId, intentId, onNavigate, onUnauthorized,
}: Props) {
  const api = useMemo(() => createQrIntentGateway(token, businessId), [token, businessId])
  const officialApi = useMemo(()=>createMpOfficialTestGateway(token,businessId),[token,businessId])
  const operations = useMemo(() => createOperationsGateway(token, userId), [token, userId])
  const [intent, setIntent] = useState<QrIntent | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [siteName, setSiteName] = useState('')
  const [isManager, setIsManager] = useState(false)
  const [events, setEvents] = useState<QrPaymentEvent[]>([])
  const [officialConnection, setOfficialConnection] = useState<MpTestConnection|null>(null)
  const [officialOrder, setOfficialOrder] = useState<MpTestOrder|null>(null)
  const [sharedQa, setSharedQa] = useState<MpSharedQaConnection|null>(null)
  const [sharedOrder, setSharedOrder] = useState<MpSharedQaOrder|null>(null)
  const [exhibitionUnknown, setExhibitionUnknown] = useState(false)
  const [exhibitionChecked, setExhibitionChecked] = useState(false)
  const exhibitionPending = useRef<{ action: 'ACEPTAR' | 'RECHAZAR'; key: string } | null>(null)
  const [officialBusy, setOfficialBusy] = useState(false)
  const [officialError, setOfficialError] = useState('')
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null)
  const [saleOutcomeUnknown, setSaleOutcomeUnknown] = useState(false)
  const [saleRecoveryChecked, setSaleRecoveryChecked] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const actionRef = useRef<{action: QrSimAction; key: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true); setError(''); setIntent(null)
    void Promise.all([
      api.get(intentId, ctrl.signal),
      api.events(intentId, ctrl.signal),
      EXHIBITION_UI ? Promise.resolve(null) : officialApi.connection(),
      EXHIBITION_UI ? Promise.resolve(null) : officialApi.bySource(intentId),
      EXHIBITION_UI ? Promise.resolve(null) : officialApi.sharedConnection(),
      EXHIBITION_UI ? Promise.resolve(null) : officialApi.sharedBySource(intentId),
      operations.business(businessId, ctrl.signal),
      operations.locations(businessId, ctrl.signal),
]).then(([qr, history, officialState, officialSaved, sharedState, sharedSaved, company, sites]) => {
      if (ctrl.signal.aborted) return
      setIntent(qr)
      setEvents(history)
      setOfficialConnection(officialState)
      setOfficialOrder(officialSaved)
      setSharedQa(sharedState)
      setSharedOrder(sharedSaved)
      if (qr.status === 'FINALIZADA') {
        void api.receipt(intentId, ctrl.signal).then(sale=>{
          if (!ctrl.signal.aborted && qr.sale_id === sale.id) setReceipt(sale)
        }).catch(err=>{ if (!ctrl.signal.aborted) setError(qrIntentError(err)) })
      }
      setIsManager(['TITULAR_ADMINISTRATIVO','ADMINISTRADOR'].includes(company.membership.role) &&
        company.status === 'ACTIVA')
      setCompanyName(company.name)
      setSiteName(sites.find(site => site.id === qr.location_id)?.name ?? '')
    }).catch(err => {
      if (ctrl.signal.aborted) return
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else setError(qrIntentError(err))
    }).finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
    return () => ctrl.abort()
  }, [api, officialApi, intentId, businessId, operations, onUnauthorized])

  async function refreshOfficial() {
    if (officialBusy) return
    setOfficialBusy(true);setOfficialError('')
    try {
      const [link,order]=await Promise.all([
        officialApi.connection(),officialApi.bySource(intentId),
      ])
      setOfficialConnection(link)
      setOfficialOrder(order)
    } catch(err) {
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err))
    } finally{setOfficialBusy(false)}
  }

  async function refreshShared() {
    if (officialBusy) return
    setOfficialBusy(true);setOfficialError('')
    try {
      const [connected,order]=await Promise.all([
        officialApi.sharedConnection(),officialApi.sharedBySource(intentId),
      ])
      setSharedQa(connected)
      setSharedOrder(order)
    } catch(err) {
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err))
    } finally {setOfficialBusy(false)}
  }

  async function makeSharedOrder() {
    if(!intent||!sharedQa?.enabled||!sharedQa.orders_integrated||officialBusy||
      (sharedOrder!==null && !['INDETERMINADA','PREPARANDO'].includes(sharedOrder.status)))return
    if(!window.confirm('Assign this sale to the QR Mercado Pago TEST box? Only for trial accounts.'))return
    setOfficialBusy(true);setOfficialError('')
    try {
      setSharedOrder(await officialApi.sharedCreate(intentId,intent.request_id))
    } catch(err) {
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err)+
        ' The box may be occupied by another company. Consult the order before retrying.')
      void officialApi.sharedBySource(intentId).then(setSharedOrder).catch(()=>{})
    } finally {setOfficialBusy(false)}
  }

  async function reconcileShared() {
    if(!sharedOrder||officialBusy)return
    setOfficialBusy(true);setOfficialError('')
    try {setSharedOrder(await officialApi.sharedReconcile(sharedOrder.id))}
    catch(err) {
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err))
    } finally {setOfficialBusy(false)}
  }

  async function cancelShared() {
    if(!sharedOrder||sharedOrder.status!=='CREADA'||officialBusy||
      !window.confirm('Cancel the warrant and release the box?'))return
    setOfficialBusy(true);setOfficialError('')
    try {setSharedOrder(await officialApi.sharedCancel(sharedOrder.id))}
    catch(err) {
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err)+' Check status before you use the box again.')
    } finally {setOfficialBusy(false)}
  }

  async function settleShared() {
    if(!sharedOrder||sharedOrder.status!=='PROCESADA'||officialBusy||!isManager||
      !window.confirm('Register QA sale after verifying TEST payment? Stock will be discounted exactly once.'))return
    setOfficialBusy(true);setOfficialError('')
    try {
      const result=await officialApi.sharedSettle(sharedOrder.id)
      setSharedOrder(result.order)
    } catch(err) {
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err)+' Check the sale before repeating the closure.')
      void officialApi.sharedBySource(intentId).then(setSharedOrder).catch(()=>{})
    } finally {setOfficialBusy(false)}
  }

  async function makeOfficialTestOrder() {
    if(!intent||!officialConnection?.enabled||officialConnection.status!=='ACTIVA'||
       !officialConnection.external_pos_id||officialBusy||
       (officialOrder!==null && !['INDETERMINADA','PREPARANDO'].includes(officialOrder.status)))return
    if(!window.confirm('Create a QR order in TEST Payment Market? You will use the trial account and the cashier of this company. It is not a production payment.'))return
    setOfficialBusy(true);setOfficialError('')
    try{
      // Se conserva el UUID4 original del QR como clave remota idempotente.
      const result=await officialApi.create(intentId,intent.request_id)
      setOfficialOrder(result)
    }catch(err){
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err)+
        ' Check the original order before sending it back.')
      void officialApi.bySource(intentId).then(setOfficialOrder).catch(()=>{})
    }finally{setOfficialBusy(false)}
  }

  async function reconcileOfficial() {
    if(!officialOrder||officialBusy)return
    setOfficialBusy(true);setOfficialError('')
    try{
      const result=await officialApi.reconcile(officialOrder.id)
      setOfficialOrder(result)
    }catch(err){
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err))
    }finally{setOfficialBusy(false)}
  }

  async function settleOfficialSale() {
    if(!officialOrder||officialOrder.status!=='PROCESADA'||officialBusy||!isManager)return
    if(!window.confirm('Register a single QA sale from payment processed by Mercado Pago TEST? Does not move real money.'))return
    setOfficialBusy(true);setOfficialError('')
    try{
      const result=await officialApi.settle(officialOrder.id)
      setOfficialOrder(result.order)
    }catch(err){
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(qrIntentError(err)+
        ' Check order and voucher: don\'t generate another QR.')
      void officialApi.bySource(intentId).then(setOfficialOrder).catch(()=>{})
    }finally{setOfficialBusy(false)}
  }

  const secondsRemaining = intent ? Math.max(0, Math.ceil((Date.parse(intent.expires_at) - now) / 1000)) : 0
  const displayStatus = intent ? qrEffectiveStatus(intent.status, intent.expires_at, now) : null
  const presentation = displayStatus ? qrStatusPresentation(displayStatus) : null
  async function refresh() {

    if (busy || !intent) return
    setBusy(true); setError('')
    try {
      const [current, history] = await Promise.all([api.get(intentId), api.events(intentId)])
      setIntent(current); setEvents(history)
      if (EXHIBITION_DECISIONS_UI && exhibitionUnknown) {
        setExhibitionChecked(current.status === 'ESPERANDO_PAGO')
        if (current.status !== 'ESPERANDO_PAGO') {
          setExhibitionUnknown(false)
          exhibitionPending.current = null
        }
      }
      if (current.status === 'FINALIZADA') {
        const sale = await api.receipt(intentId)
        if (current.sale_id !== sale.id) throw new Error('QR check incompatible')
        setReceipt(sale)
        setSaleOutcomeUnknown(false)
        setSaleRecoveryChecked(false)
      } else {
        setReceipt(null)
        if (saleOutcomeUnknown && current.status === 'APROBADA_DEMO') {
          // GET resolvió que no se creó venta: mismo QR/endpoint idempotente.
          setSaleRecoveryChecked(true)
        } else {
          setSaleOutcomeUnknown(false)
          setSaleRecoveryChecked(false)
        }
      }
      if (actionRef.current && (
        history.some(event => event.event_key === actionRef.current?.key) ||
        !['ESPERANDO_PAGO','INDETERMINADA'].includes(current.status)
      )) {
        setUncertain(false); actionRef.current = null
      }
    } catch (err) {
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else setError(qrIntentError(err))
    } finally { setBusy(false) }
  }
  async function cancel() {
    if (busy || displayStatus !== 'ESPERANDO_PAGO') return
    if (!window.confirm('Cancel this QR test attempt? No sale was generated.')) return
    setBusy(true); setError('')
    try {
      const result = await api.cancel(intentId)
      setIntent(result)
      setEvents(await api.events(intentId))
    }
    catch (err) {
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else setError(qrIntentError(err))
    } finally { setBusy(false) }
  }


  async function decideExhibition(action: 'ACEPTAR' | 'RECHAZAR', retry = false) {
    if (!EXHIBITION_DECISIONS_UI || !isManager || busy || !intent ||
        displayStatus !== 'ESPERANDO_PAGO' ||
        (exhibitionUnknown && (!retry || !exhibitionChecked))) return
    if (!retry) {
      const question = action === 'ACEPTAR'
        ? 'SIMULAR acceptance of this QR? A fictitious sale will be recorded and the local stock will be discounted. Money will not move.'
        : 'IMMUATE rejection? This QR will be closed without sale or stock movement.'
      if (!window.confirm(question)) return
      exhibitionPending.current = { action, key: crypto.randomUUID() }
    }
    const request = exhibitionPending.current
    if (!request || request.action !== action) return
    setBusy(true); setError('')
    try {
      const result = await api.decideExhibition(intentId, request.action, request.key)
      setIntent(result.intent)
      setReceipt(result.sale)
      setEvents(await api.events(intentId))
      exhibitionPending.current = null
      setExhibitionUnknown(false)
      setExhibitionChecked(false)
    } catch (err) {
      const unknown = err instanceof ApiTransportError ||
        (err instanceof ApiHttpError && err.status >= 500)
      setExhibitionUnknown(unknown)
      setExhibitionChecked(false)
      if (!unknown) exhibitionPending.current = null
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else setError(qrIntentError(err) +
        (unknown ? ' Check the QR before retrying with the same key.' : ' No external payments were confirmed.'))
    } finally { setBusy(false) }
  }

  async function simulate(action: QrSimAction, replay = false) {
    if (!LAB_UI_ENABLED || !isManager || busy || !intent ||
        !['ESPERANDO_PAGO','INDETERMINADA'].includes(intent.status) ||
        (secondsRemaining === 0 && action !== 'EXPIRAR')) return
    if (uncertain && !replay) return
    if (!replay) actionRef.current = { action, key: crypto.randomUUID() }
    const original = actionRef.current
    if (!original) return
    setBusy(true); setError('')
    try {
      const result = await api.simulate(intentId, original.action, original.key)
      const history = await api.events(intentId)
      setIntent(result); setEvents(history)
      setUncertain(false); actionRef.current = null
    } catch (err) {
      const unknown = err instanceof ApiTransportError || (err instanceof ApiHttpError && err.status >= 500)
      if (unknown) setUncertain(true)
      else { actionRef.current = null; setUncertain(false) }
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else setError(qrIntentError(err))
    } finally { setBusy(false) }
  }

  async function finalizeDemoSale(retryAfterCheck = false) {
    if (!FINALIZE_QA_ENABLED || !isManager || busy || intent?.status !== 'APROBADA_DEMO') return
    if (saleOutcomeUnknown && (!retryAfterCheck || !saleRecoveryChecked)) return
    if (!retryAfterCheck && !window.confirm('Register AN internal sale on the evidence base? Stock QA will be discounted. This transaction does NOT credit real money.')) return
    setBusy(true); setError('')
    try {
      const done = await api.finalize(intentId)
      setIntent(done.intent); setReceipt(done.sale)
      setEvents(await api.events(intentId))
      setSaleOutcomeUnknown(false)
      setSaleRecoveryChecked(false)
    } catch (err) {
      if (err instanceof ApiTransportError || (err instanceof ApiHttpError && err.status >= 500)) {
        setSaleOutcomeUnknown(true)
        setSaleRecoveryChecked(false)
      }
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else setError(qrIntentError(err) +
        ' Before repeating the closure consult the status of sale by GET.')
    } finally { setBusy(false) }
  }

  return <section className="real-auth-card real-business-panel e3-qr-page" aria-label="Payment Market QR DEMO payment">
    <div className="e3-qr-heading">
      <div>
        <p className="e3-qr-eyebrow">{EXHIBITION_UI ? 'Point of sale · Non-binding display' : 'Point of sale · Individual collection'}</p>
        <h1>{EXHIBITION_UI ? 'Display QR' : 'Mercado Pago QR'} <span>{EXHIBITION_UI ? 'NOT PAYABLE' : 'DEMO'}</span></h1>
        <p>{EXHIBITION_UI ? 'Amount and detail of items only for display. It does not constitute a payment or sale.' : 'Full breakdown of the amount of this sale, stored in PostgreSQL.'}</p>
      </div>
      <div className="e3-qr-heading-actions">
        <button type="button" className="real-auth-secondary" disabled={busy}
          onClick={() => onNavigate('/real/empresas/' + businessId + '/cobros-qr')}>See QR collections</button>
        <button type="button" className="real-auth-secondary" disabled={busy}
          onClick={() => onNavigate('/real/empresas/' + businessId + '/pos')}>Volver al POS</button>
      </div>
    </div>

    <p className="e3-qr-warning" role="note">
      {EXHIBITION_UI ? <><strong>EXHIBITION · NOT PAYABLE.</strong> Synthetic Orbit QR code. It is not linked to Mercado Pago and cannot accept payments. {EXHIBITION_DECISIONS_UI ? 'Acceptance or rejection is simulated exclusively from the administrative buttons.' : 'It does not generate orders, collections, sales or stock movements.'}</>
        : sharedQa?.enabled
        ? sharedOrder
          ? <><strong>MARKET PAYMENT · TEST STATE QR.</strong> Order assigned to our only box. Check the remote payment before selling.</>
          : <><strong>BOX QA SHARE.</strong> Create the order for this sale before displaying the collectable QR.</>
        : officialOrder
          ? <><strong>OFFICE ORDER · ONLY IN THE TEST ENVIRONMENT.</strong> This QR comes from Orders API and can be tested with trial buyer accounts. Do not use it to collect real funds. The QA sale is recorded separately after conciliation.</>
          : <><strong>SIMULATION · NOT COBRABLE.</strong> The DEMO QR only contains a fictitious reference. It is not a Payment Market order nor does it receive real money.</>}
    </p>
    {!EXHIBITION_UI && !officialOrder && !sharedOrder && !sharedQa?.enabled && presentation && <div className={'e3-qr-explainer e3-qr-tone-'+presentation.tone} role="status">
      <strong>{presentation.title}</strong>
      <p>{presentation.description}</p>
      <small><strong>Next step:</strong> {presentation.nextStep}</small>
    </div>}
    {loading && <p role="status">Loading QR and original detail from API...</p>}
    {error && <p className="real-auth-message real-auth-error" role="alert">{error}</p>}
    {intent && !loading && <div className="e3-qr-layout">
      <div className="e3-qr-visual-panel">
        <div className="e3-qr-status" role="status">
          {EXHIBITION_UI ? 'EXHIBITION · NOT PAYABLE' : sharedOrder ? 'TEST shared box · '+sharedOrder.status : officialOrder ? 'Mercado Pago TEST · '+officialOrder.status : presentation?.title ?? 'QR status'}
        </div>
        {EXHIBITION_UI
          ? <img src={intent.qr_png_data_uri} alt="Synthetic display QR code, not payable and without a payment provider" className="e3-qr-image" width="320" height="320"/>
          : sharedOrder?.qr_png_data_uri
          ? <img src={sharedOrder.qr_png_data_uri} alt="C.L.R. Static single box TEST with associated order" className="e3-qr-image" width="320" height="320"/>
          : officialOrder?.qr_png_data_uri
          ? <img src={officialOrder.qr_png_data_uri}
              alt="Official QR of a TEST-based Mercado Pago order"
              className="e3-qr-image" width="320" height="320"/>
          : !officialOrder && !sharedQa?.enabled
            ? <img src={intent.qr_png_data_uri}
                alt="Fictificant ID QR DEMO, not collectable"
                className="e3-qr-image" width="320" height="320"/>
            : <p role="status">No collectable order: prepare a TEST charge for this sale.</p>}
        <strong className="e3-qr-not-payable">
          {EXHIBITION_UI ? 'EXHIBITION · NOT A PAYMENT MEAN' : sharedQa?.enabled ? (sharedOrder?.status==='CREADA'
            ? '• SINGLE CARTON ORDER' : 'WITHOUT ACTIVATIVE COBRABLE ORDER')
            : officialOrder ? 'MARKET PAYMENT · TEST ACCOUNT · NON-PRODUCTION'
            : '· NOT COBRABLE'}
        </strong>
        <p className="e3-qr-total">{pesos(intent.total_cents)}</p>
        <p className="e3-qr-clock">{
          EXHIBITION_UI ? 'Exposition validity: ' + new Date(intent.expires_at).toLocaleString('es-AR') :
          displayStatus === 'ESPERANDO_PAGO'
            ? 'Vence en ' + Math.floor(secondsRemaining / 60) + ':' +
              String(secondsRemaining % 60).padStart(2, '0')
            : 'Vencimiento: ' + new Date(intent.expires_at).toLocaleString('es-AR')
        }</p>
        <p className="e3-qr-reference">Referencia {EXHIBITION_UI ? 'Display' : 'de prueba'}: <code>{intent.reference}</code></p>
        <div className="e3-qr-buttons">
          <button type="button" className="real-auth-secondary" disabled={busy}
            onClick={() => void refresh()}>{busy ? 'Consultando…' : EXHIBITION_UI ? 'Update Display' : 'Check Status'}</button>
          {!officialOrder && !sharedOrder && displayStatus === 'ESPERANDO_PAGO' &&
            <button type="button" className="real-auth-secondary" disabled={busy}
              onClick={() => void cancel()}>{EXHIBITION_UI ? 'Close Display' : 'Cancelar QR'}</button>}
        </div>
        {EXHIBITION_DECISIONS_UI && isManager && displayStatus === 'ESPERANDO_PAGO' &&
          <div className="e3-qr-finalize" aria-label="Fictuous decision of QR">
            <strong>Internal Simulation · No real money</strong>
            <p>These buttons do not charge for Pay Market. An acceptance records a fictitious sale; rejection does not discount stock.</p>
            {!exhibitionUnknown ? <div className="e3-qr-buttons">
              <button type="button" className="real-auth-primary" disabled={busy}
                onClick={() => void decideExhibition('ACEPTAR')}>
                {busy ? 'Processing…' : 'Simulate acceptance'}
              </button>
              <button type="button" className="real-auth-secondary" disabled={busy}
                onClick={() => void decideExhibition('RECHAZAR')}>
                Simulate rejection
              </button>
            </div> : <>
              <p role="alert">Uncertain result. Consult QR before repeating the simulation.</p>
              <button type="button" className="real-auth-secondary" disabled={busy}
                onClick={() => void refresh()}>Check original status</button>
              {exhibitionChecked && exhibitionPending.current &&
                <button type="button" className="real-auth-secondary" disabled={busy}
                  onClick={() => { if (exhibitionPending.current) void decideExhibition(exhibitionPending.current.action, true) }}>
                  Retry same decision and key
                </button>}
            </>}
          </div>}
        {EXHIBITION_DECISIONS_UI && intent.status === 'RECHAZADA' &&
          <p className="e3-qr-warning" role="status">
            <strong>Fictional rejection registered.</strong> No sale was created or stock discounted.
          </p>}
      </div>
      <div className="e3-qr-details">
        {!EXHIBITION_UI && sharedQa?.enabled && <section className="e3-qr-official" aria-label="Market Single cash payment QR TEST">
          <div className="e3-qr-official-head">
            <h2>Mercado Pago · Shared QR Box</h2>
            <span className="e3-qr-test-pill">Only QA</span>
          </div>
          <p>All companies use the 140776986 box. Each sale has an order, amount and reference of its own. Only one order may be pending in this box.</p>
          {!sharedQa.orders_integrated && <p role="note">The box is linked, but Access Token is not enabled exclusively on the QA backend. It cannot yet be charged.</p>}
          {officialError && <p role="alert" className="real-auth-message real-auth-error">{officialError}</p>}
          <div className="e3-qr-official-actions">
            {!sharedOrder && sharedQa.orders_integrated && displayStatus==='ESPERANDO_PAGO' &&
              <button type="button" className="real-auth-primary" disabled={officialBusy||busy}
                onClick={()=>void makeSharedOrder()}>
                {officialBusy?'Generando…':'Assign sale to real QR TEST'}</button>}
            {sharedOrder && ['PREPARANDO','INDETERMINADA'].includes(sharedOrder.status) &&
              <button type="button" className="real-auth-secondary" disabled={officialBusy}
                onClick={()=>void makeSharedOrder()}>Retry same order and key</button>}
            {sharedOrder?.provider_order_id && <button type="button" className="real-auth-secondary"
              disabled={officialBusy} onClick={()=>void reconcileShared()}>
              Check payment in Mercado Pago</button>}
            {sharedOrder?.status==='CREADA' && <button type="button" className="real-auth-secondary"
              disabled={officialBusy} onClick={()=>void cancelShared()}>
              Cancel TEST order and release box</button>}
            <button type="button" className="real-auth-secondary" disabled={officialBusy}
              onClick={()=>void refreshShared()}>Check Saved Command</button>
          </div>
          {sharedOrder && <>
            <p><strong>Estado:</strong> {sharedOrder.status} · Importe: {pesos(sharedOrder.total_cents)}</p>
            <p><strong>Referencia:</strong> <code>{sharedOrder.external_reference}</code></p>
            {sharedOrder.provider_order_id &&
              <p><strong>ID de orden:</strong> <code>{sharedOrder.provider_order_id}</code></p>}
            {sharedOrder.status==='CREADA' &&
              <p role="status">TEST order active. Use only test buyer and verify the result.</p>}
            {sharedOrder.status==='INDETERMINADA' &&
              <p role="alert">Uncertain answer: the box is still reserved. You don't create a new order.</p>}
            {sharedOrder.status==='PROCESADA' && !sharedOrder.sale_registered && <div>
              <p role="status">TEST payment verified in Mercado Pago. The sale has not yet been registered.</p>
              {isManager && <button type="button" className="real-auth-primary"
                disabled={officialBusy} onClick={()=>void settleShared()}>
                Register verified QA sale and discount stock</button>}
            </div>}
            {sharedOrder.sale_registered &&
              <p role="status">Registered QA sale: <code>{sharedOrder.sale_id}</code>.</p>}
            {sharedOrder.status==='REQUIERE_REVISION' &&
              <p role="alert">Payment verified but not settled sale: review stock without doubling.</p>}
            {['CANCELADA','EXPIRADA','REEMBOLSADA'].includes(sharedOrder.status) &&
              <p role="status">Terminal order. The box is released by confirming that state.</p>}
          </>}
        </section>}
        {!EXHIBITION_UI && !sharedQa?.enabled && <section className="e3-qr-official" aria-label="Official integration Mercado Pago TEST">
          <div className="e3-qr-official-head">
            <h2>Market Official payment · TEST</h2>
            <span className="e3-qr-test-pill">WITHOUT PRODUCTION</span>
          </div>
          <p>Separates the fictitious QR from an official test order. The amount and items remain frozen from the POS; credentials are used exclusively in FastAPI.</p>
          {officialConnection && !officialConnection.enabled &&
            <p role="note">The backend is not yet configured to connect with the TEST provider. DEMO remains available without that connection.</p>}
          {officialConnection?.enabled && officialConnection.status!=='ACTIVA' &&
            <p role="note">First link a Seller TEST account from the Collection media.</p>}
          {officialConnection?.enabled && officialConnection.status==='ACTIVA' &&
            !officialConnection.external_pos_id &&
            <p role="note">Set up a TEST Payment Market Box in the Media collection before issuing the order.</p>}
          {officialError&&<p role="alert" className="real-auth-message real-auth-error">{officialError}</p>}
          <div className="e3-qr-official-actions">
            {!officialOrder && officialConnection?.enabled && officialConnection.status==='ACTIVA' &&
              officialConnection.external_pos_id && displayStatus==='ESPERANDO_PAGO' &&
              <button type="button" className="real-auth-primary" disabled={officialBusy||busy}
                onClick={()=>void makeOfficialTestOrder()}>
                {officialBusy?'Generando…':'Create official QR in Mercado Pago TEST'}
              </button>}
            {officialOrder && <button type="button" className="real-auth-secondary"
              disabled={officialBusy||busy} onClick={()=>void refreshOfficial()}>
              Check Saved Command
            </button>}
            {['INDETERMINADA','PREPARANDO'].includes(officialOrder?.status??'') && officialOrder && <button type="button"
              className="real-auth-secondary" disabled={officialBusy}
              onClick={()=>void makeOfficialTestOrder()}>
              Retry the same command and key
            </button>}
            {officialOrder?.provider_order_id && <button type="button"
              className="real-auth-secondary" disabled={officialBusy}
              onClick={()=>void reconcileOfficial()}>
              Check payment in Mercado Pago
            </button>}
            <button type="button" className="real-auth-secondary"
              onClick={()=>onNavigate('/real/empresas/'+businessId+'/medios-de-cobro')}>
              TEST account and box
            </button>
          </div>
          {officialOrder && <>
            <p><strong>Order status:</strong> {officialOrder.status}</p>
            <p><strong>Referencia:</strong> <code>{officialOrder.external_reference}</code></p>
            {officialOrder.provider_order_id &&
              <p><strong>Order ID:</strong> <code>{officialOrder.provider_order_id}</code></p>}
            {officialOrder.status==='CREADA' &&
              <p role="status">Waiting for payment with TEST buyer account. Use "Check payment" to reconcile with Orders API.</p>}
            {officialOrder.status==='INDETERMINADA' &&
              <p role="alert">The Pago Market response was uncertain. It maintains the original key; don’t generate another charge.</p>}
            {officialOrder.status==='PROCESADA' && !officialOrder.sale_registered &&
              <div className="e3-qr-official-processed">
                <p><strong>TEST payment verified with supplier.</strong> The sale of evidence was not yet recorded or discounted.</p>
                {isManager&&<button type="button" className="real-auth-primary"
                  disabled={officialBusy} onClick={()=>void settleOfficialSale()}>
                  Register verified QA sale and discount stock
                </button>}
              </div>}
            {officialOrder.sale_registered &&
              <p role="status"><strong>QA sales registered.</strong> Comprobante: <code>{officialOrder.sale_id}</code>. No volverá a descontar stock con esta orden.</p>}
            {officialOrder.status==='REQUIERE_REVISION' &&
              <p role="alert">The TEST provider reported collection but the commercial registration requires revision. No partial stock was settled.</p>}
            {officialOrder.status==='REEMBOLSADA' &&
              <p role="alert">The order is refunded in TEST. Check the voucher and inventory compensation if there was a sale.</p>}
          </>}
        </section>}
        {!sharedQa?.enabled && !officialOrder && LAB_UI_ENABLED && isManager && <div className="e3-qr-lab" aria-label="Fiction collection laboratory">
          <h2>QR Laboratory · Tests only</h2>
          <p><strong>This lab does NOT validate a payment Mercado Pago.</strong> Only changes the DEMO status of the attempt and records an audited event. It does not create sales or modify stock.</p>
          {intent.status === 'ESPERANDO_PAGO' || intent.status === 'INDETERMINADA'
            ? <div className="e3-qr-lab-actions">
              {!uncertain && ACTIONS.filter(row =>
                (secondsRemaining > 0 || row.action === 'EXPIRAR') &&
                (row.action !== 'INDETERMINAR' || intent.status === 'ESPERANDO_PAGO')
              ).map(({action,label})=>
                <button key={action} type="button" className="real-auth-secondary"
                  disabled={busy}
                  onClick={()=>void simulate(action)}>{label}</button>)}
              {uncertain && <>
                <p role="alert">Uncertain result: consult the state before attempting another action.</p>
                <button type="button" className="real-auth-secondary" disabled={busy}
                  onClick={()=>void refresh()}>Check status and events</button>
                <button type="button" className="real-auth-secondary" disabled={busy || !actionRef.current}
                  onClick={()=>{ if(actionRef.current) void simulate(actionRef.current.action,true) }}>
                  Retry same event and key
                </button>
              </>}
            </div>
            : <p role="status">The attempt is already resolved; new transitions cannot be simulated.</p>}
        </div>}
        {!sharedQa?.enabled && !officialOrder && FINALIZE_QA_ENABLED && isManager && intent.status === 'APROBADA_DEMO' &&
          <section className="e3-qr-finalize" aria-label="Register sale QA">
            <h2>Confirm test sale</h2>
            <p>Payment was approved by the simulator only. This button records ONE sale in PostgreSQL QA and accounts stock transactionally, without moving real money.</p>
            <button type="button" className="real-auth-primary" disabled={busy || saleOutcomeUnknown}
              onClick={()=>void finalizeDemoSale()}>
              {busy ? 'Registrando…' : 'Register sale QA and discount stock'}
            </button>
            {saleOutcomeUnknown && <p role="alert">Uncertain result: consult the QR and original voucher using GET. Do not generate another QR.</p>}
            {saleOutcomeUnknown && saleRecoveryChecked && <button type="button"
              className="real-auth-secondary" disabled={busy}
              onClick={()=>void finalizeDemoSale(true)}>
              Retry the same QA closure
            </button>}
          </section>}
        {intent.status === 'REQUIERE_REVISION' &&
          <p className="e3-qr-warning" role="alert"><strong>It requires revision:</strong> The stock, headquarters or catalog must be checked. There was no partial debit.</p>}
        {intent.status === 'FINALIZADA' && <section className="e3-qr-finalize" aria-label="QA sale confirmed">
          <h2>{EXHIBITION_DECISIONS_UI ? 'Fictificate acceptance registered' : 'Test sale confirmed'}</h2>
          <p><strong>QA registration, not real money.</strong> The voucher is linked to this QR. You cannot register another sale with the same intent.</p>
          {receipt ? <div>
              <p>Comprobante: <code>{receipt.id}</code></p>
              <p>Total: <strong>{pesos(receipt.total_cents)}</strong> · Medium: Mercado Pago DEMO QA</p>
              <p>Renglones: {receipt.lines.length} · Inventory movements: {receipt.balances_after.length} updated balances</p>
              <details className="e3-qr-receipt">
                <summary>See full QA voucher</summary>
                <div className="e3-qr-receipt-body" aria-label="Detail of the QA voucher">
                  <p><strong>Fecha:</strong> {new Date(receipt.created_at).toLocaleString('es-AR')}</p>
                  <p><strong>Sales ID:</strong> <code>{receipt.id}</code></p>
                  <p><strong>Fictifical reference:</strong> <code>{receipt.payments[0]?.reference}</code></p>
                  <div className="e3-qr-receipt-lines">
                    {receipt.lines.map(line=><div className="e3-qr-receipt-line" key={line.id}>
                      <span>{line.description_snapshot} · {qty(line.quantity_milli)} {line.unit_snapshot} × {pesos(line.unit_price_cents)}</span>
                      <strong>{pesos(line.line_total_cents)}</strong>
                    </div>)}
                  </div>
                  <p>Subtotal <strong>{pesos(receipt.subtotal_cents)}</strong></p>
                  <p>Discount <strong>−{pesos(receipt.discount_cents)}</strong></p>
                  <p className="e3-qr-receipt-grand">Total QA sale <strong>{pesos(receipt.total_cents)}</strong></p>
                  <p><strong>Medio:</strong> Mercado Pago DEMO QA (without actual accreditation)</p>
                  <button type="button" className="real-auth-secondary" onClick={()=>
                    onNavigate('/real/empresas/'+businessId+'/ventas')}>View sales history</button>
                </div>
              </details>
            </div> : <button type="button" className="real-auth-secondary" disabled={busy}
                onClick={()=>void refresh()}>Check voucher</button>}
        </section>}
        {saleOutcomeUnknown && <button type="button" className="real-auth-secondary"
          disabled={busy} onClick={()=>void refresh()}>
          {saleRecoveryChecked ? 'Re-check QA closure' : 'Check original closure result'}
        </button>}
        <div className="e3-qr-history">
          <h2>History of events</h2>
          <p>{EXHIBITION_DECISIONS_UI ? 'History of exhibition and fictional decisions. No event credits money.' : EXHIBITION_UI ? 'History of exhibition references. It does not represent payments, approvals or sales.' : 'Server records, sorted by sequence. No event represents external accreditation.'}</p>
          {events.length === 0 ? <p>There are no events registered for this attempt yet.</p> :
            <ol>{events.map(e=><li key={e.id}>
              <strong>{EXHIBITION_UI && e.action === 'CREAR' ? 'GENERATION EXHIBITION' : EXHIBITION_UI && e.action === 'CANCELAR' ? 'CLOSING EXHIBITION' :
                EXHIBITION_DECISIONS_UI && e.action === 'APROBAR' ? 'SIMULAR ACCEPTANCE' :
                EXHIBITION_DECISIONS_UI && e.action === 'RECHAZAR' ? 'SIMULAR RECHAZO' :
                EXHIBITION_DECISIONS_UI && e.action === 'FINALIZAR' ? 'FICTICIA SALE' : e.action}</strong> · {EXHIBITION_UI && e.action === 'CREAR' ? 'REFERENCE NOT PAYABLE' : e.from_status + ' → ' + e.to_status}
              <small>{new Date(e.created_at).toLocaleString('es-AR')} · Evento {e.sequence}</small>
            </li>)}</ol>}
        </div>
        <h2>{EXHIBITION_UI ? 'Detail of the operation displayed' : 'Detail of the sale'}</h2>
        <p><strong>Empresa:</strong> {companyName || 'Active company'}</p>
        <p><strong>Location:</strong> {intent.location_id ? siteName || 'Sales venue' : 'Services without headquarters'}</p>
        <div className="e3-qr-lines" aria-label="Frozen lines of the attempt">
          {intent.lines.map(line => <div className="e3-qr-line" key={line.catalog_item_id}>
            <RealPhotoPreview token={token}
              owner={{kind: 'CATALOG', businessId, resourceId: line.catalog_item_id}}
              alt={'Current photo of ' + line.description_snapshot} className="e3-qr-photo"/>
            <div className="e3-qr-line-body">
              <strong>{line.description_snapshot}</strong>
              <small>{qty(line.quantity_milli)} {line.unit_snapshot} × {pesos(line.unit_price_cents)}</small>
              {line.sku_snapshot && <small>SKU {line.sku_snapshot}</small>}
            </div>
            <strong>{pesos(line.line_total_cents)}</strong>
          </div>)}
        </div>
        <div className="e3-qr-totals">
          <p>Subtotal <strong>{pesos(intent.subtotal_cents)}</strong></p>
          <p>Discount <strong>−{pesos(intent.discount_cents)}</strong></p>
          <p className="e3-qr-grand-total">{EXHIBITION_UI ? 'Importe exhibido' : 'Total receivable'} <strong>{pesos(intent.total_cents)}</strong></p>
        </div>
        {intent.notes && <p className="e3-qr-note"><strong>Internal Note:</strong> {intent.notes}</p>}
        <p className="e3-qr-footnote">{EXHIBITION_UI
          ? (EXHIBITION_DECISIONS_UI ? 'Non-payable and disconnected QR from Pay Market. Only fictitious acceptance by button can register an internal sale and discount stock; rejection only closes the QR.' :
              'Informational only display. Name, quantity, price and amounts are a PostgreSQL snapshot. The QR contains only a fictitious reference, cannot be paid and does not generate sale or inventory movement. To register a sale use the POS\'s stated payments.')
          : 'The images are currently viewed from the catalogue; name, quantity, price and amounts belong to the original snapshot. B3\'s lab records fictitious results. Closing B4, available only in disposable QA, creates an internal sale; Mercado Pago does not credit funds.'}</p>
      </div>
    </div>}
  </section>
}
