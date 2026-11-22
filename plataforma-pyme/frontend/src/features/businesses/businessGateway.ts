import { ApiHttpError, ApiTransportError, createApiClient } from '../../api/httpClient.ts'

/** Contracts: backend/app/modules/businesses/schemas.py (CU-03). */
export type ActivityKind = 'PRODUCTOS' | 'SERVICIOS' | 'MIXTO'
export type BusinessMembership = {
  id: string
  user_id: string
  role: string
  status: string
  job_title: string | null
}
export type RealBusiness = {
  id: string
  name: string
  category: string
  activity_kind: ActivityKind
  status: 'ACTIVA' | 'SUSPENDIDA'
  founder_user_id: string
  created_at: string
  membership: BusinessMembership
}
export type NewBusiness = { name: string; category: string; activity_kind: ActivityKind }
export type BusinessChanges = Partial<NewBusiness>

export const UUID_PATTERN = /^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i
export const UUID_V4_PATTERN = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function requiredText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
function kind(value: unknown): value is ActivityKind {
  return value === 'PRODUCTOS' || value === 'SERVICIOS' || value === 'MIXTO'
}
function invalidResponse(): never {
  throw new ApiTransportError('invalid-response', false)
}

export function parseRealBusiness(value: unknown, userId: string): RealBusiness {
  if (!record(value) || !requiredText(value.id) || !UUID_PATTERN.test(value.id)
    || !requiredText(value.name) || !requiredText(value.category) || !kind(value.activity_kind)
    || (value.status !== 'ACTIVA' && value.status !== 'SUSPENDIDA')
    || !requiredText(value.founder_user_id) || !requiredText(value.created_at)
    || !record(value.membership) || !requiredText(value.membership.id)
    || value.membership.user_id !== userId || !requiredText(value.membership.role)
    || value.membership.status !== 'ACTIVA'
    || !(value.membership.job_title === null || typeof value.membership.job_title === 'string')) {
    return invalidResponse()
  }
  return {
    id: value.id, name: value.name, category: value.category,
    activity_kind: value.activity_kind, status: value.status,
    founder_user_id: value.founder_user_id, created_at: value.created_at,
    membership: {
      id: value.membership.id, user_id: value.membership.user_id,
      role: value.membership.role, status: value.membership.status,
      job_title: value.membership.job_title,
    },
  }
}

export function parseRealBusinessList(value: unknown, userId: string): RealBusiness[] {
  if (!Array.isArray(value)) return invalidResponse()
  const businesses = value.map((item) => parseRealBusiness(item, userId))
  if (new Set(businesses.map((item) => item.id)).size !== businesses.length) return invalidResponse()
  return businesses
}

/** One authenticated gateway per in-memory session. Never touches demoStore. */
export function createBusinessGateway(token: string, userId: string, fetchImpl?: typeof fetch) {
  if (!token || !userId) throw new TypeError('Authenticated session required')
  const client = createApiClient({ getAccessToken: () => token, fetchImpl })
  return {
    async list(signal?: AbortSignal): Promise<RealBusiness[]> {
      return parseRealBusinessList(
        await client.request<unknown>('/businesses', { signal }), userId)
    },
    async get(businessId: string, signal?: AbortSignal): Promise<RealBusiness> {
      if (!UUID_PATTERN.test(businessId)) throw new TypeError('Invalid company ID')
      return parseRealBusiness(
        await client.request<unknown>('/businesses/' + businessId, { signal }), userId)
    },
    async create(input: NewBusiness, key: string): Promise<RealBusiness> {
      if (!UUID_V4_PATTERN.test(key)) throw new TypeError('Idempotency-Key debe ser UUID4')
      return parseRealBusiness(await client.request<unknown>('/businesses', {
        method: 'POST', body: input, idempotencyKey: key,
      }), userId)
    },
    async update(businessId: string, changes: BusinessChanges): Promise<RealBusiness> {
      if (!UUID_PATTERN.test(businessId)) throw new TypeError('Invalid company ID')
      return parseRealBusiness(await client.request<unknown>('/businesses/' + businessId, {
        method: 'PATCH', body: changes,
      }), userId)
    },
  }
}

export function businessErrorMessage(error: unknown): string {
  if (error instanceof ApiHttpError) {
    if (error.status === 401) return 'The session is no longer valid. I re-entered.'
    if (error.status === 403) return 'You don\'t have permission to perform this operation.'
    if (error.status === 404) return 'The company is not available for your account.'
    if (error.status === 409) return 'The operation conflicts with the current state or your application key.'
    if (error.status === 422) return 'Check the mandatory data and its format.'
    return 'FastAPI could not complete the application.'
  }
  if (error instanceof ApiTransportError) {
    if (error.reason === 'aborted') return 'Solicitud cancelada.'
    if (error.reason === 'timeout') return 'The API took too long to respond. The result of the change could be uncertain.'
    if (error.reason === 'invalid-response') return 'The API returned data that was incompatible with the contract.'
    return 'Could not contact FastAPI. Check the connection.'
  }
  return 'Could not complete the operation.'
}

export function canEditBusiness(business: RealBusiness): boolean {
  return business.status === 'ACTIVA' && business.membership.status === 'ACTIVA'
    && ['TITULAR_ADMINISTRATIVO', 'ADMINISTRADOR'].includes(business.membership.role)
}
