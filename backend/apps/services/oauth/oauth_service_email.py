from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from googleapiclient.discovery import build
from sqlalchemy.orm import Session
from datetime import datetime
from apps.models.oauth_connection import OAuthConnection
from apps.core.encryption import encryption
import os
import secrets
import requests


# 🔧 Configuración base de Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")


# 🎯 Servicios soportados
SUPPORTED_SERVICES = {
    "gmail": {
        "scopes": [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            
        ],
        "profile_api": (
            "gmail",
            "v1",
            lambda service: service.users().getProfile(userId="me").execute(),
        ),
        "extract_email": lambda profile: profile.get("emailAddress"),
    },

    "drive": {
        "scopes": [
            "https://www.googleapis.com/auth/drive.metadata.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.file",
        ],
        "profile_api": (
            "drive",
            "v3",
            lambda service: service.about().get(fields="user").execute(),
        ),
        "extract_email": lambda profile: profile["user"]["emailAddress"],
    },
    
    "calendar": {
        "scopes": [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar",
        ],
        "profile_api": (
            "calendar",
            "v3",
            lambda service: service.calendarList().list().execute(),
        ),
        "extract_email": lambda profile: profile["items"][0].get("id", "") if profile.get("items") else "",
    },
}


class OAuthService:
    """
    Servicio centralizado para manejar OAuth de Google con scopes incrementales.
    
    Estrategia:
    - Los scopes NUNCA disminuyen mientras haya servicios activos
    - Se mantienen scopes de servicios inactivos para evitar conflictos con Google
    - Solo cuando se desconectan TODOS los servicios, se revoca el token y se limpian registros
    """

    SUPPORTED_SERVICES = SUPPORTED_SERVICES

    # -------------------- Helpers --------------------

    def get_accumulated_scopes(self, user_id: str, db: Session, new_service: str) -> list:
        """
        Obtiene scopes acumulados de TODOS los servicios (activos e inactivos).
        
        Esto garantiza que los scopes NUNCA disminuyan, evitando el error
        "scope has changed" de Google. Los scopes solo pueden crecer.
        
        Cuando el usuario desconecta todos los servicios, se limpian los registros
        y se puede empezar de cero.
        """
        # Obtener TODOS los servicios en BD (activos e inactivos)
        all_connections = db.query(OAuthConnection).filter_by(
            user_id=user_id
        ).all()
        
        # Acumular scopes de TODOS los servicios
        accumulated_scopes = []
        for conn in all_connections:
            if conn.service in SUPPORTED_SERVICES:
                accumulated_scopes.extend(SUPPORTED_SERVICES[conn.service]["scopes"])
        
        # Agregar scopes del nuevo servicio
        accumulated_scopes.extend(SUPPORTED_SERVICES[new_service]["scopes"])
        
        # Eliminar duplicados manteniendo orden
        return list(dict.fromkeys(accumulated_scopes))

    def create_google_flow_with_scopes(self, service: str, scopes: list, redirect_uri: str = None) -> Flow:
        """Crea el flujo OAuth con scopes personalizados (acumulados)"""
        if service not in SUPPORTED_SERVICES:
            raise ValueError(f"Servicio '{service}' no soportado")

        client_config = {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri or f"{GOOGLE_REDIRECT_URI}/api/oauth/{service}/callback"],
            }
        }

        flow = Flow.from_client_config(
            client_config,
            scopes=scopes,
            redirect_uri=redirect_uri or f"{GOOGLE_REDIRECT_URI}/api/oauth/{service}/callback",
        )
        return flow

    def _revoke_google_token(self, access_token: str) -> bool:
        """
        Revoca el token en Google, eliminando el historial de scopes.
        Documentación: https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke
        """
        try:
            response = requests.post(
                'https://oauth2.googleapis.com/revoke',
                params={'token': access_token},
                headers={'content-type': 'application/x-www-form-urlencafe-urlencoded'}
            )
            
            # Google retorna 200 si se revocó correctamente
            return response.status_code == 200
        except Exception as e:
            print(f"⚠️ Error revocando token en Google: {e}")
            return False

    # -------------------- Autorización --------------------

    def generate_authorization_url(self, user_id: str, service: str, db: Session) -> tuple:
        """
        Genera la URL de autorización de Google OAuth con scopes acumulados.
        
        Incluye scopes de todos los servicios previos (activos e inactivos)
        para evitar conflictos con el historial de Google.
        """
        # Obtener scopes acumulados
        scopes = self.get_accumulated_scopes(user_id, db, service)
        
        # Crear flow con TODOS los scopes acumulados
        flow = self.create_google_flow_with_scopes(service, scopes)
        state = f"{user_id}:{service}:{secrets.token_urlsafe(32)}"

        authorization_url, state = flow.authorization_url(
            access_type="offline",
            prompt="consent",
            include_granted_scopes="true",
            state=state,
        )
        return authorization_url, state

    # -------------------- Callback --------------------

    def handle_callback(
        self, code: str, state: str, user_id: str, service: str, db: Session
    ) -> OAuthConnection:
        """
        Maneja el callback de OAuth y actualiza TODAS las conexiones existentes.
        
        Todos los servicios de Google comparten el mismo token, por lo que
        cuando se obtiene un token nuevo, se actualizan todas las conexiones.
        """
        # Validar service y state
        if service not in SUPPORTED_SERVICES:
            raise ValueError(f"Servicio '{service}' no soportado")
        if not state.startswith(user_id):
            raise ValueError("State inválido - posible ataque CSRF")

        # Obtener scopes acumulados
        scopes = self.get_accumulated_scopes(user_id, db, service)
        
        # Intercambiar el code por tokens
        flow = self.create_google_flow_with_scopes(service, scopes)
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Obtener perfil del usuario según el servicio actual
        api_name, api_version, get_profile_fn = SUPPORTED_SERVICES[service]["profile_api"]
        google_service = build(api_name, api_version, credentials=credentials)
        profile = get_profile_fn(google_service)
        email = SUPPORTED_SERVICES[service]["extract_email"](profile)

        # Actualizar TODAS las conexiones existentes con los nuevos tokens
        existing_connections = db.query(OAuthConnection).filter_by(
            user_id=user_id
        ).all()

        encrypted_access_token = encryption.encrypt(credentials.token)
        encrypted_refresh_token = encryption.encrypt(credentials.refresh_token)

        # Actualizar conexiones existentes
        for conn in existing_connections:
            conn.access_token = encrypted_access_token
            conn.refresh_token = encrypted_refresh_token
            conn.token_expires_at = credentials.expiry
            conn.scopes = scopes
            conn.connected_at = datetime.utcnow()

        # Crear o actualizar la conexión del servicio actual
        current_conn = db.query(OAuthConnection).filter_by(
            user_id=user_id, 
            service=service
        ).first()

        if current_conn:
            current_conn.access_token = encrypted_access_token
            current_conn.refresh_token = encrypted_refresh_token
            current_conn.token_expires_at = credentials.expiry
            current_conn.scopes = scopes
            current_conn.service_user_id = email
            current_conn.is_active = True
            current_conn.meta_data = {
                "email": email,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
            }
            current_conn.connected_at = datetime.utcnow()
        else:
            current_conn = OAuthConnection(
                user_id=user_id,
                service=service,
                access_token=encrypted_access_token,
                refresh_token=encrypted_refresh_token,
                token_expires_at=credentials.expiry,
                scopes=scopes,
                service_user_id=email,
                is_active=True,
                meta_data={
                    "email": email,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                },
            )
            db.add(current_conn)

        db.commit()
        db.refresh(current_conn)
        return current_conn

    # -------------------- Consultas --------------------

    def get_user_connection(
        self, user_id: str, service: str, db: Session
    ) -> OAuthConnection:
        """Obtiene la conexión OAuth activa del usuario para un servicio"""
        return (
            db.query(OAuthConnection)
            .filter_by(user_id=user_id, service=service, is_active=True)
            .first()
        )

    def disconnect_service(self, user_id: str, service: str, db: Session) -> dict:
        """
        Desconecta un servicio OAuth.
        
        - Si quedan servicios activos: Solo marca is_active=False
        - Si es el último servicio: Revoca el token en Google y elimina TODOS los registros
        
        Esto permite un inicio limpio cuando el usuario desconecta todo.
        """
        oauth_conn = self.get_user_connection(user_id, service, db)
        if not oauth_conn:
            return {"success": False, "revoked": False, "cleaned": False}
        
        # Marcar como inactivo
        oauth_conn.is_active = False
        db.commit()
        
        # Verificar si quedan servicios activos
        remaining_active = db.query(OAuthConnection).filter_by(
            user_id=user_id,
            is_active=True
        ).count()
        
        revoked = False
        cleaned = False
        
        # Si era el último servicio activo
        if remaining_active == 0:
            try:
                # Revocar token en Google
                access_token = encryption.decrypt(oauth_conn.access_token)
                revoked = self._revoke_google_token(access_token)
                
                if revoked:
                    # Eliminar TODOS los registros de OAuth para este usuario
                    # Esto permite un inicio completamente limpio
                    db.query(OAuthConnection).filter_by(
                        user_id=user_id
                    ).delete()
                    cleaned = True
                    db.commit()
                    print(f"✅ Token revocado y registros eliminados para user {user_id}")
            except Exception as e:
                print(f"⚠️ Error al revocar/limpiar: {e}")
                db.rollback()
        
        return {
            "success": True,
            "revoked": revoked,
            "cleaned": cleaned,
            "remaining_services": remaining_active
        }

    # -------------------- Credenciales --------------------

    def get_service_credentials(
        self, user_id: str, service: str, db: Session
    ) -> Credentials:
        """
        Obtiene credenciales de un servicio Google (refresca si expiran).
        
        Si el token se refresca, actualiza TODAS las conexiones activas
        porque todas comparten el mismo token.
        """
        oauth_conn = self.get_user_connection(user_id, service, db)
        if not oauth_conn:
            raise ValueError(f"{service.capitalize()} no conectado. Conecta tu cuenta primero.")

        access_token = encryption.decrypt(oauth_conn.access_token)
        refresh_token = encryption.decrypt(oauth_conn.refresh_token)

        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=oauth_conn.meta_data.get("client_id")
            if oauth_conn.meta_data
            else GOOGLE_CLIENT_ID,
            client_secret=oauth_conn.meta_data.get("client_secret")
            if oauth_conn.meta_data
            else GOOGLE_CLIENT_SECRET,
            scopes=oauth_conn.scopes,
        )

        if oauth_conn.token_expires_at < datetime.utcnow():
            try:
                creds.refresh(Request())
                
                # Actualizar TODAS las conexiones con el token refrescado
                encrypted_access = encryption.encrypt(creds.token)
                encrypted_refresh = encryption.encrypt(creds.refresh_token)
                
                all_connections = db.query(OAuthConnection).filter_by(
                    user_id=user_id,
                    is_active=True
                ).all()
                
                for conn in all_connections:
                    conn.access_token = encrypted_access
                    conn.refresh_token = encrypted_refresh
                    conn.token_expires_at = creds.expiry
                    conn.last_used_at = datetime.utcnow()
                
                db.commit()
            except RefreshError:
                # Si el refresh falla, desactivar TODAS las conexiones
                all_connections = db.query(OAuthConnection).filter_by(
                    user_id=user_id,
                    is_active=True
                ).all()
                
                for conn in all_connections:
                    conn.is_active = False
                
                db.commit()
                raise ValueError(f"Token de Google inválido. Reconecta tus servicios.")
        else:
            oauth_conn.last_used_at = datetime.utcnow()
            db.commit()

        return creds
    
    # -------------------- Reconectar Servicios --------------------
    
    """def reconnect_service(self, user_id: str, service: str, db: Session) -> dict:
        
        Intenta reconectar un servicio sin OAuth si el token sigue válido.
        
        Returns:
            {"reconnected": True} si se reactivó
            {"reconnected": False, "needs_oauth": True} si necesita OAuth
        
    # Buscar registro inactivo
        oauth_conn = db.query(OAuthConnection).filter_by(
            user_id=user_id,
            service=service,
            is_active=False
        ).first()
        
        if not oauth_conn:
            # No existe → Necesita OAuth completo
            return {"reconnected": False, "needs_oauth": True}
        
        # Validación 1: ¿Hay otros servicios activos?
        active_count = db.query(OAuthConnection).filter_by(
            user_id=user_id,
            is_active=True
        ).count()
        
        if active_count == 0:
            # No hay servicios activos → Token probablemente revocado
            return {"reconnected": False, "needs_oauth": True}
        
        # Validación 2: ¿El token expiró?
        if oauth_conn.token_expires_at < datetime.utcnow():
            # Token expirado → Necesita OAuth (aunque se puede refrescar)
            return {"reconnected": False, "needs_oauth": True}
        
        # Validación 3: ¿Tiene todos los scopes necesarios?
        required_scopes = SUPPORTED_SERVICES[service]["scopes"]
        if not all(scope in oauth_conn.scopes for scope in required_scopes):
            # Faltan scopes → Necesita OAuth
            return {"reconnected": False, "needs_oauth": True}
        
        # ✅ Todo OK → Reactivar
        oauth_conn.is_active = True
        db.commit()
        
        return {
            "reconnected": True,
            "message": f"{service.capitalize()} reactivado exitosamente"
        }"""
    
    def reconnect_service(self, user_id: str, service: str, db: Session) -> dict:
        """
        Intenta reactivar un servicio si al menos un token válido sigue activo.
        """

        # Buscar el servicio que queremos reactivar (inactivo)
        oauth_conn = db.query(OAuthConnection).filter_by(
            user_id=user_id,
            service=service,
            is_active=False
        ).first()

        if not oauth_conn:
            return {"reconnected": False, "needs_oauth": True}

        # Verificar si existe algún otro servicio activo
        another_active = db.query(OAuthConnection).filter(
            OAuthConnection.user_id == user_id,
            OAuthConnection.is_active == True,
            OAuthConnection.service != service
        ).first()

        if not another_active:
            # No hay ningún otro activo → token revocado
            return {"reconnected": False, "needs_oauth": True}

        # Si hay otro activo → asumimos que el token sigue válido
        oauth_conn.is_active = True
        db.commit()

        return {
            "reconnected": True,
            "message": f"{service.capitalize()} reactivado automáticamente (token compartido válido)"
        }



# Singleton
oauth_service = OAuthService()