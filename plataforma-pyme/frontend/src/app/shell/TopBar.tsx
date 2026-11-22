import { useEffect, useRef } from 'react'
import { profileInitials } from '../../data/demo/demoStore'
import { DemoPhoto } from '../../features/common/DemoPhoto'
import { demoImageKey } from '../../data/demo/imagePolicy'
import { AppLink } from '../AppLink'
import { Icon } from '../Icon'
import { businessHref } from '../navigation'
import type { DemoBusiness, DemoProfile } from '../../data/demo/demoStore'
import type { Navigate } from '../types'
import type { SidebarMode } from './sidebarPreference'

export function Topbar({
  business,
  businesses,
  profile,
  title,
  navigate,
  sidebarMode,
  menuOpen,
  showBack,
  onBack,
  onToggleSidebar,
  onHideSidebar,
  onToggleMenu,
}: {
  business: DemoBusiness | undefined
  businesses: DemoBusiness[]
  profile: DemoProfile
  title: string
  navigate: Navigate
  sidebarMode: SidebarMode
  menuOpen: boolean
  showBack: boolean
  onBack: () => void
  onToggleSidebar: () => void
  onHideSidebar: () => void
  onToggleMenu: () => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(menuOpen)

  // Al cerrar el diálogo, el foco vuelve al botón que lo abrió.
  useEffect(() => {
    if (wasOpen.current && !menuOpen) triggerRef.current?.focus()
    wasOpen.current = menuOpen
  }, [menuOpen])

  const pinAction = sidebarMode === 'expanded'
    ? 'Collapse fixed menu to icons'
    : sidebarMode === 'compact'
      ? 'Expand Fixed Menu'
      : 'Set Side Menu'

  return <header className="topbar">
    <div className="topbar-left">
      <div className="sidebar-actions">
        <button
          ref={triggerRef}
          type="button"
          className="icon-button menu-drawer-trigger"
          aria-label={menuOpen ? 'Close Main Menu' : 'Open Main Menu'}
          title={menuOpen ? 'Close Menu' : 'Open Main Menu'}
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          aria-controls="app-sidebar"
          onClick={onToggleMenu}
        >
          <Icon name="menu" size={23} />
        </button>
        <button
          type="button"
          className="icon-button desktop-menu-trigger"
          aria-label={pinAction}
          title={pinAction}
          aria-controls="app-sidebar"
          onClick={onToggleSidebar}
        >
          <Icon name="panel" size={20} />
        </button>
        {sidebarMode !== 'hidden' && (
          <button
            type="button"
            className="icon-button desktop-hide-trigger"
            aria-label="Hide Fixed Menu"
            title="Hide Fixed Menu"
            aria-controls="app-sidebar"
            onClick={onHideSidebar}
          >
            <Icon name="panel-hide" size={19} />
          </button>
        )}
      </div>
      {showBack && <button type="button" className="back-button" aria-label="Back to previous section" title="Back" onClick={onBack}><Icon name="arrow-left" size={19}/><span>Back</span></button>}
      <div className="breadcrumbs">
        <span>{business ? 'Mi negocio' : 'My space'}</span>
        <Icon name="chevron" size={14} />
        <strong>{title}</strong>
      </div>
    </div>
    <div className="topbar-right">
      <label className="company-picker">
        <span className="sr-only">Active company</span>
        <Icon name="building" size={16} />
        <select aria-label="Switch companies" value={business?.id ?? ''} onChange={(event) => navigate(event.target.value ? businessHref(event.target.value, 'inicio') : '/inicio')}>
          <option value="">My personal space</option>
          {businesses.map((item) => <option key={item.id} value={item.id}>{item.name} · DEMO</option>)}
        </select>
      </label>
      <span className="demo-chip">DEMO</span>
      <AppLink navigate={navigate} to="/perfil" className="user-avatar" ariaLabel="Go to my profile">
        <DemoPhoto imageKey={demoImageKey('profile')} alt="Profile Photo" fallback={profileInitials(profile)} className="demo-photo-avatar"/>
      </AppLink>
    </div>
  </header>
}
