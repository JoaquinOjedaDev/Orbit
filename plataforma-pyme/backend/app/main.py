"""Entrada ASGI de Orbit.

E2-0.3 incorpora conexion SQLAlchemy, readiness y Alembic.
El frontend continua independiente.
"""

from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.readiness import router as readiness_router
from app.api.v1.router import api_v1_router
from app.web_spa import attach_spa
from app.modules.payments.qr_exhibition import validate_exhibition_environment


def create_app() -> FastAPI:
    """Construye la aplicacion y monta sus routers publicos."""
    validate_exhibition_environment()
    application = FastAPI(
        title="Orbit API",
        description=(
            "Backend REST of the multi-company management system. E2-0.3: PostgreSQL connection and migrations; no commercial data."
        ),
        version="0.1.0",
    )
    application.include_router(health_router)
    application.include_router(readiness_router)
    application.include_router(api_v1_router)
    # The public Docker image bakes /app/site; local FastAPI remains API-only.
    attach_spa(application)
    return application


app = create_app()
