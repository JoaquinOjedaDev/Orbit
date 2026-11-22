"""CU-07: confirmar y consultar recepción física completa de una Compra."""
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import UUID4
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.modules.auth.dependencies import current_auth, unauthorized
from app.modules.auth.session_service import AuthContext
from app.modules.purchases.receipt_schemas import ReceivePurchaseRequest, PurchaseReceiptView
from app.modules.purchases.receipt_service import (
    ReceiptService, ReceiptNotFound, ReceiptLocationUnavailable,
    ReceiptBusinessSuspended, ReceiptLocationIncompatible, ReceiptPermissionDenied,
    ReceiptAlreadyProcessed, ReceiptIdempotencyConflict,
    ReceiptCatalogIncompatible, ReceiptBalanceOverflow,
)
from app.modules.purchases.service import (
    PurchaseSessionInvalid, PurchaseBusinessUnavailable, PurchasePermissionDenied,
)

router = APIRouter(
    prefix="/businesses/{business_id}/purchases/{purchase_id}",
    tags=["recepciones"],
)


def receipt_error(exc: Exception) -> HTTPException:
    if isinstance(exc, (PurchaseBusinessUnavailable, ReceiptNotFound, ReceiptLocationUnavailable)):
        return HTTPException(404, detail="Purchase, company or location not available")
    if isinstance(exc, (PurchasePermissionDenied, ReceiptPermissionDenied)):
        return HTTPException(403, detail="No permission to operate in this location")
    if isinstance(exc, ReceiptBusinessSuspended):
        return HTTPException(409, detail="Company suspended")
    if isinstance(exc, ReceiptLocationIncompatible):
        return HTTPException(409, detail="Pause or unenabled location for storage")
    if isinstance(exc, ReceiptAlreadyProcessed):
        return HTTPException(409, detail="Purchase already received, cancelled or without physical goods receptionable")
    if isinstance(exc, ReceiptIdempotencyConflict):
        return HTTPException(409, detail="Reused reception key for another operation")
    if isinstance(exc, ReceiptCatalogIncompatible):
        return HTTPException(409, detail="Inactive or incompatible type/unit historical article")
    if isinstance(exc, ReceiptBalanceOverflow):
        return HTTPException(409, detail="Inventory quantity exceeds the allowed limit")
    raise TypeError("Error sin mapeo HTTP")


@router.post(
    "/receive", response_model=PurchaseReceiptView, status_code=201,
    responses={
        200: {"description": "Repeticion identica sin duplicar stock"},
        401: {"description": "Sesion requerida o invalida"},
        403: {"description": "Sin permiso STORE en destino"},
        404: {"description": "Empresa, compra o ubicacion fuera del tenant"},
        409: {"description": "Compra cerrada, destino invalido, clave distinta o conflicto de stock"},
        422: {"description": "Cuerpo o encabezado invalido"},
    },
    summary="Receive complete purchase at a location and confirm atom stock tickets",
)
def receive_purchase(
    business_id: UUID, purchase_id: UUID,
    command: ReceivePurchaseRequest, response: Response,
    idempotency_key: UUID4 = Header(alias="Idempotency-Key"),
    context: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
) -> PurchaseReceiptView:
    try:
        result = ReceiptService(db).receive(
            context.user.id, context.auth_session.id,
            business_id, purchase_id, idempotency_key, command,
        )
    except PurchaseSessionInvalid:
        raise unauthorized() from None
    except (PurchaseBusinessUnavailable, PurchasePermissionDenied, ReceiptNotFound,
            ReceiptLocationUnavailable, ReceiptBusinessSuspended, ReceiptLocationIncompatible,
            ReceiptPermissionDenied, ReceiptAlreadyProcessed, ReceiptIdempotencyConflict,
            ReceiptCatalogIncompatible, ReceiptBalanceOverflow) as exc:
        raise receipt_error(exc) from None
    response.status_code = 200 if result.replayed else 201
    return result.body


@router.get(
    "/receipt", response_model=PurchaseReceiptView,
    responses={
        401: {"description": "Sesion invalida"},
        403: {"description": "Sin permiso de lectura"},
        404: {"description": "Recepcion ausente o de otro tenant"},
    },
    summary="Check historical receipts and movements",
)
def get_receipt(
    business_id: UUID, purchase_id: UUID,
    context: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
) -> PurchaseReceiptView:
    try:
        return ReceiptService(db).get_receipt(
            context.user.id, context.auth_session.id, business_id, purchase_id,
        )
    except PurchaseSessionInvalid:
        raise unauthorized() from None
    except (PurchaseBusinessUnavailable, PurchasePermissionDenied, ReceiptNotFound) as exc:
        raise receipt_error(exc) from None
