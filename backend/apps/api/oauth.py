from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List

from apps.core.dependencies import get_db, get_current_user
from apps.services.oauth.oauth_service_email import oauth_service
from apps.schemas.oauth import (
    OAuthConnectResponse,
    OAuthConnectionResponse
)
from apps.models.user import User
from apps.models.oauth_connection import OAuthConnection


router = APIRouter(prefix="/oauth", tags=["OAuth"])


@router.get("/{service}/connect", response_model=OAuthConnectResponse)
async def connect_service(
    service: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)  # Ya lo tienes
):
    """
    Inicia el flujo OAuth para conectar cualquier servicio de Google
    (Gmail, Drive, Calendar, etc.)
    
    Si el usuario ya tiene otros servicios conectados, se solicitarán
    los scopes acumulados para mantener la compatibilidad.
    """

    # Verificar que el servicio sea soportado
    if service not in oauth_service.SUPPORTED_SERVICES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Servicio '{service}' no soportado"
        )

    # Primero intentar reconexión rápida
    result = oauth_service.reconnect_service(
        str(current_user.id),
        service,
        db
    )
    
    if result["reconnected"]:
        # Reconectado sin OAuth
        return {"status": "reconnected", "message": result["message"]}

    

    # Generar URL de autorización con scopes acumulados
    authorization_url, state = oauth_service.generate_authorization_url(
        str(current_user.id),
        service,
        db  # 🔥 Ahora necesita la sesión de BD
    )

    return {
        "authorization_url": authorization_url,
        "state": state
    }


@router.get("/callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Callback único para todas las integraciones Google OAuth.
    - No se extrae `service` aquí, el `handle_callback` es la única fuente de verdad.
    - El `state` puede tener formato: user_id:service:nonce
    """

    # 1) Extraer user_id de forma segura
    parts = state.split(":", 2)
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="State inválido")

    user_id = parts[0]

    try:
        # 2) handle_callback ahora extrae y valida service internamente
        oauth_conn = oauth_service.handle_callback(
            code=code,
            state=state,
            user_id=user_id,
            service="",  # <-- ya no usamos este argumento, se ignora dentro del método
            db=db
        )

        service = oauth_conn.service
        email = oauth_conn.meta_data.get("email", "")

        # HTML de cierre
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Autenticación exitosa</title></head>
        <body>
            <h2>✅ Autenticación exitosa en {service.capitalize()}</h2>
            <p>Cerrando ventana...</p>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        status: 'success',
                        app: '{service}',
                        email: '{email}'
                    }}, 'https://optimusagent.vercel.app');
                    setTimeout(() => window.close(), 500);
                }}
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)

    except Exception as e:
        return HTMLResponse(content=f"Error procesando OAuth: {str(e)}")


@router.get("/connections", response_model=List[OAuthConnectionResponse])
async def get_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las conexiones OAuth activas del usuario
    """
    connections = db.query(OAuthConnection).filter_by(
        user_id=current_user.id,
        is_active=True
    ).all()

    return connections


@router.get("/{service}/status")
async def service_status(
    service: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifica si un servicio está conectado
    """
    if service not in oauth_service.SUPPORTED_SERVICES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Servicio '{service}' no soportado"
        )

    oauth_conn = oauth_service.get_user_connection(str(current_user.id), service, db)

    if not oauth_conn:
        return {"connected": False, "message": f"{service.capitalize()} no conectado"}

    return {
        "connected": True,
        "email": oauth_conn.meta_data.get('email') if oauth_conn.meta_data else None,
        "connected_at": oauth_conn.connected_at,
        "last_used_at": oauth_conn.last_used_at
    }


@router.delete("/{service}/disconnect")
async def disconnect_service(
    service: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Desconecta un servicio específico.
    
    Si es el último servicio activo, revoca el token en Google y elimina
    todos los registros para permitir un inicio limpio.
    """
    if service not in oauth_service.SUPPORTED_SERVICES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Servicio '{service}' no soportado"
        )

    result = oauth_service.disconnect_service(str(current_user.id), service, db)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{service.capitalize()} no estaba conectado"
        )

    message = f"{service.capitalize()} desconectado exitosamente"
    
    if result["revoked"] and result["cleaned"]:
        message += ". Token revocado en Google - puedes reconectar servicios en cualquier orden."
    elif result["remaining_services"] > 0:
        message += f". Aún tienes {result['remaining_services']} servicio(s) conectado(s)."

    return {
        "success": True,
        "message": message,
        "revoked_in_google": result["revoked"],
        "cleaned_database": result["cleaned"],
        "remaining_services": result["remaining_services"]
    }