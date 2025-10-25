from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from googleapiclient.discovery import build
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from apps.models.oauth_connection import OAuthConnection
from apps.core.encryption import encryption
import os
import secrets

# Configuración de Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
]


class OAuthService:
    
    def create_google_flow(self, redirect_uri: str = None):
        """Crea el flujo OAuth de Google"""
        client_config = {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri or GOOGLE_REDIRECT_URI]
            }
        }
        
        flow = Flow.from_client_config(
            client_config,
            scopes=GMAIL_SCOPES,
            redirect_uri=redirect_uri or GOOGLE_REDIRECT_URI
        )
        
        return flow
    
    def generate_authorization_url(self, user_id: str) -> tuple:
        """
        Genera la URL de autorización de Google OAuth
        
        Returns:
            tuple: (authorization_url, state)
        """
        flow = self.create_google_flow()
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',  # Para obtener refresh_token
            prompt='consent',       # Forzar pantalla de consentimiento
            include_granted_scopes='true',
            state=f"{user_id}:{secrets.token_urlsafe(32)}"  # user_id + random state
        )
        
        return authorization_url, state
    
    def handle_callback(
        self, 
        code: str, 
        state: str, 
        user_id: str, 
        db: Session
    ) -> OAuthConnection:
        """
        Maneja el callback de OAuth y guarda los tokens
        
        Args:
            code: Código de autorización de Google
            state: State para validación CSRF
            user_id: ID del usuario
            db: Sesión de base de datos
            
        Returns:
            OAuthConnection creada o actualizada
        """
        # Validar state
        if not state.startswith(user_id):
            raise ValueError("State inválido - posible ataque CSRF")
        
        # Intercambiar código por tokens
        flow = self.create_google_flow()
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Obtener info del usuario de Gmail
        gmail_service = build('gmail', 'v1', credentials=credentials)
        profile = gmail_service.users().getProfile(userId='me').execute()
        gmail_email = profile['emailAddress']
        
        # Buscar si ya existe conexión
        oauth_conn = db.query(OAuthConnection).filter_by(
            user_id=user_id,
            service='gmail'
        ).first()
        
        if oauth_conn:
            # Actualizar conexión existente
            oauth_conn.access_token = encryption.encrypt(credentials.token)
            oauth_conn.refresh_token = encryption.encrypt(credentials.refresh_token)
            oauth_conn.token_expires_at = credentials.expiry
            oauth_conn.scopes = GMAIL_SCOPES
            oauth_conn.service_user_id = profile.get('emailAddress')
            oauth_conn.is_active = True
            oauth_conn.meta_data = {
                'email': gmail_email,
                'client_id': GOOGLE_CLIENT_ID,
                'client_secret': GOOGLE_CLIENT_SECRET
            }
            oauth_conn.connected_at = datetime.utcnow()
        else:
            # Crear nueva conexión
            oauth_conn = OAuthConnection(
                user_id=user_id,
                service='gmail',
                access_token=encryption.encrypt(credentials.token),
                refresh_token=encryption.encrypt(credentials.refresh_token),
                token_expires_at=credentials.expiry,
                scopes=GMAIL_SCOPES,
                service_user_id=gmail_email,
                is_active=True,
                meta_data={
                    'email': gmail_email,
                    'client_id': GOOGLE_CLIENT_ID,
                    'client_secret': GOOGLE_CLIENT_SECRET
                }
            )
            db.add(oauth_conn)
        
        db.commit()
        db.refresh(oauth_conn)
        
        return oauth_conn
    
    def get_user_connection(self, user_id: str, service: str, db: Session) -> OAuthConnection:
        """Obtiene la conexión OAuth del usuario"""
        return db.query(OAuthConnection).filter_by(
            user_id=user_id,
            service=service,
            is_active=True
        ).first()
    
    def disconnect_service(self, user_id: str, service: str, db: Session) -> bool:
        """Desconecta un servicio OAuth"""
        oauth_conn = self.get_user_connection(user_id, service, db)
        
        if not oauth_conn:
            return False
        
        oauth_conn.is_active = False
        db.commit()
        
        return True
    
    def get_gmail_credentials(self, user_id: str, db: Session) -> Credentials:
        """
        Obtiene credenciales de Gmail del usuario, refrescando si es necesario
        
        Args:
            user_id: ID del usuario
            db: Sesión de BD
            
        Returns:
            Credentials de Google
        """
        oauth_conn = self.get_user_connection(user_id, 'gmail', db)
        
        if not oauth_conn:
            raise ValueError("Gmail no conectado. Conecta tu cuenta primero.")
        
        # Desencriptar tokens
        access_token = encryption.decrypt(oauth_conn.access_token)
        refresh_token = encryption.decrypt(oauth_conn.refresh_token)
        
        # Crear credenciales
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=oauth_conn.meta_data.get('client_id') if oauth_conn.meta_data else GOOGLE_CLIENT_ID,
            client_secret=oauth_conn.meta_data.get('client_secret') if oauth_conn.meta_data else GOOGLE_CLIENT_SECRET,
            scopes=oauth_conn.scopes
        )
        
        # Refrescar si está expirado
        if oauth_conn.token_expires_at < datetime.utcnow():
            try:
                creds.refresh(Request())
                
                # Actualizar en BD
                oauth_conn.access_token = encryption.encrypt(creds.token)
                oauth_conn.refresh_token = encryption.encrypt(creds.refresh_token)
                oauth_conn.token_expires_at = creds.expiry
                oauth_conn.last_used_at = datetime.utcnow()
                db.commit()
                
            except RefreshError:
                # Token inválido
                oauth_conn.is_active = False
                db.commit()
                raise ValueError("Token de Gmail inválido. Reconecta tu cuenta.")
        else:
            # Actualizar última vez usado
            oauth_conn.last_used_at = datetime.utcnow()
            db.commit()
        
        return creds


# Singleton
oauth_service = OAuthService()