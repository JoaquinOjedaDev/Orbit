import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../app/Icon.tsx'
import { ApiHttpError } from '../../api/httpClient.ts'
import { createOperationsGateway, operationsError } from '../businesses/realOperationsGateway.ts'
import { createCatalogGateway, catalogErrorMessage } from '../catalog/realCatalogGateway.ts'
import { createInventoryGateway, inventoryErrorMessage } from '../inventory/realInventoryGateway.ts'
import type { ReadProbe, ObservedPage, SetupSources, SetupStep } from './realOnboardingModel.ts'
import { assessBusinessSetup } from './realOnboardingModel.ts'
import './realOnboarding.css'

type Props={
  token:string; userId:string; businessId:string
  onNavigate:(next:string)=>void; onUnauthorized:()=>void
}
const PAGE_SIZE=100
const MAX_PAGES=5

/**
 * Un tablero no debe afirmar que algo falta sólo porque la primera página
 * vino vacía/incompleta. Cada lectura es GET, sin mutaciones o datos DEMO.
 */
async function consultPages<T>(
  read:(offset:number,limit:number,signal:AbortSignal)=>Promise<T[]>,
  signal:AbortSignal,
):Promise<ObservedPage<T>> {
  const items:T[]=[]
  for(let page=0;page<MAX_PAGES;page++){
    const rows=await read(page*PAGE_SIZE,PAGE_SIZE,signal)
    items.push(...rows)
    if(rows.length<PAGE_SIZE)return {items,complete:true}
  }
  return {items,complete:false}
}
function asProbe<T>(
  result:PromiseSettledResult<T>,explain:(reason:unknown)=>string,
):ReadProbe<T> {
  return result.status==='fulfilled'
    ?{state:'ready',data:result.value}
    :{state:'unavailable',message:explain(result.reason)}
}
const statusNames={
  done:'Preparado',todo:'Pending',unknown:'No verificado','not-required':'No requiere stock',
} as const
const nextActions=[
  {section:'proveedores',name:'Suppliers',description:'Register contacts and commercial conditions.',icon:'briefcase'},
  {section:'compras',name:'Purchases and receptions',description:'Register purchases and confirm the reception at the correct headquarters.',icon:'shopping'},
  {section:'pos',name:'Point of sale',description:'Prepare a cart and review the declared media before confirming.',icon:'receipt'},
  {section:'ventas',name:'Sales history',description:'Check vouchers registered by your company.',icon:'clock'},
] as const

export function RealOnboardingPage({token,userId,businessId,onNavigate,onUnauthorized}:Props){
  const ops=useMemo(()=>createOperationsGateway(token,userId),[token,userId])
  const catalogApi=useMemo(()=>createCatalogGateway(token,businessId),[token,businessId])
  const inventoryApi=useMemo(()=>createInventoryGateway(token,businessId),[token,businessId])
  const [generation,setGeneration]=useState(0)
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading')
  const [snapshot,setSnapshot]=useState<SetupSources|null>(null)
  const [error,setError]=useState('')

  useEffect(()=>{
    const controller=new AbortController()
    async function load(){
      try{
        // La empresa/membresía REAL siempre se comprueba antes de mostrar progreso.
        const business=await ops.business(businessId,controller.signal)
        if(controller.signal.aborted)return
        const [locations,catalog,balances]=await Promise.allSettled([
          ops.locations(businessId,controller.signal),
          consultPages((offset,limit,signal)=>catalogApi.page(offset,limit,signal),controller.signal),
          consultPages((offset,limit,signal)=>inventoryApi.balances(offset,limit,{},signal),controller.signal),
        ])
        if(controller.signal.aborted)return
        if([locations,catalog,balances].some(result=>result.status==='rejected'
          &&result.reason instanceof ApiHttpError&&result.reason.status===401)){
          onUnauthorized();return
        }
        setSnapshot({
          business,
          locations:asProbe(locations,operationsError),
          catalog:asProbe(catalog,catalogErrorMessage),
          balances:asProbe(balances,inventoryErrorMessage),
        })
        setState('ready')
      }catch(cause){
        if(controller.signal.aborted)return
        if(cause instanceof ApiHttpError&&cause.status===401){onUnauthorized();return}
        setSnapshot(null)
        setError(operationsError(cause))
        setState('error')
      }
    }
    void load()
    return ()=>controller.abort()
  },[ops,catalogApi,inventoryApi,businessId,generation,onUnauthorized])

  const assessment=useMemo(()=>snapshot?assessBusinessSetup(snapshot):null,[snapshot])
  const business=snapshot?.business
  const canConfigure=business?.status==='ACTIVA'&&
    ['TITULAR_ADMINISTRATIVO','ADMINISTRADOR'].includes(business.membership.role)
  const base='/real/empresas/'+businessId
  function navigate(section:string){onNavigate(section?base+'/'+section:base)}
  function refresh(){
    setSnapshot(null);setError('');setState('loading')
    setGeneration(g=>g+1)
  }
  function actionTitle(step:SetupStep){
    return step.status==='done'?'Consultar':canConfigure?'Configurar':'See section'
  }

  return <section className="real-auth-card real-business-panel e3-onboarding" aria-label="Real Start and First Steps">
    <nav className="real-business-nav" aria-label="Home Navigation">
      <button type="button" className="real-auth-link" onClick={()=>onNavigate('/real/empresas')}>
        <Icon name="arrow-left" size={15}/> My companies
      </button>
      <button type="button" className="real-auth-link" onClick={()=>navigate('')}>Company details</button>
    </nav>
    <header className="e3-onboard-hero">
      <span className="e3-onboard-hero-icon" aria-hidden="true"><Icon name="home" size={27}/></span>
      <div className="e3-onboard-hero-copy">
        <span className="real-auth-eyebrow">SELECTED COMPANY · REAL DATA</span>
        <h1>Home</h1>
        <p>{business
          ?'Organize the first steps of '+business.name+'.'
          :'Consult the preparation and tools of your company.'}</p>
      </div>
      <button type="button" className="real-auth-secondary" onClick={refresh}
        disabled={state==='loading'}>
        {state==='loading'?'Consultando…':'Update from API'}
      </button>
    </header>

    {state==='loading'&&<p role="status" className="e3-onboard-loading">
      Consulting the company, its locations, catalog and inventory at FastAPI...
    </p>}
    {state==='error'&&<div className="e3-onboard-error" role="alert">
      <strong>Couldn't check your company.</strong>
      <p>{error}</p>
      <button type="button" className="real-auth-secondary" onClick={refresh}>Retry Reading</button>
    </div>}
    {state==='ready'&&business&&assessment&&<>
      <div className="e3-onboard-business-strip">
        <div><strong>{business.name}</strong>
          <span>{business.category} · {business.membership.role.replaceAll('_',' ')}</span>
        </div>
        <span className={'e3-onboard-business-status'+(business.status==='ACTIVA'?' e3-onboard-active':'')}>
          {business.status==='ACTIVA'?'Active company':'Company suspended'}
        </span>
      </div>
      {business.status!=='ACTIVA'&&<p role="note" className="e3-onboard-warning">
        This company is suspended. You can consult information available, but operations are governed by backend permissions.
      </p>}

      <section className="e3-onboard-progress" aria-label="Initial configuration progress">
        <div className="e3-onboard-progress-head">
          <div><h2>First steps</h2>
            <p>They are completed according to existing records in PostgreSQL, not by ticking boxes.</p>
          </div>
          <strong>{assessment.completed} de {assessment.required} preparados</strong>
        </div>
        <div className="e3-onboard-progress-track" role="progressbar"
          aria-label="Observed initial configuration"
          aria-valuemin={0} aria-valuemax={assessment.required}
          aria-valuenow={assessment.completed}>
          <span style={{width:(assessment.required?100*assessment.completed/assessment.required:0)+'%'}}/>
        </div>
        {!assessment.verified&&<p className="e3-onboard-partial" role="status">
          <Icon name="shield" size={16}/> Some readings are incomplete or restricted. We do not show missing data as if they were zero.
        </p>}
        {assessment.verified&&assessment.completed===assessment.required&&
          <p className="e3-onboard-complete" role="status">
            Checked first steps. This does not replace permissions or checks when operating.
          </p>}
      </section>

      <section className="e3-onboard-checklist" aria-label="REAL Configuration Guide">
        {assessment.steps.map((step,index)=><article key={step.id}
          className={'e3-onboard-step e3-onboard-step-'+step.status}>
          <span className="e3-onboard-step-number">{index+1}</span>
          <div className="e3-onboard-step-copy">
            <div className="e3-onboard-step-top">
              <h3>{step.title}</h3>
              <span className="e3-onboard-step-status">{statusNames[step.status]}</span>
            </div>
            <p>{step.subtitle}</p>
            <small>{step.detail}</small>
          </div>
          <button type="button" className="real-auth-secondary"
            onClick={()=>navigate(step.route)}>
            {actionTitle(step)} <Icon name="arrow" size={15}/>
          </button>
        </article>)}
      </section>

      <section className="e3-onboard-next" aria-label="Available tools">
        <div className="e3-onboard-next-heading">
          <h2>Continue your business</h2>
          <p>Suppliers, purchases and sales are optional tools to configure according to your activity.</p>
        </div>
        <div className="e3-onboard-next-grid">
          {nextActions.map(action=><button type="button" key={action.section}
            onClick={()=>navigate(action.section)} className="e3-onboard-next-card">
            <span className="e3-onboard-next-icon"><Icon name={action.icon} size={21}/></span>
            <strong>{action.name}</strong>
            <small>{action.description}</small>
            <span className="e3-onboard-next-arrow"><Icon name="arrow" size={17}/></span>
          </button>)}
        </div>
      </section>
      <p className="e3-onboard-footnote">
        This guide only makes GET queries from this company. It does not create records, does not modify stock and does not confirm sales. Upon return, update to verify the changes saved. Catalogs and inventory query is limited to {MAX_PAGES*PAGE_SIZE} records by type: if more information exists it is shown as partial.
      </p>
    </>}
  </section>
}
