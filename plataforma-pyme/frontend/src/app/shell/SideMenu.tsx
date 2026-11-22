import { useEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { AppLink } from '../AppLink'
import { Icon } from '../Icon'
import { businessHref, navigationGroups, navigationItems } from '../navigation'
import type { DemoBusiness } from '../navigation'
import type { Navigate } from '../types'
import type { SidebarMode } from './sidebarPreference'

export function Sidebar({
  business,
  pathname,
  navigate,
  mode,
  isOpen,
  onClose,
}: {
  business: DemoBusiness | undefined
  pathname: string
  navigate: Navigate
  mode: SidebarMode
  isOpen: boolean
  onClose: () => void
}) {
  const compact = mode === 'compact' && !isOpen
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus()
  }, [isOpen])

  // El drawer modal nunca debe dejar que Tab llegue al contenido bloqueado.
  function handleDrawerKeys(event: ReactKeyboardEvent<HTMLElement>) {
    if (!isOpen || event.key !== 'Tab') return
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => element.getClientRects().length > 0)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      {isOpen && <button type="button" tabIndex={-1} className="mobile-scrim" aria-label="Close menu when playing outside" onClick={onClose} />}
      <aside id="app-sidebar" className={'sidebar' + (isOpen ? ' sidebar-open' : '')} role={isOpen ? 'dialog' : undefined} aria-modal={isOpen ? true : undefined} aria-label={isOpen ? 'Main menu' : 'Main navigation'} onKeyDown={handleDrawerKeys}>
        <div className="sidebar-head">
          <AppLink navigate={navigate} to="/inicio" className="brand" ariaLabel="Go to Personal Start" title={compact ? 'Orbit · Personal Home' : undefined}>
            <span className="brand-logo"><Icon name="building" size={25} /></span>
            <span className="brand-copy"><strong>Orbit</strong><small>Business management</small></span>
          </AppLink>
          <button type="button" ref={closeButtonRef} className="icon-button sidebar-close" aria-label="Close Menu" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="drawer-context" aria-hidden={!isOpen}>
          <span>MAIN MENU</span>
          <strong>{business?.name ?? 'My personal space'}</strong>
        </div>

        <div className="sidebar-scroll">
          {!business ? (
            <nav className="sidebar-group" aria-label="Personal navigation">
              <p className="group-label">PERSONAL WORKSPACE</p>
              <AppLink to="/inicio" navigate={navigate} ariaLabel="Home" ariaCurrent={pathname === '/inicio' || pathname === '/' ? 'page' : undefined} title={compact ? 'Home' : undefined} className={'side-link' + (pathname === '/inicio' || pathname === '/' ? ' active' : '')}>
                <Icon name="home" /><span className="side-label">Home</span>
              </AppLink>
              <AppLink to="/perfil" navigate={navigate} ariaLabel="My profile" ariaCurrent={pathname === '/perfil' ? 'page' : undefined} title={compact ? 'My profile' : undefined} className={'side-link' + (pathname === '/perfil' ? ' active' : '')}>
                <Icon name="user" /><span className="side-label">My profile</span>
              </AppLink>
              <AppLink to="/empresas/nueva" navigate={navigate} ariaLabel="Create company" ariaCurrent={pathname === '/empresas/nueva' ? 'page' : undefined} title={compact ? 'Create company' : undefined} className={'side-link' + (pathname === '/empresas/nueva' ? ' active' : '')}>
                <Icon name="plus" /><span className="side-label">Create company</span>
              </AppLink>
            </nav>
          ) : (
            <nav aria-label="Business sections">
              {navigationGroups.map((group) => (
                <div key={group} className="sidebar-group">
                  <p className="group-label">{group.toUpperCase()}</p>
                  {navigationItems.filter((item) => item.group === group).map((item) => {
                    const href = businessHref(business.id, item.segment)
                    const active = pathname === href
                    return (
                      <AppLink key={item.id} navigate={navigate} to={href} ariaLabel={item.label} ariaCurrent={active ? 'page' : undefined} title={compact ? item.label : undefined} className={'side-link' + (active ? ' active' : '')}>
                        <Icon name={item.icon} size={19} /><span className="side-label">{item.label}</span>
                        {item.phase === 'Posterior' && <span className="side-dot" title="Coming soon" />}
                      </AppLink>
                    )
                  })}
                </div>
              ))}
            </nav>
          )}
        </div>
        <div className="sidebar-foot">
          <div className="sidebar-foot-card" title={compact ? 'Demonstration environment. No actual operations or payments.' : undefined}>
            <div className="sidebar-foot-icon"><Icon name="shield" size={17}/></div>
            <div className="sidebar-foot-copy"><strong>Demonstration environment</strong><span>No real operations, no payments.</span></div>
          </div>
          <span className="sidebar-version">Orbit Demo</span>
        </div>
      </aside>
    </>
  )
}
