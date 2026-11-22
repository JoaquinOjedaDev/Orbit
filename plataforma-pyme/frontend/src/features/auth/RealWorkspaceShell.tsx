import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../app/Icon'
import { ApiHttpError } from '../../api/httpClient.ts'
import { businessErrorMessage, createBusinessGateway } from '../businesses/businessGateway.ts'
import type { RealBusiness } from '../businesses/businessGateway.ts'
import { REAL_WORKSPACE_ITEMS, realWorkspaceHref, realWorkspaceTitle } from './realWorkspaceNavigation.ts'
import './realWorkspace.css'

type Props = {
  token: string
  userId: string
  userName: string
  path: string
  businessId: string | null
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate: (route: string) => void
  onUnauthorized: () => void
  onLogout: () => void
}

/** Shared navigation only. Business state remains inside API-backed page components. */
export function RealWorkspaceShell({ token, userId, userName, path, businessId,
  collapsed, onToggleCollapse, onNavigate, onUnauthorized, onLogout }: Props) {
  const [companies, setCompanies] = useState<RealBusiness[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const gateway = useMemo(() => createBusinessGateway(token, userId), [token, userId])

  // Keyed by session + tenant in RealAuthApp. Abort old requests during remount.
  useEffect(() => {
    const controller = new AbortController()
    // The session/tenant key remounts this shell with fresh initial state.
    // Request results are asynchronous, so no synchronous state reset is needed.
    void gateway.list(controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setCompanies(result)
      setState('ready')
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return
      if (cause instanceof ApiHttpError && cause.status === 401) {
        onUnauthorized()
        return
      }
      setCompanies([])
      setError(businessErrorMessage(cause))
      setState('error')
    })
    return () => controller.abort()
  }, [gateway, onUnauthorized])

  useEffect(() => {
    if (!drawerOpen) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const opener = triggerRef.current
    closeRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setDrawerOpen(false)
      if (event.key !== 'Tab') return
      const menu = document.getElementById('real-workspace-nav')
      if (!menu) return
      const elements = Array.from(menu.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((item) => item.getClientRects().length > 0)
      const first = elements[0]
      const last = elements.at(-1)
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previous?.isConnected) previous.focus()
      else opener?.focus()
    }
  }, [drawerOpen])

  function navigate(next: string) {
    setDrawerOpen(false)
    onNavigate(next)
  }

  const active = businessId ? companies.find((company) => company.id === businessId) ?? null : null
  const displayBusiness = state === 'loading' ? 'Consulting company...'
    : active ? active.name
    : businessId ? 'Unverified company' : 'Select a company'
  const title = realWorkspaceTitle(path)
  const sections = ['Administration', 'Operations'] as const

  return <>
    {drawerOpen && <button type="button" className="rw-overlay" aria-label="Close Navigation" onClick={() => setDrawerOpen(false)} />}
    <aside id="real-workspace-nav" className={'rw-sidebar' + (drawerOpen ? ' rw-sidebar-open' : '')}
      aria-label="REAL Navigation" role={drawerOpen ? 'dialog' : undefined} aria-modal={drawerOpen || undefined}>
      <div className="rw-brand">
        <span className="rw-logo" aria-hidden="true"><Icon name="building" size={23} /></span>
        <div className="rw-brand-copy"><strong>Orbit</strong><small>Business management</small></div>
        <button ref={closeRef} type="button" className="rw-close" aria-label="Close Menu" onClick={() => setDrawerOpen(false)}>×</button>
      </div>
      <nav className="rw-sidebar-scroll" aria-label="Sections available in REAL">
        <p className="rw-nav-caption">My space</p>
        <button type="button" className={'rw-nav-item' + (path === '/real/empresas' ? ' rw-active' : '')}
          aria-label="Go to the list of companies" title="My companies"
          aria-current={path === '/real/empresas' ? 'page' : undefined} onClick={() => navigate('/real/empresas')}>
          <Icon name="home" size={18}/><span className="rw-nav-text">My companies</span></button>
        <button type="button" className={'rw-nav-item' + (path === '/real/perfil' ? ' rw-active' : '')}
          aria-current={path === '/real/perfil' ? 'page' : undefined} aria-label="My profile" title="My profile" onClick={() => navigate('/real/perfil')}>
          <Icon name="user" size={18}/><span className="rw-nav-text">My profile</span></button>
        {businessId && active && sections.map((section) => <div className="rw-nav-section" key={section}>
          <p className="rw-nav-caption">{section}</p>
          {REAL_WORKSPACE_ITEMS.filter((item) => item.group === section).map((item) => {
            const target = realWorkspaceHref(active.id, item.section)
            return <button type="button" className={'rw-nav-item' + (path === target ? ' rw-active' : '')}
              key={item.section} aria-current={path === target ? 'page' : undefined}
              aria-label={item.label} title={item.label}
              onClick={() => navigate(target)}><Icon name={item.icon} size={18}/><span className="rw-nav-text">{item.label}</span></button>
          })}
        </div>)}
        {businessId && state === 'error' && <p className="rw-nav-warning" role="alert">Could not verify your company. I opened "My companies" to update.</p>}
        {businessId && state === 'ready' && !active && <p className="rw-nav-warning" role="status">The company does not appear among your active memberships.</p>}
        {!businessId && <p className="rw-nav-helper">I chose a company to access their operations.</p>}
      </nav>
      <div className="rw-sidebar-footer">
        <span className="rw-mode">REAL · FastAPI / PostgreSQL</span>
      </div>
    </aside>
    <header className="rw-topbar">
      <div className="rw-topbar-left">
        <button ref={triggerRef} type="button" className="rw-trigger" aria-label="Open Menu" aria-controls="real-workspace-nav"
          aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><Icon name="menu" size={20}/></button>
        <button type="button" className="rw-toggle-desktop"
          aria-label={collapsed ? 'Expand Side Menu' : 'Collapse Side Menu'}
          aria-pressed={collapsed} title={collapsed ? 'Expand Side Menu' : 'Collapse Side Menu'}
          onClick={onToggleCollapse}><Icon name={collapsed ? 'panel' : 'panel-hide'} size={19}/></button>
        <div className="rw-title-block"><span className="rw-breadcrumb">REAL Space / {title}</span>
          <strong>{title}</strong></div>
      </div>
      <div className="rw-topbar-actions">
        <span className="rw-real-badge">REAL</span>
        <a className="rw-demo-link rw-demo-topbar" href="/inicio">Enter DEMO</a>
        <label className="rw-company-select-label">Company
          <select aria-label="Change of company REAL" value={active?.id ?? ''}
            disabled={state !== 'ready' || companies.length === 0}
            onChange={(event) => { if (event.target.value) navigate(realWorkspaceHref(event.target.value)) }}>
            <option value="">{displayBusiness}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        </label>
        {active && <span className="rw-role-note" title={active.membership.role}>{active.membership.role.replaceAll('_', ' ')} · {active.status}</span>}
        <button className="rw-profile-button" type="button" onClick={() => navigate('/real/perfil')}
          title={userName} aria-label="Open Profile"><Icon name="user" size={17}/></button>
        <button className="rw-signout" type="button" onClick={onLogout}>Salir</button>
      </div>
      {state === 'error' && <p className="rw-shell-error" role="alert">{error}</p>}
    </header>
  </>
}
