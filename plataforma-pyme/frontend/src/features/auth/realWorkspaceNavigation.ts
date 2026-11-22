/** E3-1B. Navigation for API-backed screens ONLY; never import demoStore. */
import { UUID_PATTERN } from '../businesses/businessGateway.ts'

export type RealBusinessSection = '' | 'inicio' | 'ubicaciones' | 'equipo' | 'catalogo'
  | 'proveedores' | 'compras' | 'inventario' | 'pos' | 'ventas' | 'medios-de-cobro' | 'cobros-qr'

export type RealWorkspaceItem = {
  section: RealBusinessSection
  label: string
  group: 'Administration' | 'Operations'
  icon: 'home' | 'building' | 'pin' | 'users' | 'package' | 'briefcase'
    | 'shopping' | 'boxes' | 'receipt' | 'clock' | 'wallet'
}

export const REAL_WORKSPACE_ITEMS: readonly RealWorkspaceItem[] = [
  { section: 'inicio', label: 'Home', group: 'Administration', icon: 'home' },
  { section: '', label: 'My company', group: 'Administration', icon: 'building' },
  { section: 'ubicaciones', label: 'Locations', group: 'Administration', icon: 'pin' },
  { section: 'equipo', label: 'Team', group: 'Administration', icon: 'users' },
  { section: 'medios-de-cobro', label: 'Payment methods', group: 'Administration', icon: 'wallet' },
  { section: 'catalogo', label: 'Catalog', group: 'Operations', icon: 'package' },
  { section: 'proveedores', label: 'Suppliers', group: 'Operations', icon: 'briefcase' },
  { section: 'compras', label: 'Purchases and receipts', group: 'Operations', icon: 'shopping' },
  { section: 'inventario', label: 'Inventory and stock movements', group: 'Operations', icon: 'boxes' },
  { section: 'pos', label: 'Point of sale', group: 'Operations', icon: 'receipt' },
  { section: 'cobros-qr', label: 'QR payments', group: 'Operations', icon: 'wallet' },
  { section: 'ventas', label: 'Sales history', group: 'Operations', icon: 'clock' },
] as const

const VALID_SECTIONS = new Set<string>(REAL_WORKSPACE_ITEMS.map((item) => item.section))

/** Never compose arbitrary tenant routes or expose unimplemented DEMO modules. */
export function realWorkspaceHref(businessId: string, section: RealBusinessSection = ''): string {
  if (!UUID_PATTERN.test(businessId) || !VALID_SECTIONS.has(section)) {
    throw new TypeError('Real Company or Display Not Allowed')
  }
  const base = '/real/empresas/' + businessId
  return section ? base + '/' + section : base
}

/** Return a business only for the routes accepted by RealAuthApp. */
export function realWorkspaceBusinessId(path: string): string | null {
  const qrMatch = /^\/real\/empresas\/([^/]+)\/qr-cobros\/([^/]+)$/.exec(path)
  if (qrMatch && UUID_PATTERN.test(qrMatch[1]) && UUID_PATTERN.test(qrMatch[2]))
    return qrMatch[1]
  const match = /^\/real\/empresas\/([^/]+)(?:\/([a-z-]+))?$/.exec(path)
  if (!match || !UUID_PATTERN.test(match[1]) || !VALID_SECTIONS.has(match[2] ?? '')) return null
  return match[1]
}

export function realWorkspaceTitle(path: string): string {
  if (/^\/real\/empresas\/[^/]+\/qr-cobros\/[^/]+$/.test(path) && realWorkspaceBusinessId(path))
    return 'Demo QR payment'
  if (path === '/real/perfil') return 'My profile'
  if (path === '/real/invitaciones/aceptar') return 'Enter invitation code'
  if (path === '/real/empresas/nueva') return 'Create company'
  if (path === '/real/empresas') return 'My companies'
  const businessId = realWorkspaceBusinessId(path)
  if (businessId) {
    const section = path.slice(realWorkspaceHref(businessId).length).replace(/^\//, '')
    return REAL_WORKSPACE_ITEMS.find((item) => item.section === section)?.label ?? 'My company'
  }
  return 'My workspace'
}
