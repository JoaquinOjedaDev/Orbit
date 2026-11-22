/**
 * E1-C1: Ventas DEMO. Importe en centavos ARS, cantidad en milésimas
 * de la unidad del Catálogo. Pago DECLARADO no significa cobro verificado.
 */
import type { CatalogUnit } from './catalogPolicy.ts'
import type { InventoryMovement } from './inventoryPolicy.ts'
import { isDiscreteUnit, lineTotalCents } from './purchasePolicy.ts'

export type SalePaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'CUENTA_DNI' | 'TARJETA' | 'MERCADO_PAGO_DECLARADO'

export const salePaymentLabels: Record<SalePaymentMethod, string> = {
  EFECTIVO: 'Cash', TRANSFERENCIA: 'Transferencia', CUENTA_DNI: 'ID account',
  TARJETA: 'Tarjeta (declarado)', MERCADO_PAGO_DECLARADO: 'Mercado Pago (declared, unverified)',
}

export type SaleLineInput = {
  catalogItemId: string
  quantityMilli: number
  unitPriceCents: number
}

export type SalePayment = { method: SalePaymentMethod; amountCents: number; financialAccountId?: string | null; financialAccountLabelSnapshot?: string | null }

export type SaleInput = {
  locationId: string | null
  lines: SaleLineInput[]
  discountCents: number
  payments: SalePayment[]
  notes: string
}

export type SaleLineSnapshot = SaleLineInput & {
  id: string; name: string; sku: string; unit: CatalogUnit
  kind: 'BIEN' | 'SERVICIO'; lineTotalCents: number
}

/**
 * Una venta produce una salida por renglón físico. No hay stock mutable
 * paralelo ni una segunda operación que pueda descontar las mismas unidades.
 */
export function saleInventoryMovements(sale: {
  id: string; businessId: string; locationId: string | null
  createdAt: string; lines: SaleLineSnapshot[]
}): InventoryMovement[] {
  if (sale.locationId === null) return []
  return sale.lines.filter((line) => line.kind === 'BIEN').map((line) => ({
    id: 'demo-sale-stock-' + line.id, operationId: sale.id,
    businessId: sale.businessId, catalogItemId: line.catalogItemId,
    itemNameSnapshot: line.name, unit: line.unit, locationId: sale.locationId!,
    deltaMilli: -line.quantityMilli, type: 'VENTA_SALIDA' as const,
    createdAt: sale.createdAt, reason: 'DEMO registered sale', reference: sale.id,
  }))
}

const MAX_SALE_CENTS = 99_999_999_999

export function validSaleQuantity(value: number, unit: CatalogUnit): void {
  if (!Number.isSafeInteger(value) || value <= 0 || value >= 1_000_000_000 ||
      (isDiscreteUnit(unit) && value % 1000 !== 0)) {
    throw new Error('Invalid quantity for the selected unit.')
  }
}

export function saleAmounts(lines: { quantityMilli: number; unitPriceCents: number }[], discountCents: number) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 30) {
    throw new Error('Add between 1 and 30 lines for sale.')
  }
  let subtotal = 0n
  for (const line of lines) {
    if (!line || !Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
      throw new Error('Enter a valid unit price for each item.')
    }
    subtotal += BigInt(lineTotalCents(line.quantityMilli, line.unitPriceCents))
    if (subtotal > BigInt(MAX_SALE_CENTS)) throw new Error('The total exceeds the DEMO limit.')
  }
  if (subtotal === 0n) throw new Error('The sale must have a total of more than zero.')
  if (!Number.isSafeInteger(discountCents) || discountCents < 0 ||
      BigInt(discountCents) >= subtotal) {
    throw new Error('The discount should be lower than the subtotal of the sale.')
  }
  const total = subtotal - BigInt(discountCents)
  if (total <= 0n) throw new Error('The sale must have a total of more than zero.')
  return { subtotalCents: Number(subtotal), discountCents, totalCents: Number(total) }
}

export function validateSalePayments(payments: SalePayment[], totalCents: number): void {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || totalCents > MAX_SALE_CENTS) {
    throw new Error('Total invalid sale.')
  }
  if (!Array.isArray(payments) || payments.length < 1 || payments.length > 6) {
    throw new Error('Indicate between 1 and 6 means of payment.')
  }
  let paid = 0n
  for (const payment of payments) {
    if (!payment || !Object.hasOwn(salePaymentLabels, payment.method) ||
        !Number.isSafeInteger(payment.amountCents) || payment.amountCents <= 0 ||
        payment.amountCents > MAX_SALE_CENTS) {
      throw new Error('Means of payment or amount declared invalid.')
    }
    paid += BigInt(payment.amountCents)
  }
  if (paid !== BigInt(totalCents)) {
    throw new Error('The payments declared must add up to exactly the total of the sale.')
  }
}

export function normalizeSaleInput(input: SaleInput): SaleInput {
  if (!input || (input.locationId !== null &&
      (typeof input.locationId !== 'string' || !/^demo-location-[a-f0-9-]{36}$/.test(input.locationId)))) {
    throw new Error('Invalid sales location.')
  }
  if (!Array.isArray(input.lines) || !input.lines.length || input.lines.length > 30) {
    throw new Error('A sale requires between 1 and 30 items.')
  }
  const lines = input.lines.map((line) => {
    if (!line || typeof line.catalogItemId !== 'string' ||
        !/^demo-catalog-[a-f0-9-]{36}$/.test(line.catalogItemId) ||
        !Number.isSafeInteger(line.quantityMilli) ||
        line.quantityMilli <= 0 || line.quantityMilli >= 1_000_000_000) {
      throw new Error('Invalid item or quantity in the cart.')
    }
    lineTotalCents(line.quantityMilli, line.unitPriceCents)
    return { catalogItemId: line.catalogItemId, quantityMilli: line.quantityMilli,
      unitPriceCents: line.unitPriceCents }
  })
  const totals = saleAmounts(lines, input.discountCents)
  validateSalePayments(input.payments, totals.totalCents)
  if (typeof input.notes !== 'string' || input.notes.trim().length > 500 ||
      [...input.notes].some((char) => {
        const code = char.charCodeAt(0)
        return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127
      })) throw new Error('Observations support up to 500 characters without controls.')
  return { locationId: input.locationId, lines, discountCents: totals.discountCents,
    payments: input.payments.map(({ method, amountCents, financialAccountId }) => {
      const accountId = financialAccountId ?? null
      if (accountId !== null && (typeof accountId !== 'string' ||
          !/^demo-financial-account-[a-f0-9-]{36}$/.test(accountId))) {
        throw new Error('Select a valid DEMO account or leave it unassociated.')
      }
      return { method, amountCents, financialAccountId: accountId }
    }),
    notes: input.notes.trim() }
}

/** El último medio recibe el saldo pendiente sin sobrescribir los importes anteriores. */
export function remainingLastSalePaymentCents(totalCents: number, amounts: (number | null)[]): number {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || !Array.isArray(amounts) ||
      amounts.length < 1 || amounts.length > 6) throw new Error('Total or invalid payments.')
  let previous = 0n
  for (const cents of amounts.slice(0, -1)) {
    if (!Number.isSafeInteger(cents) || cents === null || cents <= 0) {
      throw new Error('Enter amounts for the previous payment methods first.')
    }
    previous += BigInt(cents)
  }
  const remaining = BigInt(totalCents) - previous
  if (remaining <= 0n) throw new Error('The previous payments already cover or exceed the total.')
  return Number(remaining)
}
