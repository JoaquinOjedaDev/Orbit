/**
 * E1-C3: directorio de cuentas de cobro DEMO por empresa.
 * No se autentican titulares, no se verifica CBU/CVU/alias, no se guardan
 * claves, tokens, CVV ni saldos. Caja física vive en CashSession, no aquí.
 */
export type FinancialAccountKind = 'BANCARIA' | 'BILLETERA'
export type FinancialAccountChannel = 'TRANSFERENCIA' | 'MERCADO_PAGO_DECLARADO' | 'CUENTA_DNI' | 'OTRO_DECLARADO'

export const financialKindLabels: Record<FinancialAccountKind, string> = {
  BANCARIA: 'Bank account',
  BILLETERA: 'Virtual wallet',
}
export const financialChannelLabels: Record<FinancialAccountChannel, string> = {
  TRANSFERENCIA: 'Transferencia (declarada)',
  MERCADO_PAGO_DECLARADO: 'Mercado Pago (not connected)',
  CUENTA_DNI: 'DNI account (declared)',
  OTRO_DECLARADO: 'Another wallet (declared)',
}

export type FinancialAccountInput = {
  label: string
  kind: FinancialAccountKind
  channel: FinancialAccountChannel
  institution: string
  holder: string
  alias: string
  identifier: string
  notes: string
}
export type DemoFinancialAccount = FinancialAccountInput & {
  id: string
  businessId: string
  status: 'ACTIVA' | 'INACTIVA'
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}
export const blankFinancialAccount: FinancialAccountInput = {
  label: '', kind: 'BANCARIA', channel: 'TRANSFERENCIA',
  institution: '', holder: '', alias: '', identifier: '', notes: '',
}

function safeText(value: unknown, label: string, max: number, min = 0): string {
  if (typeof value !== 'string') throw new Error(label + ': enter a valid text.')
  const text = value.trim().replace(/[\t ]+/g, ' ')
  if (text.length < min || text.length > max || [...text].some((char) => {
    const cp = char.charCodeAt(0)
    return cp < 32 || cp === 127
  })) throw new Error(label + ': must have between ' + min + ' y ' + max + ' characters without control characters.')
  return text
}

/**
 * Sólo valida formato visual; no demuestra existencia de cuenta o titularidad.
 * Los CBU bancarios y CVU de billeteras se tratan como 22 dígitos de ejemplo.
 */
export function normalizeFinancialAccountInput(input: FinancialAccountInput): FinancialAccountInput {
  if (!input || !Object.hasOwn(financialKindLabels, input.kind)) {
    throw new Error('Choose a valid account type.')
  }
  if (!Object.hasOwn(financialChannelLabels, input.channel)) {
    throw new Error('Select the declared means of collection.')
  }
  if (input.kind === 'BANCARIA' && input.channel !== 'TRANSFERENCIA') {
    throw new Error('A DEMO bank account uses Transfer as a channel. For wallets, I chose Digital wallet.')
  }
  const label = safeText(input.label, 'Account identifier name', 80, 2)
  const institution = safeText(input.institution, 'Bank or wallet', 80, 2)
  const holder = safeText(input.holder, 'Reference holder', 90)
  const notes = safeText(input.notes, 'Observaciones', 350)
  const alias = safeText(input.alias, 'Alias', 20).toLowerCase()
  const identifier = safeText(input.identifier, 'CBU/CVU de prueba', 22).replace(/\s/g, '')
  if (alias && !/^[a-z0-9][a-z0-9.-]{4,18}[a-z0-9]$/.test(alias)) {
    throw new Error('The example alias must have 6 to 20 characters: letters, numbers, points or dashes.')
  }
  if (identifier && !/^\d{22}$/.test(identifier)) {
    throw new Error('The example CBU/CVU must contain 22 digits without spaces.')
  }
  if (!alias && !identifier) {
    throw new Error('Please indicate at least one alias or a fictitious CBU/CVU to identify the account.')
  }
  return { label, kind: input.kind, channel: input.channel, institution, holder, alias, identifier, notes }
}

export function financialAccountKey(value: string): string {
  return value.trim().toLocaleLowerCase('es-AR')
}

export function maskedAccountIdentifier(identifier: string): string {
  return identifier ? '•••• •••• •••• •••• ••' + identifier.slice(-4) : 'No informado'
}

/** Copia explícita: el destinatario puede ver los datos DEMO; el usuario decide si compartir. */
export function financialAccountShareText(account: Pick<DemoFinancialAccount,
  'label' | 'kind' | 'institution' | 'holder' | 'alias' | 'identifier'>): string {
  const lines = [
    account.label,
    financialKindLabels[account.kind] + ' · ' + account.institution,
    account.holder ? 'Titular: ' + account.holder : '',
    account.alias ? 'Alias: ' + account.alias : '',
    account.identifier ? (account.kind === 'BANCARIA' ? 'CBU: ' : 'CVU: ') + account.identifier : '',
    'DEMO account data: Check the data before sharing.',
  ]
  return lines.filter(Boolean).join('\n')
}

/**
 * E1-C3.1: el MEDIO de pago no es la CUENTA de origen/destino.
 * Una transferencia puede entrar o salir tanto de un banco como de una
 * billetera con alias/CVU declarado. Todas las cuentas guardadas fueron
 * normalizadas (tienen alias o CBU/CVU de referencia).
 * Los canales específicos sólo se asocian a su propia billetera declarada.
 * Esto NO verifica transferencias, saldos ni acreditaciones externas.
 */
export function accountSupportsDeclaredPayment(account: Pick<DemoFinancialAccount, 'status' | 'channel'>, method: string): boolean {
  if (account.status !== 'ACTIVA') return false
  if (method === 'TRANSFERENCIA') {
    return Object.hasOwn(financialChannelLabels, account.channel)
  }
  if (method === 'CUENTA_DNI') return account.channel === 'CUENTA_DNI'
  if (method === 'MERCADO_PAGO_DECLARADO') return account.channel === 'MERCADO_PAGO_DECLARADO'
  if (method === 'OTRO_DECLARADO') return account.channel === 'OTRO_DECLARADO'
  return false // Efectivo y tarjeta no usan cuentas bancarias de referencia.
}
