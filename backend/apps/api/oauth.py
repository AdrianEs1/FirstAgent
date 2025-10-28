from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from apps.core.dependencies import get_db, get_current_user
from apps.services.oauth.oauth_service_email import oauth_service
from apps.schemas.oauth import (
    OAuthAuthorizationURL, 
    OAuthCallbackResponse,
    OAuthConnectionResponse
)
from apps.models.user import User
from apps.models.oauth_connection import OAuthConnection
from typing import List


router = APIRouter(prefix="/oauth", tags=["OAuth"])


@router.get("/gmail/connect", response_model=OAuthAuthorizationURL)
async def connect_gmail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ 
    Inicia el flujo OAuth para conectar Gmail
    
    Retorna la URL a la que el usuario debe ir para autorizar
    """
    authorization_url, state = oauth_service.generate_authorization_url(str(current_user.id))
    
    return {
        "authorization_url": authorization_url,
        "state": state
    }


"""@router.get("/gmail/callback")
async def gmail_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    
    Callback de Google OAuth
    
    Google redirige aquí después de que el usuario autoriza
    
    # Extraer user_id del state
    try:
        user_id = state.split(':')[0]
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State inválido"
        )
    
    try:
        # Procesar callback
        oauth_conn = oauth_service.handle_callback(code, state, user_id, db)
        
        # Redirigir al frontend con éxito
        frontend_url = "http://localhost:5173"  # Cambiar en producción
        return RedirectResponse(
            url=f"{frontend_url}/oauth/success?service=gmail&email={oauth_conn.meta_data.get('email')}"
        )
        
    except Exception as e:
        # Redirigir al frontend con error
        frontend_url = "http://localhost:5173"
        return RedirectResponse(
            url=f"{frontend_url}/oauth/error?message={str(e)}"
        )
"""



@router.get("/gmail/callback")
async def gmail_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Callback de Google OAuth
   
    Google redirige aquí después de que el usuario autoriza
    """
    # Extraer user_id del state
    try:
        user_id = state.split(':')[0]
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State inválido"
        )
   
    try:
        # Procesar callback
        oauth_conn = oauth_service.handle_callback(code, state, user_id, db)
        
        # ✅ Devolver HTML que cierra el popup y comunica con la ventana principal
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Autenticación exitosa</title>
        </head>
        <body>
            <h2>✅ Autenticación exitosa</h2>
            <p>Cerrando ventana...</p>
            <script>
                // Enviar mensaje a la ventana principal
                if (window.opener) {{
                    window.opener.postMessage({{
                        status: 'success',
                        app: 'gmail',
                        email: '{oauth_conn.meta_data.get('email', '')}'
                    }}, 'https://optimusagent-app.onrender.com');
                    
                    // Cerrar popup después de 500ms
                    setTimeout(() => window.close(), 500);
                }} else {{
                    document.body.innerHTML = '<h2>✅ Autenticación completada</h2><p>Puedes cerrar esta ventana.</p>';
                }}
            </script>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
       
    except Exception as e:
        # ✅ HTML para el caso de error
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error de autenticación</title>
        </head>
        <body>
            <h2>❌ Error de autenticación</h2>
            <p>{str(e)}</p>
            <script>
                if (window.opener) {{
                    window.opener.postMessage({{
                        status: 'error',
                        app: 'gmail',
                        message: '{str(e)}'
                    }}, 'https://optimusagent-app.onrender.com');
                    
                    setTimeout(() => window.close(), 2000);
                }} else {{
                    document.body.innerHTML += '<p>Puedes cerrar esta ventana.</p>';
                }}
            </script>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)

@router.get("/connections", response_model=List[OAuthConnectionResponse])
async def get_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las conexiones OAuth del usuario
    """
    connections = db.query(OAuthConnection).filter_by(
        user_id=current_user.id,
        is_active=True
    ).all()
    
    return connections


@router.get("/gmail/status")
async def gmail_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifica si Gmail está conectado
    """
    oauth_conn = oauth_service.get_user_connection(str(current_user.id), 'gmail', db)
    
    if not oauth_conn:
        return {
            "connected": False,
            "message": "Gmail no conectado"
        }
    
    return {
        "connected": True,
        "email": oauth_conn.meta_data.get('email') if oauth_conn.meta_data else None,
        "connected_at": oauth_conn.connected_at,
        "last_used_at": oauth_conn.last_used_at
    }


@router.delete("/gmail/disconnect")
async def disconnect_gmail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Desconecta Gmail
    """
    success = oauth_service.disconnect_service(str(current_user.id), 'gmail', db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gmail no estaba conectado"
        )
    
    return {
        "success": True,
        "message": "Gmail desconectado exitosamente"
    }