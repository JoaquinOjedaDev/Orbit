/**
 * T10-C: pure POS cart and quantity rules; NO POST and no payments.
 * The final price permission is enforced by FastAPI (T10-P01), not these UI hints.
 */
import type { CatalogItem, CatalogUnit } from '../catalog/realCatalogGateway.ts'
import type { LocationRecord } from '../businesses/realOperationsGateway.ts'
import type { SaleCommandLine, SaleTotals } from './realSaleCommand.ts'
import { calculateSaleTotals } from './realSaleCommand.ts'

export type PosCartLine = SaleCommandLine

/** Subtotal por artículo, usando HALF_UP en centavos sin errores de floats. */
export function posLineTotalCents(quantityMilli: number, unitPriceCents: number): number {
  if (!Number.isSafeInteger(quantityMilli) || quantityMilli < 1 || quantityMilli > 999_999_999 ||
      !Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0 || unitPriceCents > 99_999_999_999)
    throw new RangeError('Invalid unit quantity or price.')
  const cents = (BigInt(quantityMilli) * BigInt(unitPriceCents) + 500n) / 1000n
  if (cents > 99_999_999_999n) throw new RangeError('Subtotal of out-of-range product.')
  return Number(cents)
}
const DISCRETE = new Set<CatalogUnit>(['UNIDAD', 'PAQUETE', 'CAJA', 'SERVICIO'])
export const canOverrideSalesPrice = (role: string): boolean =>
  role === 'TITULAR_ADMINISTRATIVO' || role === 'ADMINISTRADOR'
export const canOperateSales = (role: string): boolean =>
  canOverrideSalesPrice(role) || role === 'TRABAJADOR' || role === 'ENCARGADO'

/** Decimal text in the article's own unit, maximum 3 fractional digits. */
export function parsePosQuantity(raw: string, unit: CatalogUnit): number {
  const text = raw.trim()
  if (!/^(?:0|[1-9]\d{0,5})(?:[.,]\d{1,3})?$/.test(text))
    throw new RangeError('Invalid quantity: without separators of thousands and up to three decimal places.')
  const [whole, fraction = ''] = text.replace(',', '.').split('.')
  if (DISCRETE.has(unit) && fraction && Number(fraction) !== 0)
    throw new RangeError('This article only admits whole quantities.')
  const milli = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'))
  if (!Number.isSafeInteger(milli) || milli < 1 || milli > 999_999_999)
    throw new RangeError('Amount outside the permitted range.')
  return milli
}
export function posQuantityText(milli: number): string {
  if (!Number.isSafeInteger(milli) || milli < 1 || milli > 999_999_999)
    throw new RangeError('Amount in thousands of invalids.')
  const main = Math.floor(milli / 1000)
  const rest = String(milli % 1000).padStart(3, '0').replace(/0+$/, '')
  return rest ? main + ',' + rest : String(main)
}

export function previewPosCart(
  role: string,
  businessActive: boolean,
  location: LocationRecord | null,
  catalog: readonly CatalogItem[],
  cart: readonly PosCartLine[],
  discountCents: number,
): { lines: PosCartLine[]; totals: SaleTotals } {
  if (!businessActive || !canOperateSales(role))
    throw new RangeError('There is no authorization to prepare sales at the company.')
  if (cart.length < 1 || cart.length > 30)
    throw new RangeError('The cart requires between 1 and 30 lines.')
  const manager = canOverrideSalesPrice(role)
  if (!location && !manager)
    throw new RangeError('Select the location where you have an assignment to sell.')
  if (location && (location.status !== 'ACTIVA' || !location.can_sell))
    throw new RangeError('The headquarters is not allowed to sell.')

  const byId = new Map(catalog.map(row => [row.id, row]))
  const seen = new Set<string>()
  const result = cart.map(line => {
    const item = byId.get(line.catalog_item_id)
    if (!item || item.status !== 'ACTIVO' || !item.sellable)
      throw new RangeError('There are items without commercial availability in this cart.')
    if (seen.has(item.id)) throw new RangeError('Do not duplicate lines of the same article.')
    seen.add(item.id)
    if (DISCRETE.has(item.unit) && line.quantity_milli % 1000 !== 0)
      throw new RangeError('This article requires whole units.')
    if (item.item_type === 'BIEN' && (!location || !location.can_store))
      throw new RangeError('Physical goods require an active location that manages stock.')
    if (!manager) {
      if (item.price_cents === null)
        throw new RangeError('Ask an owner or administrator to set the missing item price.')
      if (line.unit_price_cents !== item.price_cents)
        throw new RangeError('Your role can only sell at the catalog price.')
    }
    return { ...line }
  })
  if (!manager && discountCents !== 0)
    throw new RangeError('Your role cannot apply discounts.')
  return { lines: result, totals: calculateSaleTotals(result, discountCents) }
}

/**
 * Acción rápida POS: incorpora una unidad del catálogo al carrito sin
 * reemplazar sus otros renglones. Los ajustes fraccionarios y excepciones
 * de precio se editan desde el detalle, no desde la tarjeta.
 */
export function addOnePosCartUnit(
  cart: readonly PosCartLine[],
  item: CatalogItem,
  stockAvailableMilli: number | null,
):PosCartLine[] {
  if(item.status!=='ACTIVO'||!item.sellable)
    throw new RangeError('The item is not allowed to sell.')
  const index=cart.findIndex(line=>line.catalog_item_id===item.id)
  if(index<0&&cart.length>=30)throw new RangeError('Maximum 30 different items per sale.')
  if(item.item_type==='BIEN'&&stockAvailableMilli===null)
    throw new RangeError('Check stock at this location before adding the item.')
  const previous=index<0?null:cart[index]
  const unitPrice=previous?.unit_price_cents??item.price_cents
  if(unitPrice===null)
    throw new RangeError('The item has no price. Ask an administrator to set one.')
  const quantity=(previous?.quantity_milli??0)+1000
  if(quantity>999_999_999)
    throw new RangeError('The maximum quantity per item was reached.')
  if(item.item_type==='BIEN'&&quantity>stockAvailableMilli!)
    throw new RangeError('There is not enough stock at this location to add another unit.')
  posLineTotalCents(quantity,unitPrice)
  const line={catalog_item_id:item.id,quantity_milli:quantity,unit_price_cents:unitPrice}
  return index<0?[...cart,line]:cart.map((row,i)=>i===index?line:row)
}
