from datetime import datetime
from typing import Optional, Dict, Any

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError

from sqlalchemy.orm import Session
from apps.database import SessionLocal
from apps.models.oauth_connection import OAuthConnection
from abc import ABC, abstractmethod


class GoogleServiceBase(ABC):
    """
    Clase base genérica para manejar la conexión con cualquier servicio de Google
    (Gmail, Drive, Calendar, etc.) usando OAuth2.
    """

    DEFAULT_API_VERSION = "v1"

    def __init__(self, service_name: str, api_version: Optional[str] = None):
        self.service_name = service_name.lower()
        self.api_version = api_version or self.DEFAULT_API_VERSION

    # -------------------------------------------------------------------------
    # MÉTODOS PRINCIPALES
    # -------------------------------------------------------------------------
    def get_service(self, user_id: str):
        """
        Obtiene un cliente autenticado para el servicio de Google.
        Se encarga de recuperar credenciales, refrescar tokens y construir el cliente.
        """
        db = SessionLocal()
        try:
            oauth_conn = self._get_active_connection(db, user_id)
            creds = self._build_credentials(oauth_conn)

            # Refrescar token si expiró
            if self._is_token_expired(oauth_conn):
                creds = self._refresh_credentials(db, oauth_conn, creds)

            # Actualizar última vez usado
            oauth_conn.last_used_at = datetime.utcnow()
            db.commit()

            # Construir y devolver el cliente del servicio
            return build(self.service_name, self.api_version, credentials=creds)

        finally:
            db.close()

    def test_connection(self, user_id: str) -> Dict[str, Any]:
        try:
            print(f"🚀 Probando conexión con servicio: {self.service_name}")
            service = self.get_service(user_id)
            print(f"🔗 Cliente {self.service_name} construido correctamente: {service}")

            self._ping_service(service)
            print(f"✅ _ping_service ejecutado sin errores para {self.service_name}")

            return {
                "success": True,
                "message": f"✅ Conexión exitosa con {self.service_name.title()} API"
            }

        except Exception as e:
            print(f"❌ Error en test_connection({self.service_name}): {e}")
            return {
                "success": False,
                "error": str(e),
                "message": f"❌ **Error de conexión con {self.service_name.title()}**\n🚫 {str(e)}"
            }


    # -------------------------------------------------------------------------
    # MÉTODOS AUXILIARES PRIVADOS
    # -------------------------------------------------------------------------
    def _get_active_connection(self, db: Session, user_id: str) -> OAuthConnection:
        """
        Recupera la conexión activa de OAuth para el usuario y servicio.
        """
        oauth_conn = (
            db.query(OAuthConnection)
            .filter_by(user_id=user_id, service=self.service_name, is_active=True)
            .first()
        )

        if not oauth_conn:
            # Intentar por service_user_id (sub de Google)
            oauth_conn = (
                db.query(OAuthConnection)
                .filter_by(service_user_id=user_id, service=self.service_name, is_active=True)
                .first()
            )

        if not oauth_conn:
            raise ValueError(
                f"No se encontró conexión activa para {self.service_name}. "
                f"El usuario debe autorizar el acceso primero."
            )

        return oauth_conn

    def _build_credentials(self, oauth_conn: OAuthConnection) -> Credentials:
        """
        Crea el objeto Credentials a partir de los tokens guardados en BD.
        """
        return Credentials(
            token=oauth_conn.get_access_token(),
            refresh_token=oauth_conn.get_refresh_token(),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=oauth_conn.meta_data.get("client_id") if oauth_conn.meta_data else None,
            client_secret=oauth_conn.meta_data.get("client_secret") if oauth_conn.meta_data else None,
            scopes=oauth_conn.scopes,
        )

    def _is_token_expired(self, oauth_conn: OAuthConnection) -> bool:
        """
        Verifica si el token de acceso ha expirado.
        """
        return oauth_conn.token_expires_at and oauth_conn.token_expires_at < datetime.utcnow()

    def _refresh_credentials(
        self, db: Session, oauth_conn: OAuthConnection, creds: Credentials
    ) -> Credentials:
        """
        Refresca las credenciales de acceso cuando el token expira.
        """
        try:
            print(f"🔄 Refrescando token para servicio {self.service_name}...")
            creds.refresh(Request())

            oauth_conn.set_tokens(creds.token, creds.refresh_token)
            oauth_conn.token_expires_at = creds.expiry
            oauth_conn.last_used_at = datetime.utcnow()
            db.commit()
            return creds

        except RefreshError as e:
            oauth_conn.is_active = False
            db.commit()
            raise ValueError(
                f"Token de {self.service_name.title()} inválido o revocado. "
                f"Reconecta tu cuenta. Detalle: {str(e)}"
            )
        

    @abstractmethod
    def _ping_service(self, service):
        """
        Método que debe implementar cada servicio de Google.
        Realiza una llamada mínima a la API para verificar autenticación.
        Ejemplo: Gmail puede listar etiquetas, Drive puede pedir 'about', etc.
        """
        pass

