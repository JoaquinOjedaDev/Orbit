import type { QrIntent } from './qrIntentGateway.ts'

export type QrStatus = QrIntent['status']
export type QrStatusPresentation = {
  title: string
  description: string
  tone: 'pending' | 'success' | 'warning' | 'neutral'
  nextStep: string
}
const LABELS: Record<QrStatus, QrStatusPresentation> = {
  ESPERANDO_PAGO: {
    title: 'Pending simulation', tone: 'pending',
    description: 'The test code is generated, but no approvals have been registered yet.',
    nextStep: 'Simulate the result in the authorized laboratory or cancel this attempt.',
  },
  APROBADA_DEMO: {
    title: 'Approved in laboratory', tone: 'pending',
    description: 'The lab indicated a fictitious approval. There is still no sale or debit of inventory.',
    nextStep: 'If you work on a disposable QA base, you will register the trial sale.',
  },
  FINALIZADA: {
    title: 'QA sale confirmed', tone: 'success',
    description: 'The internal sale was confirmed together with their voucher and the stock movements that correspond.',
    nextStep: 'Check the voucher. This transaction does not credit payment market money.',
  },
  REQUIERE_REVISION: {
    title: 'Review required', tone: 'warning',
    description: 'The fictitious approval could not become an internal sale. No stock was deducted.',
    nextStep: 'Check catalogue, location and availability; do not re-generate a sale from this QR.',
  },
  INDETERMINADA: {
    title: 'Resultado incierto', tone: 'warning',
    description: 'The laboratory has not yet had a definitive result.',
    nextStep: 'Check status and events before re-simulating.',
  },
  RECHAZADA: {
    title: 'Rejected in laboratory', tone: 'neutral',
    description: 'The simulation ended up being rejected.',
    nextStep: 'For another operation, create a new QR from the POS.',
  },
  CANCELADA: {
    title: 'QR cancelado', tone: 'neutral',
    description: 'The attempt was cancelled.',
    nextStep: 'For another operation, create a new QR from the POS.',
  },
  EXPIRADA: {
    title: 'QR vencido', tone: 'neutral',
    description: 'The deadline for this DEMO QR ended without a valid approval.',
    nextStep: 'For another operation, create a new QR from the POS.',
  },
}
export function qrStatusPresentation(status: QrStatus): QrStatusPresentation {
  return LABELS[status]
}
export function qrEffectiveStatus(status: QrStatus, expiresAt: string, now: number): QrStatus {
  return status === 'ESPERANDO_PAGO' && new Date(expiresAt).getTime() <= now ? 'EXPIRADA' : status
}
export function qrNeedsRecovery(status: QrStatus): boolean {
  return status === 'INDETERMINADA' || status === 'REQUIERE_REVISION'
}
