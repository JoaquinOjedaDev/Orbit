/**
 * E3-1H1: indicadores de preparación REAL. Son orientación de uso, no reglas de
 * autorización, ni un reporte monetario o un cálculo de stock client-side.
 */
import type { RealBusiness } from '../businesses/businessGateway.ts'
import type { LocationRecord } from '../businesses/realOperationsGateway.ts'
import type { CatalogItem } from '../catalog/realCatalogGateway.ts'
import type { StockBalance } from '../inventory/realInventoryGateway.ts'

export type ReadProbe<T> =
  | { state:'ready'; data:T }
  | { state:'unavailable'; message:string }

export type ObservedPage<T>={items:T[]; complete:boolean}
export type SetupSources={
  business:RealBusiness
  locations:ReadProbe<LocationRecord[]>
  catalog:ReadProbe<ObservedPage<CatalogItem>>
  balances:ReadProbe<ObservedPage<StockBalance>>
}
export type SetupStatus='done'|'todo'|'unknown'|'not-required'
export type SetupStep={
  id:'location'|'catalog'|'stock'
  title:string
  subtitle:string
  status:SetupStatus
  detail:string
  route:'ubicaciones'|'catalogo'|'inventario'
}
export type SetupAssessment={
  steps:SetupStep[]
  completed:number
  required:number
  verified:boolean
  suggested:SetupStep|null
}

export function assessBusinessSetup(s:SetupSources):SetupAssessment {
  const places=s.locations.state==='ready'?s.locations.data:null
  const locationReady=places!==null&&places.some(l=>l.status==='ACTIVA')
  const locations:SetupStep={
    id:'location',title:'Prepare your first location',
    subtitle:'A venue, fair, warehouse, office or other space of your company.',
    route:'ubicaciones',status:places===null?'unknown':locationReady?'done':'todo',
    detail:places===null?'We couldn\'t verify the locations.'
      :locationReady?'Your company already has at least one active location.'
      :'There are no active locations registered yet.',
  }

  const catalog=s.catalog.state==='ready'?s.catalog.data:null
  const activeItems=catalog?.items.filter(i=>i.status==='ACTIVO'&&i.sellable)??[]
  const catalogReady=activeItems.length>0
  const products:SetupStep={
    id:'catalog',title:'Load an article or service',
    subtitle:'Register what your business offers and its sales data.',
    route:'catalogo',
    status:catalog===null?'unknown':catalogReady?'done':catalog.complete?'todo':'unknown',
    detail:catalog===null?'The catalogue could not be verified.'
      :catalogReady?'There is already at least one item or service active and sellable.'
      :catalog.complete?'We didn\'t find any selling items in your catalog.'
      :'The query is partial: there may be articles on other pages.',
  }

  const stockPage=s.balances.state==='ready'?s.balances.data:null
  const physicalIds=new Set(activeItems.filter(i=>i.item_type==='BIEN').map(i=>i.id))
  const storingIds=new Set((places??[]).filter(l=>l.status==='ACTIVA'&&l.can_store).map(l=>l.id))
  const hasStock=Boolean(stockPage?.items.some(b=>b.quantity_milli>0
    &&physicalIds.has(b.catalog_item_id)&&storingIds.has(b.location_id)))
  const onlyServices=Boolean(catalog?.complete&&activeItems.length>0&&physicalIds.size===0)
  let stockStatus:SetupStatus='unknown'
  let stockDetail='A positive balance at a storage facility could not be verified.'
  if(onlyServices){
    stockStatus='not-required'
    stockDetail='Your sellable catalog contains only services: they do not need physical stock.'
  }else if(hasStock){
    stockStatus='done'
    stockDetail='We found positive stocks of a good soldable in an active headquarters with deposit.'
  }else if(catalog?.complete&&!catalogReady){
    stockStatus='todo'
    stockDetail='First load an item. Services do not require physical inventory.'
  }else if(physicalIds.size===0){
    stockDetail='The catalogue is not yet fully verified to determine whether there are physical assets.'
  }else if(places!==null&&storingIds.size===0){
    stockStatus='todo'
    stockDetail='You need an active site enabled to store before starting stock.'
  }else if(stockPage?.complete&&catalog?.complete&&places!==null){
    stockStatus='todo'
    stockDetail='We did not find positive stocks of goods sold at storage sites.'
  }else if(s.balances.state==='unavailable'){
    stockDetail='Stock was not considered to be zero.'
  }else{
    stockDetail='Partial query: cannot be confirmed missing stock.'
  }
  const stocks:SetupStep={
    id:'stock',title:'Check your product inventory',
    subtitle:'For physical goods only: the amount available is controlled by headquarters.',
    route:'inventario',status:stockStatus,detail:stockDetail,
  }
  const steps=[locations,products,stocks]
  const required=steps.filter(step=>step.status!=='not-required')
  const completed=required.filter(step=>step.status==='done').length
  const suggested=required.find(step=>step.status==='todo')??null
  return {
    steps,required:required.length,completed,
    verified:required.every(step=>step.status!=='unknown'),
    suggested,
  }
}
