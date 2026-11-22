/**
 * Reglas puras de Compras E1-B7.
 * Todos los importes en centavos ARS y todas las cantidades en milésimas
 * de la unidad del Catálogo. No hay conversión caja→unidad ni kg→gramo.
 */
import { catalogUnitLabels } from './catalogPolicy.ts'
import type { CatalogUnit } from './catalogPolicy.ts'

export type PurchaseUnit = CatalogUnit | 'CONCEPTO'
export type PurchaseLineInput = {
  catalogItemId: string | null
  description: string
  unit: PurchaseUnit
  quantityMilli: number
  unitCostCents: number
}
export type PurchaseInput = {
  purchasedOn: string
  supplierId: string | null
  reference: string
  notes: string
  lines: PurchaseLineInput[]
}
export type PurchaseLineSnapshot = PurchaseLineInput & {
  id: string
  kind: 'BIEN' | 'SERVICIO' | 'CONCEPTO'
  sku: string
  totalCents: number
}
export type PurchaseReceiptMovement = {
  id: string
  purchaseLineId: string
  catalogItemId: string
  unit: CatalogUnit
  quantityMilli: number
}
export type PurchaseReceipt = {
  id: string
  locationId: string
  createdAt: string
  movements: PurchaseReceiptMovement[]
}

const discreteUnits: ReadonlySet<PurchaseUnit> = new Set(['UNIDAD', 'PAQUETE', 'CAJA', 'SERVICIO', 'CONCEPTO'])
const MAX_CENTS = 99_999_999_999 // tope DEMO de importe por línea y compra

export function isDiscreteUnit(unit: PurchaseUnit): boolean {
  return discreteUnits.has(unit)
}

export function parseQuantityMilli(input: string, unit: PurchaseUnit): number {
  if (typeof input !== 'string' || !/^(?:0|[1-9]\d{0,5})(?:[.,]\d{1,3})?$/.test(input.trim())) {
    throw new Error('Invalid quantity: I wrote a positive number without separators of thousands and with up to three decimals.')
  }
  const [whole, fractional = ''] = input.trim().replace(',', '.').split('.')
  const value = Number(whole) * 1000 + Number(fractional.padEnd(3, '0'))
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('The amount must be greater than zero.')
  if (isDiscreteUnit(unit) && value % 1000 !== 0) throw new Error('This unit only supports whole quantities (without fractions).')
  return value
}

export function quantityText(quantityMilli: number, unit: PurchaseUnit): string {
  const quantity = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 }).format(quantityMilli / 1000)
  return quantity + ' ' + (unit === 'CONCEPTO' ? 'concepto(s)' : catalogUnitLabels[unit].toLowerCase())
}

/** Enteros mediante BigInt: redondeo HALF_UP al centavo de cada renglón. */
export function lineTotalCents(quantityMilli: number, unitCostCents: number): number {
  if (!Number.isSafeInteger(quantityMilli) || quantityMilli <= 0 || quantityMilli >= 1_000_000_000 ||
      !Number.isSafeInteger(unitCostCents) || unitCostCents < 0 || unitCostCents > MAX_CENTS) {
    throw new Error('Amount or cost of unit outside range.')
  }
  const cents = (BigInt(quantityMilli) * BigInt(unitCostCents) + 500n) / 1000n
  if (cents > BigInt(MAX_CENTS)) throw new Error('Line amount exceeds the DEMO limit.')
  return Number(cents)
}

export function sumLineTotals(lines: Pick<PurchaseLineSnapshot, 'totalCents'>[]): number {
  const total = lines.reduce((sum, line) => sum + BigInt(line.totalCents), 0n)
  if (total > BigInt(MAX_CENTS)) throw new Error('Total purchase out of range.')
  return Number(total)
}

function cleanText(value: unknown, label: string, max: number, min = 0): string {
  if (typeof value !== 'string') throw new Error(label + ': Invalid format.')
  const clean = value.trim().replace(/[\t ]+/g, ' ')
  if (clean.length < min || clean.length > max || [...clean].some((char) => { const code = char.charCodeAt(0); return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127 })) {
    throw new Error(label + ': length or invalid characters.')
  }
  return clean
}

export function validPurchaseDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    && Number(value.slice(0, 4)) >= 2000 && Number(value.slice(0, 4)) <= 2100
}

export function normalizePurchaseInput(input: PurchaseInput): PurchaseInput {
  if (!input || !validPurchaseDate(input.purchasedOn)) throw new Error('Select a valid date (year 2000–2100).')
  if (input.supplierId !== null &&
      (typeof input.supplierId !== 'string' || !/^demo-supplier-[a-f0-9-]{36}$/.test(input.supplierId))) {
    throw new Error('The selected provider is invalid.')
  }
  const reference = cleanText(input.reference, 'Check/reference', 70)
  const notes = cleanText(input.notes, 'Observaciones', 500)
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 30) {
    throw new Error('A purchase must have between 1 and 30 lines.')
  }
  const lines = input.lines.map((raw, i) => {
    if (!raw || typeof raw !== 'object') throw new Error('Line ' + (i + 1) + ' inválido.')
    const description = cleanText(raw.description, 'Concepto ' + (i + 1), 140, 2)
    const unit: PurchaseUnit = raw.unit
    if (unit !== 'CONCEPTO' && !Object.hasOwn(catalogUnitLabels, unit)) {
      throw new Error('Invalid unit in line ' + (i + 1) + '.')
    }
    if (raw.catalogItemId !== null &&
      (typeof raw.catalogItemId !== 'string' || !/^demo-catalog-[a-f0-9-]{36}$/.test(raw.catalogItemId))) {
      throw new Error('Invalid article in line ' + (i + 1) + '.')
    }
    if ((raw.catalogItemId === null) !== (unit === 'CONCEPTO')) {
      throw new Error('Free concepts cannot modify stock or use article units.')
    }
    if (!Number.isSafeInteger(raw.quantityMilli) || raw.quantityMilli < 1 ||
      raw.quantityMilli >= 1_000_000_000 || (isDiscreteUnit(unit) && raw.quantityMilli % 1000 !== 0)) {
      throw new Error('Invalid amount in line ' + (i + 1) + '.')
    }
    lineTotalCents(raw.quantityMilli, raw.unitCostCents)
    return {
      catalogItemId: raw.catalogItemId,
      description, unit, quantityMilli: raw.quantityMilli, unitCostCents: raw.unitCostCents,
    }
  })
  sumLineTotals(lines.map((line) => ({ totalCents: lineTotalCents(line.quantityMilli, line.unitCostCents) })))
  return { purchasedOn: input.purchasedOn, supplierId: input.supplierId, reference, notes, lines }
}

/** Determina exactamente qué renglones son recepcionables; no crea movimientos. */
export function physicalPurchaseLines(lines: PurchaseLineSnapshot[]): PurchaseLineSnapshot[] {
  return lines.filter((line) => line.kind === 'BIEN' && line.catalogItemId !== null && line.unit !== 'CONCEPTO' && line.unit !== 'SERVICIO')
}
