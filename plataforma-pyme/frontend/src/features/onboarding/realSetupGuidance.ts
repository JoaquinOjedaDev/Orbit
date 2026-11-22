import type { RealBusinessSection } from '../auth/realWorkspaceNavigation.ts'

/** H3: solely UI explanations. A suggestion never means authorization to write. */
export type RealSetupSuggestion = {
  id: 'locations-empty' | 'locations-paused' | 'team-solo' | 'catalog-empty'
    | 'inventory-locations' | 'inventory-catalog' | 'inventory-services' | 'inventory-no-balances'
  title: string
  detail: string
  route: RealBusinessSection
  actionLabel: string
}

export function locationSetupSuggestion(input: {
  verified: boolean; count: number; activeCount: number; canManage: boolean
}): RealSetupSuggestion | null {
  if (!input.verified) return null
  if (input.count === 0) return {
    id: 'locations-empty',
    title: 'First, I defined where your company works.',
    detail: input.canManage
      ? 'The venue can be a venue, fair, office or deposit. Use "Create real location" and choose whether to support sales, storage or both.'
      : 'There are no registered locations in the consultation. An authorized person must create them; your role does not enable that operation.',
    route: 'inicio', actionLabel: 'Back to first steps',
  }
  if (input.activeCount === 0) return {
    id: 'locations-paused',
    title: 'The locations consulted are paused',
    detail: input.canManage
      ? 'To prepare the first headquarters, check which one is reactivated from the list. Reactivating is an explicit operation.'
      : 'Activation depends on someone with permission to manage locations.',
    route: 'inicio', actionLabel: 'Back to first steps',
  }
  return null
}

export function teamSetupSuggestion(input: {
  verified: boolean; canRead: boolean; onlySelf: boolean; canInvite: boolean
}): RealSetupSuggestion | null {
  if (!input.verified || !input.canRead || !input.onlySelf) return null
  return {
    id: 'team-solo',
    title: 'You can start working on your own.',
    detail: input.canInvite
      ? 'Invite contributors is optional. When you need them, I issued a code from the form on this page; each person will use their own account.'
      : 'Incorporating collaborators is optional. To issue invitations you need a person with administrative permissions to manage them.',
    route: 'inicio', actionLabel: 'Review first steps',
  }
}

export function catalogSetupSuggestion(input: {
  verified: boolean; count: number; canWrite: boolean
}): RealSetupSuggestion | null {
  if (!input.verified || input.count !== 0) return null
  return {
    id: 'catalog-empty',
    title: 'Register what you offer',
    detail: input.canWrite
      ? 'Use "Create REAL article" to load a product, input or service. Services do not need stock; physical goods are then controlled from Inventory.'
      : 'There are still no files in the catalogue consulted. You can see them, but an authorized person must create them.',
    route: 'inicio', actionLabel: 'Review first steps',
  }
}

export function inventorySetupSuggestion(input: {
  verified: boolean
  locationsCount: number
  catalogCount: number
  catalogComplete: boolean
  physicalCount: number
  balancesLoaded: boolean
  balancesCount: number
  unfiltered: boolean
}): RealSetupSuggestion | null {
  if (!input.verified) return null
  if (input.locationsCount === 0) return {
    id: 'inventory-locations',
    title: 'First you need a location.',
    detail: 'Physical stocks are controlled by headquarters. Check Locations and enable storage where applicable.',
    route: 'ubicaciones', actionLabel: 'Go to Locations',
  }
  if (input.catalogComplete && input.catalogCount === 0) return {
    id: 'inventory-catalog',
    title: 'First load physical items in the catalog',
    detail: 'Inventory records physical goods, does not create product files. You can start from Catalogue.',
    route: 'catalogo', actionLabel: 'Go to Catalogue',
  }
  if (input.catalogComplete && input.catalogCount > 0 && input.physicalCount === 0) return {
    id: 'inventory-services',
    title: 'Services do not require physical inventory',
    detail: 'The catalogue consulted contains only services. Do not load stock initial for them. You can manage them from Catalogue.',
    route: 'catalogo', actionLabel: 'Check Catalogue',
  }
  if (input.balancesLoaded && input.unfiltered && input.balancesCount === 0
    && input.catalogComplete && input.physicalCount > 0) return {
    id: 'inventory-no-balances',
    title: 'No balances in the general query yet',
    detail: 'If you need physical property stock, check the enabled locations and use "Start Stock and Settings" only with verified permissions and data. Stock is not automatically created.',
    route: 'inicio', actionLabel: 'Review first steps',
  }
  return null
}
