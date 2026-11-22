/**
 * Reglas puras para el equipo DEMO. No valida identidad ni concede permisos.
 * ADR-003: invitaciones nominativas; solicitud por QR/enlace diferida.
 */
export type InviteRole = 'ENCARGADO' | 'TRABAJADOR'
export type InvitationStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA'
export type InvitationDisplayStatus = InvitationStatus | 'EXPIRADA'

export const inviteRoleLabels: Record<InviteRole, string> = {
  ENCARGADO: 'Manager',
  TRABAJADOR: 'Staff member',
}

export const INVITATION_VALIDITY_DAYS = 7

export function normalizeInviteInput(emailInput: string, role: InviteRole): { email: string; role: InviteRole } {
  const email = emailInput.trim().toLowerCase()
  if (email.length > 120 || email.length < 6 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid format email. For testing use a fictitious domain .invalid.')
  }
  if (role !== 'ENCARGADO' && role !== 'TRABAJADOR') {
    throw new Error('You can only invite with role Manager or Worker.')
  }
  return { email, role }
}

export function invitationExpiresAt(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() + INVITATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

export function displayInvitationStatus(
  invitation: { status: InvitationStatus; expiresAt: string },
  now = Date.now(),
): InvitationDisplayStatus {
  return invitation.status === 'PENDIENTE' && new Date(invitation.expiresAt).getTime() <= now
    ? 'EXPIRADA'
    : invitation.status
}

export function canReplyToInvitation(
  invitation: { status: InvitationStatus; expiresAt: string },
  now = Date.now(),
): boolean {
  return displayInvitationStatus(invitation, now) === 'PENDIENTE'
}
