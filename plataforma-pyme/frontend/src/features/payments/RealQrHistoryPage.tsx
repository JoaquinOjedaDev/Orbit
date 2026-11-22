import { useEffect, useMemo, useState } from 'react'
import { ApiHttpError } from '../../api/httpClient.ts'
import { createQrIntentGateway, QR_HISTORY_PAGE_SIZE, qrIntentError } from './qrIntentGateway.ts'
import type { QrIntentSummary } from './qrIntentGateway.ts'
import { qrStatusPresentation } from './qrUx.ts'
import './realQrHistory.css'

const EXHIBITION_UI = import.meta.env.VITE_PYME_QR_EXHIBITION === '1'

type Props = {
  token: string
  businessId: string
  onNavigate: (path: string) => void
  onUnauthorized: () => void
}
const pesos = (amount: number): string => new Intl.NumberFormat('es-AR', {
  style:'currency', currency:'ARS',
}).format(amount / 100)

export function RealQrHistoryPage({ token, businessId, onNavigate, onUnauthorized }:Props) {
  const api = useMemo(() => createQrIntentGateway(token, businessId), [token,businessId])
  const [page, setPage] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [rows, setRows] = useState<QrIntentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const base = '/real/empresas/' + businessId

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError('')
    void api.list(page*QR_HISTORY_PAGE_SIZE, QR_HISTORY_PAGE_SIZE, ctrl.signal)
      .then(result=>{if(!ctrl.signal.aborted)setRows(result)})
      .catch(err=>{
        if(ctrl.signal.aborted)return
        setRows([])
        if(err instanceof ApiHttpError && err.status===401) onUnauthorized()
        else setError(qrIntentError(err))
      }).finally(()=>{if(!ctrl.signal.aborted)setLoading(false)})
    return ()=>ctrl.abort()
  },[api,page,refreshKey,onUnauthorized])

  return <section className="e3-qr-history-page" aria-label={EXHIBITION_UI ? "Company QR Exhibitions" : "QR collections from the company"}>
    <header className="e3-qr-history-head">
      <div>
        <span className="e3-qr-history-eyebrow">{EXHIBITION_UI ? 'Operations · QR not payable' : 'Operations · Mercado Pago DEMO'}</span>
        <h1>{EXHIBITION_UI ? 'Exhibiciones QR' : 'QR collections'}</h1>
        <p>{EXHIBITION_UI ? 'See the exhibition references saved in PostgreSQL. They are not collections or sales. Permissions apply by company and user.' : 'Check attempts saved in PostgreSQL, its status and test vouchers. Permissions are applied from your company\'s API.'}</p>
      </div>
      <div className="e3-qr-history-actions">
        <button type="button" className="real-auth-primary"
          onClick={()=>onNavigate(base+'/pos')}>{EXHIBITION_UI ? 'New exhibition from the POS' : 'New sale in POS'}</button>
        <button type="button" className="real-auth-secondary"
          onClick={()=>onNavigate(base+'/medios-de-cobro')}>Means of collection</button>
      </div>
    </header>
    <p className="e3-qr-history-disclaimer" role="note">
      {EXHIBITION_UI ? <><strong>NOT PAYABLE EXHIBITION.</strong> These codes do not generate payment market orders, nor accreditations, nor sales, nor stock movements.</> : <><strong>DEMO mode.</strong> These QRs do not allow paying or accrediting real money. An "Approved" state only reflects the laboratory; the QA sale is confirmed separately.</>}
    </p>
    <div className="e3-qr-history-toolbar">
      <h2>{EXHIBITION_UI ? 'History of exhibitions' : 'History of attempts'}</h2>
      <button type="button" className="real-auth-secondary"
        disabled={loading} onClick={()=>setRefreshKey(x=>x+1)}>Update List</button>
    </div>
    {loading && <p role="status">{EXHIBITION_UI ? 'Consultando exhibiciones…' : 'Checking QR collections...'}</p>}
    {error && <div className="real-auth-message real-auth-error" role="alert">
      {error}
      <button type="button" className="real-auth-secondary" onClick={()=>setRefreshKey(x=>x+1)}>Retry Consultation</button>
    </div>}
    {!loading && !error && rows.length===0 && <div className="e3-qr-history-empty">
      <strong>{page===0?(EXHIBITION_UI ? 'There are no exhibitions yet' : 'No QR collections registered yet'):'No more results on this page'}</strong>
      <p>{page===0?'Generate a QR from the point of sale. You will see it here even after you reload the session.':'Return to the previous page to continue the query.'}</p>
      <button type="button" className="real-auth-secondary"
        onClick={()=>page===0?onNavigate(base+'/pos'):setPage(p=>p-1)}>
        {page===0?'Go to the point of sale':'Previous Page'}
      </button>
    </div>}
    {!loading && !error && rows.length>0 &&
      <div className="e3-qr-history-list" aria-label={EXHIBITION_UI ? "List of non-payable exhibits" : "List of collections QR DEMO"}>
        {rows.map(qr=>{
          const state=qrStatusPresentation(qr.status)
          return <article key={qr.id} className="e3-qr-history-card">
            <div className="e3-qr-history-row">
              <span className="e3-qr-history-time">
                <strong>{new Date(qr.created_at).toLocaleDateString('es-AR')}</strong>
                <small>{new Date(qr.created_at).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</small>
              </span>
              <div className="e3-qr-history-info">
                <strong className="e3-qr-history-amount">{pesos(qr.total_cents)}</strong>
                <span className="e3-qr-history-reference">{qr.reference}</span>
                <span className="e3-qr-history-description">{EXHIBITION_UI ? 'Sample reference, no payment or sale' : state.description}</span>
              </div>
              <div className="e3-qr-history-side">
                <span className={'e3-qr-state-pill e3-qr-tone-'+state.tone}>{EXHIBITION_UI ? (qr.status === 'CANCELADA' ? 'Closed display' : qr.status === 'EXPIRADA' ? 'Exhibition expired' : 'Display QR') : state.title}</span>
                {qr.sale_id&&<small className="e3-qr-history-linked">Associated QA checker</small>}
                <button type="button" className="real-auth-secondary"
                  onClick={()=>onNavigate(base+'/qr-cobros/'+qr.id)}>
                  Ver QR y detalle
                </button>
              </div>
            </div>
          </article>
        })}
      </div>}
    <nav className="e3-qr-history-pagination" aria-label={EXHIBITION_UI ? "Paging of QR displays" : "Pagination of QR collections"}>
      <button type="button" className="real-auth-secondary"
        disabled={loading || page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button>
      <span aria-live="polite">Page {page+1}</span>
      <button type="button" className="real-auth-secondary"
        disabled={loading || Boolean(error) || rows.length<QR_HISTORY_PAGE_SIZE}
        onClick={()=>setPage(p=>p+1)}>Siguiente</button>
    </nav>
  </section>
}
