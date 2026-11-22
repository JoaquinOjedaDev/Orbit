/**
 * Reglas puras de proveedores DEMO. Sin compras, usuarios ni pagos reales.
 * Nunca convertir condiciones comerciales informativas en descuentos aplicados.
 */
import { validateGoogleMapsLink } from './mapsLinks.ts'

export const supplierPaymentLabels = {
  EFECTIVO: 'Cash',
  TRANSFERENCIA: 'Transferencia',
  MERCADO_PAGO: 'Mercado Pago',
  CUENTA_DNI: 'ID account',
  TARJETA: 'Tarjeta',
  CHEQUE: 'Cheque',
  CUENTA_CORRIENTE: 'Current account',
} as const
export type SupplierPayment = keyof typeof supplierPaymentLabels
export const supplierPayments = Object.keys(supplierPaymentLabels) as SupplierPayment[]
export const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const

export type SupplierPromotion = {
  id: string
  days: number[] // 0 = lunes, 6 = domingo; [] = todos/no especificado
  paymentMethod: SupplierPayment | ''
  benefit: string
}
export type SupplierInput = {
  name: string
  offerings: string
  contactPerson: string
  phone: string
  whatsapp: string
  email: string
  address: string
  mapsUrl: string
  website: string
  instagram: string
  paymentMethods: SupplierPayment[]
  promotions: SupplierPromotion[]
  notes: string
}

export const blankSupplier: SupplierInput = {
  name: '', offerings: '', contactPerson: '', phone: '', whatsapp: '', email: '',
  address: '', mapsUrl: '', website: '', instagram: '', paymentMethods: [],
  promotions: [], notes: '',
}

function textValue(value: unknown, field: string, max: number, min = 0): string {
  if (typeof value !== 'string') throw new Error(field + ': Invalid format.')
  const text = value.trim().replace(/[\t ]+/g, ' ')
  if (text.length < min || text.length > max) throw new Error(field + ': must have between ' + min + ' y ' + max + ' caracteres.')
  if ([...text].some((char) => { const code = char.charCodeAt(0); return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127 })) {
    throw new Error(field + ': contains invalid characters.')
  }
  return text
}

export function supplierNameKey(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR')
}

export function validateSupplierWebsite(value: string): string {
  const text = textValue(value, 'Sitio web', 2048)
  if (!text) return ''
  let url: URL
  try { url = new URL(text) } catch { throw new Error('Ingresá una URL de sitio web completa con https://') }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname.includes('.')) {
    throw new Error('Only HTTPS links are supported without user, password or port.')
  }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host === '127.0.0.1' || host === '0.0.0.0' || host === '[::1]') {
    throw new Error('Local addresses as a website are not allowed.')
  }
  return url.href
}

/** El número puede quedar vacío. Para WhatsApp se requiere E.164 (+país...). */
export function whatsappUrl(phone: string): string | null {
  const text = phone.trim()
  if (!text) return null
  if (!/^\+[1-9](?:[\d\s().-]){6,22}$/.test(text)) return null
  const digits = text.replace(/[^\d]/g, '')
  if (digits.length < 8 || digits.length > 15) return null
  return 'https://wa.me/' + digits
}

export function phoneUrl(phone: string): string | null {
  if (!phone || !/^\+?[\d\s().-]{6,35}$/.test(phone.trim())) return null
  const cleaned = phone.replace(/[^\d+]/g, '')
  return /^\+?\d{6,15}$/.test(cleaned) ? 'tel:' + cleaned : null
}

export function emailUrl(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'mailto:' + encodeURIComponent(email).replace('%40', '@') : null
}

export function instagramUrl(handle: string): string | null {
  const value = handle.trim().replace(/^@/, '')
  return /^[A-Za-z0-9._]{1,30}$/.test(value) ? 'https://www.instagram.com/' + value + '/' : null
}

export function normalizeSupplierInput(input: SupplierInput): SupplierInput {
  const name = textValue(input.name, 'Supplier name', 90, 2)
  const offerings = textValue(input.offerings, 'Products or services offered', 240)
  const contactPerson = textValue(input.contactPerson, 'Contact person', 100)
  const phone = textValue(input.phone, 'Phone', 35)
  const whatsapp = textValue(input.whatsapp, 'WhatsApp', 35)
  if (phone && !/^\+?[\d\s().-]{6,35}$/.test(phone)) throw new Error('The phone only supports numbers and telephone signs.')
  if (whatsapp && !whatsappUrl(whatsapp)) throw new Error('WhatsApp requires international format, for example +5491112345678.')
  const email = textValue(input.email, 'Email', 120).toLowerCase()
  if (email && !emailUrl(email)) throw new Error('Enter a valid email.')
  const address = textValue(input.address, 'Address or reference', 160)
  const mapsUrl = validateGoogleMapsLink(input.mapsUrl)
  const website = validateSupplierWebsite(input.website)
  const instagram = textValue(input.instagram, 'Instagram', 31)
  if (instagram && !instagramUrl(instagram)) throw new Error('Instagram debe ser un usuario válido, por ejemplo @empresa.')
  const notes = textValue(input.notes, 'Trade observations', 650)
  if (!Array.isArray(input.paymentMethods) || input.paymentMethods.length > supplierPayments.length ||
      input.paymentMethods.some((m) => !Object.hasOwn(supplierPaymentLabels, m)) ||
      new Set(input.paymentMethods).size !== input.paymentMethods.length) {
    throw new Error('Invalid or duplicate payment means.')
  }
  if (!Array.isArray(input.promotions) || input.promotions.length > 8) {
    throw new Error('Up to eight commercial information conditions are allowed.')
  }
  const usedIds = new Set<string>()
  const promotions = input.promotions.map((raw) => {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' ||
        !/^demo-promo-[a-f0-9-]{36}$/.test(raw.id) || usedIds.has(raw.id)) {
      throw new Error('Invalid or duplicate promotion identifier.')
    }
    usedIds.add(raw.id)
    if (!Array.isArray(raw.days) || raw.days.length > 7 ||
        raw.days.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
        new Set(raw.days).size !== raw.days.length) throw new Error('Invalid promotion days.')
    if (raw.paymentMethod !== '' && !Object.hasOwn(supplierPaymentLabels, raw.paymentMethod)) {
      throw new Error('Means of payment for invalid promotion.')
    }
    return {
      id: raw.id,
      days: [...raw.days].sort((a, b) => a - b),
      paymentMethod: raw.paymentMethod,
      benefit: textValue(raw.benefit, 'Condition or benefit', 160, 3),
    }
  })
  return { name, offerings, contactPerson, phone, whatsapp, email, address,
    mapsUrl, website, instagram, notes, paymentMethods: [...input.paymentMethods], promotions }
}

export function supplierShareText(
  businessName: string,
  item: Pick<SupplierInput, 'name' | 'offerings' | 'phone' | 'whatsapp' | 'email' | 'website' | 'address' | 'mapsUrl'>,
): string {
  const lines = [businessName + ' · Proveedor: ' + item.name]
  if (item.offerings) lines.push('Ofrece: ' + item.offerings)
  if (item.phone) lines.push('Teléfono: ' + item.phone)
  if (item.whatsapp) lines.push('WhatsApp: ' + item.whatsapp)
  if (item.email) lines.push('Correo: ' + item.email)
  if (item.address) lines.push('Dirección: ' + item.address)
  if (item.website) lines.push('Sitio: ' + item.website)
  if (item.mapsUrl) lines.push('Google Maps: ' + item.mapsUrl)
  return lines.join('\n')
}
