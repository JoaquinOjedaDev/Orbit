export type IconName = 'home' | 'building' | 'pin' | 'users' | 'package' | 'boxes' | 'truck' | 'shopping' | 'wallet' | 'book' | 'chart' | 'clock' | 'credit' | 'user' | 'plus' | 'menu' | 'chevron' | 'arrow' | 'shield' | 'close' | 'search' | 'receipt' | 'briefcase' | 'panel' | 'panel-hide' | 'arrow-left'

export type NavigationItem = {
  id: string
  label: string
  segment: string
  icon: IconName
  group: 'Main' | 'Operations' | 'Administration' | 'More tools'
  description: string
  phase: 'E1-A' | 'E1-B' | 'E1-C' | 'Posterior'
}

export const navigationItems: NavigationItem[] = [
  { id: 'inicio', label: 'Home', segment: 'inicio', icon: 'home', group: 'Main', description: 'Company overview and quick links.', phase: 'E1-A' },
  { id: 'empresa', label: 'Company details', segment: 'empresa', icon: 'building', group: 'Administration', description: 'Business information and settings.', phase: 'E1-B' },
  { id: 'ubicaciones', label: 'Locations', segment: 'ubicaciones', icon: 'pin', group: 'Administration', description: 'Branches and other operating locations.', phase: 'E1-B' },
  { id: 'equipo', label: 'Team', segment: 'equipo', icon: 'users', group: 'Administration', description: 'Collaborators, roles and invitations.', phase: 'E1-B' },
  { id: 'cuentas', label: 'Accounts and payment methods', segment: 'cuentas', icon: 'credit', group: 'Administration', description: 'Bank accounts and reference wallets by company (DEMO).', phase: 'E1-C' },
  { id: 'catalogo', label: 'Catalog', segment: 'catalogo', icon: 'package', group: 'Operations', description: 'Business goods and services.', phase: 'E1-B' },
  { id: 'inventario', label: 'Inventory', segment: 'inventario', icon: 'boxes', group: 'Operations', description: 'Stock by location and item.', phase: 'E1-B' },
  { id: 'movimientos', label: 'Stock movements', segment: 'movimientos', icon: 'truck', group: 'Operations', description: 'Track stock transfers and adjustments.', phase: 'E1-B' },
  { id: 'proveedores', label: 'Suppliers', segment: 'proveedores', icon: 'briefcase', group: 'Operations', description: 'Contacts and related purchases.', phase: 'E1-B' },
  { id: 'compras', label: 'Purchases', segment: 'compras', icon: 'shopping', group: 'Operations', description: 'Purchase orders, goods receipts, and records.', phase: 'E1-B' },
  { id: 'ventas', label: 'Sales', segment: 'ventas', icon: 'receipt', group: 'Operations', description: 'Sales, discounts, and payments.', phase: 'E1-C' },
  { id: 'gastos', label: 'Expenses', segment: 'gastos', icon: 'wallet', group: 'Operations', description: 'Operating expenses and funds.', phase: 'E1-C' },
  { id: 'jornadas', label: 'Cash sessions', segment: 'jornadas', icon: 'clock', group: 'Operations', description: 'Open, reconcile, and close a cash register.', phase: 'E1-C' },
  { id: 'historial', label: 'History', segment: 'historial', icon: 'clock', group: 'More tools', description: 'Previous activity and operations.', phase: 'E1-C' },
  { id: 'guias', label: 'Help guides', segment: 'guias', icon: 'book', group: 'More tools', description: 'Guides for common tasks.', phase: 'Posterior' },
  { id: 'pedidos', label: 'Orders and reservations', segment: 'pedidos', icon: 'shopping', group: 'More tools', description: 'Orders and reservations with follow-up.', phase: 'Posterior' },
  { id: 'analisis', label: 'Analytics', segment: 'analisis', icon: 'chart', group: 'More tools', description: 'Business indicators and reports.', phase: 'Posterior' },
]

export const navigationGroups: NavigationItem['group'][] = ['Main', 'Operations', 'Administration', 'More tools']

export function businessHref(businessId: string, segment: string) {
  return '/b/' + encodeURIComponent(businessId) + '/' + segment
}

export type { DemoBusiness } from '../data/demo/demoStore'
