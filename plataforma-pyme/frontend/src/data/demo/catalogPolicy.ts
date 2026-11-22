/**
 * Reglas puras de Catálogo DEMO.
 * No realiza operaciones de inventario, compras, venta ni autorizaciones reales.
 */
export const catalogKindLabels = {
  ELABORADO: 'Own elaboration',
  REVENTA: 'Re-invented product',
  INSUMO: 'Insumo / material',
  SERVICIO: 'Service',
} as const
export type CatalogKind = keyof typeof catalogKindLabels

export const catalogUnitLabels = {
  UNIDAD: 'Unit',
  GRAMO: 'Gramo',
  KILOGRAMO: 'Kilogramo',
  MILILITRO: 'Mililitro',
  LITRO: 'Litro',
  PAQUETE: 'Paquete',
  CAJA: 'Cash register',
  SERVICIO: 'Service',
} as const
export type CatalogUnit = keyof typeof catalogUnitLabels

export type CatalogInput = {
  name: string
  kind: CatalogKind
  category: string
  sku: string
  unit: CatalogUnit
  description: string
  observations: string
  sellable: boolean
  priceCents: number | null
  referenceCostCents: number | null
}

export function catalogNameKey(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR')
}

function cleanText(value: string, label: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new Error(label + ': invalid value.')
  const result = value.trim().replace(/\s+/g, ' ')
  if (result.length < min || result.length > max) {
    throw new Error(label + ' must have between ' + min + ' y ' + max + ' caracteres.')
  }
  return result
}

/** ARS en centavos enteros, sin puntos de miles ni IEEE floats para acumulación. */
export function parseMoneyCents(input: string): number | null {
  const text = input.trim()
  if (!text) return null // precio a cotizar / costo no informado
  if (!/^(?:0|[1-9]\d{0,8})(?:[.,]\d{1,2})?$/.test(text)) {
    throw new Error('Enter a valid amount, for example 1250.50. No separators of thousands.')
  }
  const [whole, fraction = ''] = text.replace(',', '.').split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents)) throw new Error('Out of range amount.')
  return cents
}

export function moneyInput(cents: number | null): string {
  if (cents === null) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function moneyDisplay(cents: number | null): string {
  if (cents === null) return 'A cotizar'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(cents / 100)
}

export function normalizeCatalogInput(input: CatalogInput): CatalogInput {
  if (!Object.hasOwn(catalogKindLabels, input.kind)) throw new Error('Select a valid item type.')
  if (!Object.hasOwn(catalogUnitLabels, input.unit)) throw new Error('Select a valid control unit.')
  const name = cleanText(input.name, 'The name', 2, 90)
  const category = cleanText(input.category || 'General', 'Category', 2, 60)
  const description = cleanText(input.description, 'The description', 0, 450)
  // Compatibilidad con fichas anteriores a E1-B5.1, que no tenían observaciones.
  const observations = cleanText(input.observations ?? '', 'Internal observations', 0, 600)
  const sku = input.sku.trim().toUpperCase()
  if (sku.length > 32 || (sku && !/^[A-Z0-9._-]+$/.test(sku))) {
    throw new Error('The SKU supports up to 32 characters: letters, numbers, point, script or bass script.')
  }
  if (input.kind === 'SERVICIO' && input.unit !== 'SERVICIO') {
    throw new Error('Services use the Service unit and do not generate physical stock.')
  }
  if (input.kind !== 'SERVICIO' && input.unit === 'SERVICIO') {
    throw new Error('The Service unit is exclusive to service-type items.')
  }
  if (typeof input.sellable !== 'boolean') throw new Error('Please indicate explicitly whether it is offered for sale.')
  for (const [label, cents] of [['precio', input.priceCents], ['costo', input.referenceCostCents]] as const) {
    if (cents !== null && (!Number.isSafeInteger(cents) || cents < 0 || cents > 99999999999)) {
      throw new Error('El ' + label + ' must be expressed in whole non-negative cents.')
    }
  }
  return {
    name, kind: input.kind, category, sku, unit: input.unit, description, observations,
    sellable: input.sellable, priceCents: input.priceCents, referenceCostCents: input.referenceCostCents,
  }
}

export const catalogKinds: CatalogKind[] = ['ELABORADO', 'REVENTA', 'INSUMO', 'SERVICIO']
export const catalogUnits: CatalogUnit[] = ['UNIDAD', 'GRAMO', 'KILOGRAMO', 'MILILITRO', 'LITRO', 'PAQUETE', 'CAJA', 'SERVICIO']
