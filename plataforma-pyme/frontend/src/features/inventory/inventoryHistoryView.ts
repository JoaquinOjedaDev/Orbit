import { INVENTORY_EVENTS } from './realInventoryGateway.ts'
import type { InventoryEvent, InventoryMovement } from './realInventoryGateway.ts'

/**
 * Only filters ALREADY FETCHED rows. The inventory API does not offer event/date/text
 * filters. Never present local filtering as a server-wide inventory query.
 */
export type LoadedHistoryFilter = 'TODOS' | 'ENTRADAS' | 'SALIDAS' | InventoryEvent

export type MovementLabels = {
  itemName: (id: string) => string
  siteName: (id: string) => string
  itemSku?: (id: string) => string
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim()
}

export function filterLoadedHistory(
  records: readonly InventoryMovement[], kind: LoadedHistoryFilter,
  search: string, labels: MovementLabels,
): InventoryMovement[] {
  const term = normalize(search)
  return records.filter(row => {
    if (kind === 'ENTRADAS' && row.delta_milli <= 0) return false
    if (kind === 'SALIDAS' && row.delta_milli >= 0) return false
    if (kind !== 'ENTRADAS' && kind !== 'SALIDAS' && kind !== 'TODOS' && row.event_type !== kind) return false
    if (!term) return true
    return [
      labels.itemName(row.catalog_item_id),
      labels.itemSku?.(row.catalog_item_id) ?? '',
      labels.siteName(row.location_id),
      INVENTORY_EVENTS[row.event_type],
      row.id, row.actor_id, row.receipt_id ?? '', row.inventory_operation_id ?? '',
      row.sale_id ?? '', row.operation_kind ?? '',
    ].some(value => normalize(value).includes(term))
  })
}

export function loadedMovementCounts(records: readonly InventoryMovement[]): {
  entries: number; exits: number
} {
  let entries = 0
  let exits = 0
  for (const row of records) {
    if (row.delta_milli > 0) entries++
    if (row.delta_milli < 0) exits++
  }
  return {entries, exits}
}

export function loadedInventoryCountLabel(
  kind: 'balances' | 'movements', count: number, hasMore: boolean,
): string {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('Invalid count')
  const noun = kind === 'balances'
    ? count === 1 ? 'item/location balance loaded' : 'item/location balances loaded'
    : count === 1 ? 'movement loaded' : 'movements loaded'
  return `${count} ${noun} · ${hasMore ? 'More pages may be available' : 'Last page loaded'}.`
}

/** Summarize the movements loaded in this view. */
export function loadedHistorySummary(total:number, entries:number, exits:number):string {
  if (![total,entries,exits].every(n=>Number.isSafeInteger(n)&&n>=0)
    || entries+exits>total)throw new RangeError('Invalid movement count')
  const movementCount = total === 1 ? '1 movement' : `${total} movements`
  const entryCount = entries === 1 ? '1 entry' : `${entries} entries`
  const exitCount = exits === 1 ? '1 exit' : `${exits} exits`
  return `${movementCount} loaded: ${entryCount} and ${exitCount}.`
}

export function loadedMatchCountLabel(count:number):string {
  if (!Number.isSafeInteger(count)||count<0)throw new RangeError('Invalid count')
  return count === 1 ? 'Showing 1 local match.' : `Showing ${count} local matches.`
}

export type MovementActor = { user_id:string; display_name:string }
export type MovementViewer = { id:string; displayName:string }

/**
 * No resolver nombres de otra empresa ni suponer que el actor histórico
 * es quien está conectado. La lista de integrantes se debe proporcionar
 * únicamente después de comprobar permisos de equipo para el tenant activo.
 */
export function movementActorName(
  actorId:string,
  viewer:MovementViewer,
  actors:ReadonlyArray<MovementActor> = [],
):string {
  if(actorId===viewer.id)return viewer.displayName.trim()||'Your account'
  return actors.find(x=>x.user_id===actorId)?.display_name.trim()||'Name not available'
}

/** Traceable identifiers from the REAL ledger (not invoices or arbitrary client links). */
export function movementTraceFields(record: InventoryMovement): {label: string; value: string}[] {
  const fields = [
    {label: 'Movement ID', value: record.id},
    {label: 'Responsible (ID)', value: record.actor_id},
    {label: 'Location (ID)', value: record.location_id},
    {label: 'Article (ID)', value: record.catalog_item_id},
  ]
  const optional: [string, string | null | undefined][] = [
    ['Internal reception (ID)', record.receipt_id],
    ['Purchase line (ID)', record.purchase_line_id],
    ['Inventory operation (ID)', record.inventory_operation_id],
    ['Server operation type', record.operation_kind],
    ['Sale (ID)', record.sale_id],
    ['Sales line (ID)', record.sale_line_id],
  ]
  for (const [label,value] of optional) {
    if (value !== null && value !== undefined && value !== '') fields.push({label,value})
  }
  return fields
}
