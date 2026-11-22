import { AppLink } from '../../app/AppLink'
import { Icon } from '../../app/Icon'
import { DemoPhoto } from '../common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import { businessHref, navigationItems } from '../../app/navigation'
import type { DemoBusiness, NavigationItem } from '../../app/navigation'
import type { Navigate } from '../../app/types'

export function Welcome({ navigate, businesses }: { navigate: Navigate; businesses: DemoBusiness[] }) {
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">PERSONAL WORKSPACE</p><h1>Welcome to your workspace</h1><p>Choose a sample business to explore Orbit.</p></div>
    </div>
    <section className="welcome-banner">
      <div className="welcome-symbol"><Icon name="building" size={28} /></div>
      <div><h2>One platform, different businesses</h2><p>Manage products, services, locations and operations from one place.</p></div>
      <span className="light-tag">Initial version</span>
    </section>

    <div className="section-header"><div><h2>My companies</h2><p>Choose a sample company or create your own in this browser.</p></div></div>
    <div className="company-grid">
      {businesses.map((business) => <button type="button" className="company-card" key={business.id} onClick={() => navigate(businessHref(business.id, 'inicio'))}>
        <DemoPhoto imageKey={demoImageKey('business', business.id, 'logo')} alt={business.name + ' logo'}
          fallback={business.initials} className={'company-icon ' + business.accent}/>
        <span className="company-copy"><strong>{business.name}</strong><small>{business.category}</small><span className="small-pill">{business.source === 'created' ? 'Created in DEMO' : 'Sample company'}</span></span>
        <Icon name="arrow" size={19} className="company-arrow" />
      </button>)}
      <button type="button" className="company-card new-company" onClick={() => navigate('/empresas/nueva')}>
        <span className="company-icon add-company"><Icon name="plus" size={23} /></span>
        <span className="company-copy"><strong>Create a company</strong><small>Add a business to your demo workspace.</small><span className="small-pill">Available</span></span>
        <Icon name="arrow" size={19} className="company-arrow" />
      </button>
    </div>
    <div className="informational-note"><Icon name="shield" size={19}/><span>Demo data and settings are stored in your browser.</span></div>
  </>
}

const summaryCards = [
  { metric: 'sales', label: 'Recorded sales', detail: 'Sales recorded in this demo', icon: 'receipt' as const, accent: 'blue' },
  { metric: 'catalog', label: 'Items and services', detail: 'Active catalog entries', icon: 'package' as const, accent: 'mint' },
  { metric: 'movements', label: 'Stock movements', detail: 'Receipts, sales, transfers, and counts', icon: 'truck' as const, accent: 'violet' },
  { metric: 'cash', label: 'Cash sessions', detail: 'Open cash sessions', icon: 'wallet' as const, accent: 'orange' },
]

export function BusinessDashboard({ business, navigate, catalogCount, movementCount, saleCount, openCashCount }: { business: DemoBusiness; navigate: Navigate; catalogCount: number; movementCount: number; saleCount: number; openCashCount: number }) {
  const metrics: Record<string, number> = { sales: saleCount, catalog: catalogCount, movements: movementCount, cash: openCashCount }
  const priority = ['catalogo', 'inventario', 'ventas', 'compras', 'proveedores', 'gastos', 'jornadas', 'cuentas', 'ubicaciones', 'equipo']
  const quickActions = priority.map((id) => navigationItems.find((entry) => entry.id === id)).filter((item): item is NavigationItem => item !== undefined)

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">BUSINESS WORKSPACE</p><h1>Home</h1><p>Review your company and manage daily operations.</p></div>
      <div className="heading-actions"><span className="outline-chip"><Icon name="shield" size={15}/> Demo workspace</span></div>
    </div>

    <section className="business-hero">
      <DemoPhoto imageKey={demoImageKey('business', business.id, 'logo')} alt={business.name + ' logo'}
        fallback={business.initials} className={'company-icon company-icon-large ' + business.accent}/>
      <div><p className="hero-caption">SELECTED COMPANY</p><h2>{business.name}</h2><p>{business.category} · Demo view</p></div>
      <button type="button" className="button button-secondary hero-action" onClick={() => navigate(businessHref(business.id, 'empresa'))}>See company <Icon name="arrow" size={16}/></button>
    </section>

    <div className="section-header"><div><h2>Business overview</h2><p>Activity recorded in this demo company.</p></div><span className="small-pill">Sample data</span></div>
    <div className="stats-grid">
      {summaryCards.map((item) => <div key={item.metric} className="stat-card">
        <span className={'feature-icon ' + item.accent}><Icon name={item.icon} size={20}/></span>
        <span className="stat-label">{item.label}</span>
        <strong className="stat-value">{metrics[item.metric]}</strong>
        <small>{item.detail}</small>
      </div>)}
    </div>

    <div className="section-header spacing-top"><div><h2>Quick links</h2><p>Open the tools you use most.</p></div></div>
    <div className="tool-grid">
      {quickActions.map((item, index) => <AppLink to={businessHref(business.id, item.segment)} navigate={navigate} key={item.id} className="tool-card">
        <span className={'feature-icon ' + ['blue', 'mint', 'violet', 'orange'][index % 4]}><Icon name={item.icon} size={24}/></span>
        <span className="tool-copy"><strong>{item.label}</strong><small>{item.description}</small><span className={'tool-status' + (['ubicaciones', 'equipo', 'catalogo', 'proveedores', 'compras', 'inventario', 'movimientos', 'ventas', 'gastos', 'jornadas', 'cuentas'].includes(item.id) ? ' tool-available' : '')}>{['ubicaciones', 'equipo', 'catalogo', 'proveedores', 'compras', 'inventario', 'movimientos', 'ventas', 'gastos', 'jornadas', 'cuentas'].includes(item.id) ? 'Available in demo' : 'Coming soon'}</span></span>
        <Icon name="arrow" size={17} className="tool-arrow"/>
      </AppLink>)}
    </div>

  </>
}
