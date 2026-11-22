import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiHttpError } from '../../api/httpClient.ts'
import { createBusinessGateway, businessErrorMessage } from '../businesses/businessGateway.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import { createPaymentConnectionGateway } from './paymentConnectionGateway.ts'
import { createMpOfficialTestGateway } from './mpOfficialTestGateway.ts'
import type { MpTestConnection, MpSharedQaConnection } from './mpOfficialTestGateway.ts'
import type { DemoPaymentConnection } from './paymentConnectionGateway.ts'
import './realPaymentConnections.css'
import './mpOfficialTest.css'

const EXHIBITION_UI = import.meta.env.VITE_PYME_QR_EXHIBITION === '1'

type Props = { token: string; userId: string; businessId: string; onNavigate: (path:string)=>void; onUnauthorized: () => void }

export function RealPaymentConnectionsPage({ token, userId, businessId, onNavigate, onUnauthorized }: Props) {
  const api = useMemo(() => createPaymentConnectionGateway(token, businessId), [token, businessId])
  const official = useMemo(() => createMpOfficialTestGateway(token,businessId), [token,businessId])
  const [officialConnection, setOfficialConnection] = useState<MpTestConnection | null>(null)
  const [sharedQa, setSharedQa] = useState<MpSharedQaConnection | null>(null)
  const [posText, setPosText] = useState('')
  const [officialBusy, setOfficialBusy] = useState(false)
  const [officialError, setOfficialError] = useState('')
  const [officialNotice, setOfficialNotice] = useState('')
  const [company, setCompany] = useState<RealBusiness | null>(null)
  const [connection, setConnection] = useState<DemoPaymentConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const controller = new AbortController()
    setLoading(true); setError(''); setConnection(null); setCompany(null)
    const businessApi = createBusinessGateway(token, userId)
    // Se obtiene la empresa del endpoint autenticado; sin estado global ni demoStore.
    void Promise.all([api.get(controller.signal), businessApi.get(businessId, controller.signal),
      EXHIBITION_UI ? Promise.resolve(null) : official.connection(),
      EXHIBITION_UI ? Promise.resolve(null) : official.sharedConnection()])
      .then(([linked, business, officialLinked, sharedLinked]) => {
        if (!mounted.current || controller.signal.aborted) return
        setConnection(linked); setCompany(business)
        setOfficialConnection(officialLinked)
        setSharedQa(sharedLinked)
        setPosText(officialLinked?.external_pos_id??'')
      })
      .catch(err => {
        if (!mounted.current || controller.signal.aborted) return
        if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
        else setError(businessErrorMessage(err))
      })
      .finally(() => { if (mounted.current && !controller.signal.aborted) setLoading(false) })
    return () => { mounted.current = false; controller.abort() }
  }, [api, official, businessId, token, userId, onUnauthorized])

  const canManage = company?.status === 'ACTIVA'
    && ['TITULAR_ADMINISTRATIVO', 'ADMINISTRADOR'].includes(company.membership.role)
  async function change(action: 'connect' | 'disconnect') {
    if (!canManage || busy || !connection) return
    if (action === 'disconnect' && !window.confirm('Unlink this company\'s DEMO account?')) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = action === 'connect' ? await api.connect() : await api.disconnect()
      if (!mounted.current) return
      setConnection(result)
      setNotice(action === 'connect'
        ? 'Related DEMO account. You can already generate QR test from the POS: they don\'t charge real money.'
        : 'Test account untied.')
    } catch (err) {
      if (!mounted.current) return
      if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
      else {
        setError(err instanceof ApiHttpError && err.status === 409 && action === 'disconnect'
          ? 'The account has a valid QR pending. Consult QR Cobros, resolve or cancel that attempt and then try to untie.'
          : businessErrorMessage(err) + ' Check the state before you try again.')
        // Nunca afirmar que la escritura falló en caso de timeout o error de red.
      }
    } finally { if (mounted.current) setBusy(false) }
  }

  async function beginOfficialOAuth() {
    if(!canManage||officialBusy||!officialConnection?.enabled)return
    setOfficialBusy(true);setOfficialError('');setOfficialNotice('')
    try{
      const url=await official.startOAuth()
      window.location.assign(url)
    }catch(err){
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(businessErrorMessage(err))
      setOfficialBusy(false)
    }
  }
  async function saveOfficialPos() {
    if(!canManage||officialBusy||!officialConnection?.enabled)return
    setOfficialBusy(true);setOfficialError('');setOfficialNotice('')
    try{
      await official.setPos(posText.trim())
      const state=await official.connection()
      if(mounted.current){
        setOfficialConnection(state)
        setOfficialNotice('Associated TEST Box. To be used in the QR test officer commands.')
      }
    }catch(err){
      if(err instanceof ApiHttpError&&err.status===401)onUnauthorized()
      else setOfficialError(businessErrorMessage(err))
    }finally{if(mounted.current)setOfficialBusy(false)}
  }

  return <section className="mp-connection-page" aria-label="Real means of collection">
    <div className="mp-connection-head">
      <div><span className="mp-eyebrow">Administration · Means of collection</span>
        <h1>Means of collection</h1>
        <p>{EXHIBITION_UI ? 'The QR exhibit does not link accounts or charge money. Real sales continue to use stated payments.' : 'Set up how you want to collect from your company. Integration with Mercado Pago starts in trial mode.'}</p>
      </div>
      <span className="mp-mode-pill">{EXHIBITION_UI ? 'QR NOT PAYABLE' : 'SIMULACIÓN'}</span>
    </div>
    {loading && <p role="status">Consulting company and means of collection...</p>}
    {error && <p className="mp-message mp-error" role="alert">{error}</p>}
    {notice && <p className="mp-message" role="status">{notice}</p>}
    {!loading && company && EXHIBITION_UI && <div className="mp-connection-card" aria-label="Non-binding display QR">
      <div className="mp-connection-title">
        <div><h2>Display QR <small>NOT PAYABLE</small></h2>
          <p>{company.name} · No linked account or cash register</p></div>
        <span className="mp-state mp-active">Available</span>
      </div>
      <p>The point of sale can generate a synthetic QR with the amount and detail of each transaction. It does not connect to Pay Market, does not create external orders or confirm payments.</p>
      <div className="mp-actions">
        <button type="button" className="mp-outline" onClick={() => onNavigate('/real/empresas/'+businessId+'/pos')}>Go to the point of sale</button>
        <button type="button" className="mp-outline" onClick={() => onNavigate('/real/empresas/'+businessId+'/cobros-qr')}>See previous exhibitions</button>
      </div>
      <p className="mp-footnote">The Mercado Pago TEST cashier is still disabled on the public site. To register a sale, use payments declared from the POS.</p>
    </div>}
    {!EXHIBITION_UI && !loading && company && connection && !sharedQa?.enabled && <div className="mp-connection-card">
      <div className="mp-connection-title">
        <span className="mp-symbol" aria-hidden="true">MP</span>
        <div><h2>Mercado Pago <small>DEMO</small></h2>
          <p>{company.name} · Account associated with this company only</p></div>
        <span className={'mp-state ' + (connection.status === 'ACTIVA' ? 'mp-active' : '')}>
          {connection.status === 'ACTIVA' ? 'Vinculada' : 'No vinculada'}
        </span>
      </div>
      <dl className="mp-fields">
        <div><dt>Connection type</dt><dd>Fictific account · no real money</dd></div>
        <div><dt>Test holder</dt><dd>{connection.mock_merchant_name ?? 'Unconfigured'}</dd></div>
        <div><dt>DEMO reference</dt><dd>{connection.mock_merchant_ref ?? '—'}</dd></div>
        <div><dt>Status</dt><dd>{connection.status === 'ACTIVA' ? 'Active for future QR tests' : 'No active link'}</dd></div>
      </dl>
      <div className="mp-actions">
        {canManage && connection.status !== 'ACTIVA' &&
          <button type="button" disabled={busy} onClick={() => void change('connect')}>
            {busy ? 'Procesando…' : 'Link demo account'}
          </button>}
        {canManage && connection.status === 'ACTIVA' &&
          <button type="button" className="mp-outline" disabled={busy} onClick={() => void change('disconnect')}>
            {busy ? 'Procesando…' : 'Unlink demo account'}
          </button>}
        <button type="button" className="mp-outline" disabled={busy}
          onClick={() => { setLoading(true); setError(''); void api.get().then(setConnection).catch(err => {
            if (err instanceof ApiHttpError && err.status === 401) onUnauthorized()
            else setError(businessErrorMessage(err))
          }).finally(() => setLoading(false)) }}>Check Status</button>
      </div>
      <div className="mp-actions" aria-label="Access to the company's QR circuit">
        <button type="button" className="mp-outline" onClick={() => onNavigate('/real/empresas/'+businessId+'/cobros-qr')}>
          See QR collections
        </button>
        <button type="button" className="mp-outline" onClick={() => onNavigate('/real/empresas/'+businessId+'/pos')}>
          Go to the point of sale
        </button>
      </div>
      {!canManage && <p className="mp-footnote">Your role allows you to check this setting, but not modify it.</p>}
      <p className="mp-footnote">This account is NOT connected to Pay Market. It allows generating DEMO ID QR and simulating events, but does not credit funds. On a disposable QA basis, an explicit later closure can register an internal sale and discount stock.</p>
    </div>}
    {!EXHIBITION_UI && !loading && company && sharedQa?.enabled && <div className="mp-official-card"
      aria-label="Caja Mercado Pago QA compartido">
      <div className="mp-connection-head">
        <div>
          <span className="mp-eyebrow">QA · Automatic Association</span>
          <h2>Mercado Pago · QR single test</h2>
          <p>The company {company.name} uses the same test box managed by the platform. No account or additional box is created when registering a business.</p>
        </div>
        <span className="mp-mode-pill">Only TEST</span>
      </div>
      <dl className="mp-fields">
        <div><dt>Internal linkage</dt><dd>Available automatically in QA</dd></div>
        <div><dt>Test Seller</dt><dd>{sharedQa.mp_user_id}</dd></div>
        <div><dt>Single branch</dt><dd>{sharedQa.store_id}</dd></div>
        <div><dt>Single box</dt><dd>{sharedQa.pos_id}</dd></div>
        <div><dt>External POS ID</dt><dd><code>{sharedQa.external_pos_id}</code></dd></div>
        <div><dt>TEST Orders</dt><dd>{sharedQa.orders_integrated ? "Set up in QA backend" : "Pending enable in QA backend"}</dd></div>
      </dl>
      {sharedQa.qr_png_data_uri &&
        <div className="mp-official-qr">
          <img src={sharedQa.qr_png_data_uri} width="220" height="220"
            alt="QR Static Official Single Box Mercado Pago QA"/>
        </div>}
      <p className="mp-official-warning" role="note">
        This is a view of the actual static QR of the test box. There is NOT yet a payment order associated with a sale of this company. Scanning it does not demonstrate a payment, nor assign the amount shown in the POS. Do not use to collect out of QA.
      </p>
      <div className="mp-actions">
        <button type="button" className="mp-outline"
          onClick={() => onNavigate('/real/empresas/'+businessId+'/pos')}>
          Ir al POS
        </button>
      </div>
    </div>}
    {!EXHIBITION_UI && !loading && company && officialConnection && !sharedQa?.enabled && <div className="mp-official-card"
      aria-label="Market Official payment TEST">
      <div className="mp-connection-head">
        <div>
          <span className="mp-eyebrow">Integration B6 · Multi-business platform</span>
          <h2>Market Official payment <small>Only TEST</small></h2>
          <p>Connect a test seller account by OAuth. Commands are created with the official Orders API, without placing credentials in the browser.</p>
        </div>
        <span className="mp-mode-pill">TEST · NON-PRODUCTION</span>
      </div>
      {!officialConnection.enabled&&<p className="mp-official-warning" role="note">
        The server is not yet configured for official test commands. The DEMO QR still runs without credentials. Do not enter tokens here.
      </p>}
      <dl className="mp-fields">
        <div><dt>OAuth TEST account</dt><dd>{officialConnection.status==='ACTIVA'?'Vinculada':'No vinculada'}</dd></div>
        <div><dt>Test Seller</dt><dd>{officialConnection.mp_user_id??'No Associated Account'}</dd></div>
        <div><dt>Caja Mercado Pago</dt><dd>{officialConnection.external_pos_id??'Pending Setup'}</dd></div>
        <div><dt>Modo</dt><dd>Dynamic QR commands · test environment</dd></div>
      </dl>
      <p className="mp-footnote">Before generating official QRs, create a Payment Market app for testing, a Seller Test account and your branch/box in Developers. Cash IDs are checked when creating the order on the provider.</p>
      {officialError&&<p className="mp-message mp-error" role="alert">{officialError}</p>}
      {officialNotice&&<p className="mp-message" role="status">{officialNotice}</p>}
      <div className="mp-actions">
        {canManage&&officialConnection.enabled&&<button type="button"
          disabled={officialBusy} onClick={()=>void beginOfficialOAuth()}>
          {officialBusy?'Conectando…':'Link TEST seller by OAuth'}
        </button>}
        <button type="button" className="mp-outline"
          onClick={()=>void official.connection().then(state=>{
            setOfficialConnection(state);setPosText(state.external_pos_id??'')
          }).catch(err=>setOfficialError(businessErrorMessage(err)))}>
          Update TEST status
        </button>
      </div>
      {canManage&&officialConnection.enabled&&officialConnection.status==='ACTIVA'&&
        <div className="mp-official-pos">
          <label htmlFor="mp-official-pos-id">External box identifier (external_pos_id)</label>
          <p>Copy the <code>external_id</code> of the cash created in Mercado Pago Developers. It is not a bank account or a credential.</p>
          <div className="mp-official-pos-controls">
            <input id="mp-official-pos-id" value={posText} maxLength={64}
              autoComplete="off" placeholder="Example: LOCAL001Caja001"
              onChange={event=>setPosText(event.target.value)}/>
            <button type="button" disabled={officialBusy||!/^[A-Za-z0-9_-]{1,64}$/.test(posText.trim())}
              onClick={()=>void saveOfficialPos()}>Save TEST Box</button>
          </div>
        </div>}
      <p className="mp-footnote"><strong>Seguridad:</strong> credentials remain encrypted on the backend. Never copy them to POS, HTML or cell phone. This option is locked unless you can discard QA settings.</p>
    </div>}
  </section>
}
