"""API autenticada de QR DEMO. No acredita pagos."""
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response
from pydantic import UUID4
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.modules.auth.dependencies import current_auth, unauthorized
from app.modules.auth.session_service import AuthContext
from app.modules.purchases.service import PurchaseSessionInvalid, PurchaseBusinessUnavailable, PurchasePermissionDenied
from app.modules.payments.qr_schemas import (
    CreateQrIntentRequest, QrIntentView, QrPaymentEventView, QrSimulateRequest, QrFinalizedView,
    QrIntentSummaryView, QrExhibitionDecisionRequest, QrExhibitionDecisionView,
)
from app.modules.payments.qr_event_service import QrEventService, QrLabDisabled
from app.modules.payments.qr_exhibition_decisions import ExhibitionDecisionService
from app.modules.payments.qr_settlement_service import (
    QrSettlementService, QrFinalizationDisabled, QrFinalizationNeedsReview,
)
from app.modules.sales.schemas import SaleView
from app.modules.sales.service import (
    SalePermissionDenied, SaleIdempotencyConflict, SaleBusinessSuspended,
)
from app.modules.payments.qr_service import (
    QrIntentService, QrIntentNotFound, QrIntentConflict, QrIntentInvalid,
    QrIntentForbidden, QrIntentNoConnection, QrIntentNoStock,
)

router = APIRouter(prefix="/businesses/{business_id}/qr-payment-intents", tags=["cobros QR DEMO"])


def _handle(error: Exception):
    if isinstance(error, QrFinalizationDisabled):
        raise HTTPException(403, detail="QR DEMO sold closure enabled only in PostgreSQL QA disposable") from None
    if isinstance(error, QrFinalizationNeedsReview):
        raise HTTPException(409, detail="Approved but unregistered trial payment: requires stock/catalogue review") from None
    if isinstance(error, QrLabDisabled):
        raise HTTPException(403, detail="QR DEMO laboratory disabled in this environment") from None
    if isinstance(error, PurchaseSessionInvalid):
        raise unauthorized() from None
    if isinstance(error, (PurchaseBusinessUnavailable, QrIntentNotFound)):
        raise HTTPException(404, detail="Attempted or not available") from None
    if isinstance(error, (PurchasePermissionDenied, QrIntentForbidden, SalePermissionDenied)):
        raise HTTPException(403, detail="No QR collection permit") from None
    if isinstance(error, (QrIntentNoStock, QrIntentNoConnection, QrIntentConflict,
                          SaleIdempotencyConflict, SaleBusinessSuspended)):
        raise HTTPException(409, detail="Account, stock or attempt not available") from None
    if isinstance(error, QrIntentInvalid):
        raise HTTPException(422, detail="Article, quantity or venue not available") from None
    raise error


@router.post("", response_model=QrIntentView, status_code=201,
    responses={200: {"description": "Repetición idempotente"},
               401: {"description": "Sesión inválida"}, 403: {"description": "Permiso"},
               404: {"description": "Empresa ajena"}, 409: {"description": "Conflicto"},
               422: {"description": "Datos inválidos"}},
    summary="Create intention QR DEMO: snapshot without sale or stock movement")
def create_qr_intent(
    business_id: UUID, command: CreateQrIntentRequest, response: Response,
    idempotency_key: UUID4 = Header(alias="Idempotency-Key"),
    context: AuthContext = Depends(current_auth), db: Session = Depends(get_db),
) -> QrIntentView:
    try:
        result = QrIntentService(db).create(
            context.user.id, context.auth_session.id, business_id, idempotency_key, command)
    except Exception as error:
        _handle(error)
    response.status_code = 200 if result.replayed else 201
    return result.body


@router.get("", response_model=list[QrIntentSummaryView],
    responses={401: {"description": "Sesión inválida"},
               404: {"description": "Empresa no accesible"}},
    summary="List company QR DEMO collections, with role-by-play range")
def list_qr_intents(
    business_id: UUID, offset: int = Query(0, ge=0, le=10_000_000),
    limit: int = Query(20, ge=1, le=50),
    context: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
) -> list[QrIntentSummaryView]:
    try:
        return QrIntentService(db).list(
            context.user.id, context.auth_session.id, business_id,
            offset=offset, limit=limit,
        )
    except Exception as error:
        _handle(error)


@router.get("/by-request/{request_id}", response_model=QrIntentView,
    responses={401: {"description": "Sesión inválida"}, 404: {"description": "No visible"}},
    summary="Recover attempt by key idempotent creator")
def get_by_request(
    business_id: UUID, request_id: UUID4, context: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
) -> QrIntentView:
    try:
        return QrIntentService(db).by_request(
            context.user.id, context.auth_session.id, business_id, request_id)
    except Exception as error:
        _handle(error)


@router.get("/{intent_id}", response_model=QrIntentView,
    responses={401: {"description": "Sesión inválida"}, 404: {"description": "No visible"}},
    summary="Check QR and immutable detail from PostgreSQL")
def get_qr_intent(
    business_id: UUID, intent_id: UUID, context: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
) -> QrIntentView:
    try:
        return QrIntentService(db).get(
            context.user.id, context.auth_session.id, business_id, intent_id)
    except Exception as error:
        _handle(error)


@router.post("/{intent_id}/cancel", response_model=QrIntentView,
    responses={401: {"description": "Sesión inválida"}, 404: {"description": "No visible"},
               409: {"description": "No cancelable"}},
    summary="Cancel QR DEMO Unconfirmed sale")
def cancel_qr_intent(
    business_id: UUID, intent_id: UUID, context: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
) -> QrIntentView:
    try:
        return QrIntentService(db).cancel(
            context.user.id, context.auth_session.id, business_id, intent_id)
    except Exception as error:
        _handle(error)


@router.get("/{intent_id}/events", response_model=list[QrPaymentEventView],
    responses={401: {"description": "Sesión inválida"},
               404: {"description": "Intención no visible"}},
    summary="Auditable QR transition history, no payment secrets")
def list_qr_events(
    business_id: UUID, intent_id: UUID,
    context: AuthContext = Depends(current_auth), db: Session = Depends(get_db),
) -> list[QrPaymentEventView]:
    try:
        return QrEventService(db).list_events(
            context.user.id, context.auth_session.id, business_id, intent_id)
    except Exception as error:
        _handle(error)


@router.post("/{intent_id}/simulate", response_model=QrIntentView, status_code=201,
    responses={200: {"description": "Evento idempotente: no duplica la transición"},
               401: {"description": "Sesión inválida"},
               403: {"description": "Rol no administrador o laboratorio deshabilitado"},
               404: {"description": "Intención ajena o inexistente"},
               409: {"description": "Evento incompatible o intento ya resuelto"},
               422: {"description": "Acción inválida"}},
    summary="Simulate ONLY in QA a fictitious collection result; DO NOT create sale")
def simulate_qr_event(
    business_id: UUID, intent_id: UUID, command: QrSimulateRequest, response: Response,
    idempotency_key: UUID4 = Header(alias="Idempotency-Key"),
    context: AuthContext = Depends(current_auth), db: Session = Depends(get_db),
) -> QrIntentView:
    try:
        result = QrEventService(db).simulate(
            context.user.id, context.auth_session.id, business_id, intent_id,
            idempotency_key, command.action)
    except Exception as error:
        _handle(error)
    response.status_code = 200 if result.replayed else 201
    return result.intent



@router.post("/{intent_id}/finalize-demo", response_model=QrFinalizedView,
    status_code=201,
    responses={200: {"description": "Misma venta y QR recuperados, sin nuevo descuento de stock"},
               401: {"description": "Sesión inválida"},
               403: {"description": "No autorizado o entorno QA no habilitado"},
               404: {"description": "QR no visible"},
               409: {"description": "Pendiente, rechazado, revisión, stock o estado incompatible"}},
    summary="Close A REAL QA sale after fictitious approval; unique transaction")
def finalize_qr_sale(
    business_id: UUID, intent_id: UUID, response: Response,
    context: AuthContext = Depends(current_auth), db: Session = Depends(get_db),
) -> QrFinalizedView:
    try:
        result = QrSettlementService(db).finalize(
            context.user.id, context.auth_session.id, business_id, intent_id)
    except Exception as error:
        _handle(error)
    response.status_code = 200 if result.replayed else 201
    return QrFinalizedView(intent=result.intent, sale=result.sale, replayed=result.replayed)


@router.get("/{intent_id}/receipt", response_model=SaleView,
    responses={401: {"description": "Sesión inválida"},
               403: {"description": "Sin permiso de lectura de venta"},
               404: {"description": "QR sin venta confirmada o no visible"}},
    summary="Recover QA sales voucher linked to QR, read only")
def qr_sale_receipt(
    business_id: UUID, intent_id: UUID,
    context: AuthContext = Depends(current_auth), db: Session = Depends(get_db),
) -> SaleView:
    try:
        return QrSettlementService(db).receipt(
            context.user.id, context.auth_session.id, business_id, intent_id)
    except Exception as error:
        _handle(error)


@router.post("/{intent_id}/exhibition-decision", response_model=QrExhibitionDecisionView,
    status_code=201,
    responses={200: {"description": "Reintento de la misma decisión; no duplica venta"},
               401: {"description": "Sin sesión"},
               403: {"description": "Rol o simulación no habilitada"},
               404: {"description": "QR de otra empresa o inexistente"},
               409: {"description": "QR vencido, cancelado, stock insuficiente o ya resuelto"}},
    summary="Fictively accept a sale or reject synthetic QR, without Market Payment")
def exhibition_decision(
    business_id: UUID, intent_id: UUID, command: QrExhibitionDecisionRequest,
    response: Response,
    idempotency_key: UUID4 = Header(alias="Idempotency-Key"),
    context: AuthContext = Depends(current_auth), db: Session = Depends(get_db),
) -> QrExhibitionDecisionView:
    try:
        result = ExhibitionDecisionService(db).decide(
            context.user.id, context.auth_session.id, business_id,
            intent_id, idempotency_key, command.action,
        )
    except Exception as error:
        _handle(error)
    response.status_code = 200 if result.replayed else 201
    return QrExhibitionDecisionView(
        intent=result.intent, sale=result.sale, replayed=result.replayed,
    )
