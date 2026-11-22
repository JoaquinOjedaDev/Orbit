"""RF-06/CU-11: ajustes justificados y stock inicial físico por ubicación."""
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import UUID4
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.modules.auth.dependencies import current_auth, unauthorized
from app.modules.auth.session_service import AuthContext
from app.modules.purchases.service import (
    PurchaseSessionInvalid, PurchaseBusinessUnavailable, PurchasePermissionDenied,
)
from app.modules.purchases.adjustment_schemas import (
    AdjustStockRequest, StockAdjustmentView,
)
from app.modules.purchases.adjustment_service import (
    AdjustmentService, AdjustmentNotFound, AdjustmentPermissionDenied,
    AdjustmentCompanySuspended, AdjustmentLocationUnavailable,
    AdjustmentLocationIncompatible, AdjustmentItemUnavailable,
    AdjustmentInvalidQuantity, AdjustmentVersionConflict,
    AdjustmentInsufficientStock, AdjustmentInitialConflict,
    AdjustmentBalanceOverflow, AdjustmentIdempotencyConflict,
)

router = APIRouter(
    prefix="/businesses/{business_id}/inventory/adjustments", tags=["ajustes-inventario"],
)


def _http_error(error: Exception) -> HTTPException:
    if isinstance(error, (
        PurchaseBusinessUnavailable, AdjustmentNotFound, AdjustmentLocationUnavailable,
        AdjustmentItemUnavailable,
    )):
        return HTTPException(404, detail="Company, article, location or operation not available")
    if isinstance(error, (PurchasePermissionDenied, AdjustmentPermissionDenied)):
        return HTTPException(403, detail="Without permission to adjust inventory at this location")
    if isinstance(error, AdjustmentCompanySuspended):
        return HTTPException(409, detail="Company suspended")
    if isinstance(error, AdjustmentLocationIncompatible):
        return HTTPException(409, detail="Inactive or unfit to store location")
    if isinstance(error, AdjustmentVersionConflict):
        return HTTPException(409, detail="Version of obsolete balance or non-existent balance")
    if isinstance(error, AdjustmentInitialConflict):
        return HTTPException(409, detail="Initial stock already established in this location and article")
    if isinstance(error, AdjustmentInsufficientStock):
        return HTTPException(409, detail="Insufficient stock for output adjustment")
    if isinstance(error, AdjustmentBalanceOverflow):
        return HTTPException(409, detail="The amount exceeds the inventory limits")
    if isinstance(error, AdjustmentIdempotencyConflict):
        return HTTPException(409, detail="Idepotent key reused with other content or actor")
    if isinstance(error, AdjustmentInvalidQuantity):
        return HTTPException(422, detail="Fractional amount for a discrete item")
    raise TypeError("Error de ajuste sin mapeo HTTP")


@router.post(
    "", status_code=201, response_model=StockAdjustmentView,
    response_model_exclude_none=True,
    responses={
        200: {"description": "Repeticion identica: no vuelve a modificar stock"},
        401: {"description": "Sesion invalida"},
        403: {"description": "Rol o asignacion STORE insuficientes"},
        404: {"description": "Empresa, articulo o ubicacion fuera del tenant"},
        409: {"description": "Stock/rol/ubicacion incompatible, clave, version u origen previo"},
        422: {"description": "Campos, cantidad, motivo, UUID o version invalidos"},
    },
    summary="Adjust input/output or register initial stock for motif and version",
)
def create_adjustment(
    business_id: UUID, command: AdjustStockRequest, response: Response,
    idempotency_key: UUID4 = Header(alias="Idempotency-Key"),
    context: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
) -> StockAdjustmentView:
    try:
        result = AdjustmentService(db).adjust(
            context.user.id, context.auth_session.id,
            business_id, idempotency_key, command,
        )
    except PurchaseSessionInvalid:
        raise unauthorized() from None
    except (
        PurchaseBusinessUnavailable, PurchasePermissionDenied,
        AdjustmentPermissionDenied, AdjustmentCompanySuspended,
        AdjustmentLocationUnavailable, AdjustmentLocationIncompatible,
        AdjustmentItemUnavailable, AdjustmentInvalidQuantity,
        AdjustmentVersionConflict, AdjustmentInsufficientStock,
        AdjustmentInitialConflict, AdjustmentBalanceOverflow,
        AdjustmentIdempotencyConflict,
    ) as error:
        raise _http_error(error) from None
    response.status_code = 200 if result.replayed else 201
    return result.body


@router.get(
    "/{adjustment_id}", response_model=StockAdjustmentView,
    response_model_exclude_none=True,
    responses={
        401: {"description": "Sesion invalida"},
        403: {"description": "Sin permiso de lectura"},
        404: {"description": "Operacion fuera del tenant o inexistente"},
    },
    summary="Check a historical initial stock or adjustment without altering balances",
)
def get_adjustment(
    business_id: UUID, adjustment_id: UUID,
    context: AuthContext = Depends(current_auth),
    db: Session = Depends(get_db),
) -> StockAdjustmentView:
    try:
        return AdjustmentService(db).get(
            context.user.id, context.auth_session.id, business_id, adjustment_id,
        )
    except PurchaseSessionInvalid:
        raise unauthorized() from None
    except (PurchaseBusinessUnavailable, PurchasePermissionDenied,
            AdjustmentNotFound) as error:
        raise _http_error(error) from None
