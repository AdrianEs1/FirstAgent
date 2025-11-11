from typing import Dict, Any
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import re
import html
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from sqlalchemy.orm import Session
from apps.models.oauth_connection import OAuthConnection
from apps.database import SessionLocal
from datetime import datetime, timedelta
from tools.google_service_base import GoogleServiceBase


#SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

class GmailService(GoogleServiceBase):
    def __init__(self):
        super().__init__("gmail")
    
    def _ping_service(self, service):
        # Gmail: obtener etiquetas como prueba de conexión
        service.users().labels().list(userId="me").execute()

gmail = GmailService()

"""def get_gmail_service(user_id: str):
    
    Obtiene el servicio de Gmail usando los tokens del usuario desde la BD.
    Puede recibir tanto el ID interno (user_id) como el ID de Google (service_user_id).
    
    db = SessionLocal()
    try:
        # Buscar primero por user_id (UUID de tu sistema)
        oauth_conn = db.query(OAuthConnection).filter_by(
            user_id=user_id,
            service='gmail',
            is_active=True
        ).first()

        # Si no se encontró, buscar por service_user_id (sub de Google)
        if not oauth_conn:
            oauth_conn = db.query(OAuthConnection).filter_by(
                service_user_id=user_id,
                service='gmail',
                is_active=True
            ).first()

        if not oauth_conn:
            raise ValueError("Gmail no conectado. El usuario debe conectar su cuenta de Gmail primero.")

        # Desencriptar tokens
        access_token = oauth_conn.get_access_token()
        refresh_token = oauth_conn.get_refresh_token()

        # Crear credenciales
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=oauth_conn.meta_data.get('client_id') if oauth_conn.meta_data else None,
            client_secret=oauth_conn.meta_data.get('client_secret') if oauth_conn.meta_data else None,
            scopes=oauth_conn.scopes
        )

        # Refrescar si el token expiró
        if oauth_conn.token_expires_at < datetime.utcnow():
            try:
                print(f"🔄 Refrescando token para usuario {user_id}...")
                creds.refresh(Request())

                # Actualizar tokens en BD
                oauth_conn.set_tokens(creds.token, creds.refresh_token)
                oauth_conn.token_expires_at = creds.expiry
                oauth_conn.last_used_at = datetime.utcnow()
                db.commit()

            except RefreshError as e:
                oauth_conn.is_active = False
                db.commit()
                raise ValueError(f"Token de Gmail inválido o revocado. Reconecta tu cuenta. Error: {str(e)}")
        else:
            # Actualizar última vez usado
            oauth_conn.last_used_at = datetime.utcnow()
            db.commit()

        # Construir servicio Gmail
        service = build("gmail", "v1", credentials=creds)
        return service

    finally:
        db.close()"""



def send_email(user_id: str, to: str, subject: str, body: str, **kwargs) -> Dict[str, Any]:
    """
    Envía un email usando Gmail API
    
    Args:
        user_id: UUID del usuario
        to: Email destinatario
        subject: Asunto del email
        body: Contenido del email
    """
    try:
        service = gmail.get_service(user_id)
       
        message = MIMEMultipart()
        message['to'] = to
        message['subject'] = subject
       
        is_html = (
            '<html>' in body.lower() or '<body>' in body.lower() or
            '<p>' in body.lower() or '<div>' in body.lower() or
            '<h1>' in body.lower() or '<h2>' in body.lower() or
            '<br>' in body.lower() or '</html>' in body.lower()
        )
       
        content_type = kwargs.get('content_type', 'auto')
       
        if content_type == 'text/html' or (content_type == 'auto' and is_html):
            msg = MIMEText(body, 'html', 'utf-8')
        else:
            msg = MIMEText(body, 'plain', 'utf-8')
       
        message.attach(msg)
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        email_message = {'raw': raw_message}
       
        sent_message = service.users().messages().send(
            userId="me",
            body=email_message
        ).execute()
       
        return {
            "success": True,
            "id": sent_message["id"],
            "to": to,
            "subject": subject,
            "message": f"✅ **Email enviado exitosamente**\n\n📧 **Para:** {to}\n📝 **Asunto:** {subject}\n🕐 **Estado:** Entregado correctamente"
        }
       
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ **Error enviando email**\n\n📧 **Destinatario:** {to}\n📝 **Asunto:** {subject}\n🚫 **Error:** {str(e)}"
        }


def list_emails(user_id: str, query: str = "inbox", max_results: int = 5, **kwargs) -> Dict[str, Any]:
    """Lista emails del usuario"""
    try:
        service = gmail.get_service(user_id)
        results = service.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
        messages = results.get("messages", [])
        
        if not messages:
            return {
                "success": True,
                "messages": [],
                "message": "📧 **No se encontraron emails**\n\nNo hay emails que coincidan con tu búsqueda."
            }
        
        detailed_messages = []
        user_message = f"📧 **Encontrados {len(messages)} emails:**\n\n"
        
        for i, msg in enumerate(messages, 1):
            try:
                msg_details = service.users().messages().get(
                    userId="me", 
                    id=msg['id'], 
                    format="metadata",
                    metadataHeaders=['Subject', 'From', 'Date']
                ).execute()
                
                headers = msg_details.get('payload', {}).get('headers', [])
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'Sin asunto')
                from_email = next((h['value'] for h in headers if h['name'] == 'From'), 'Desconocido')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Fecha desconocida')
                from_clean = from_email.split('<')[0].strip().strip('"') if '<' in from_email else from_email
                
                user_message += f"**{i}. {subject}**\n"
                user_message += f"   📤 **De:** {from_clean}\n"
                user_message += f"   📅 **Fecha:** {date[:25]}...\n"
                user_message += f"   🆔 **ID:** `{msg['id']}`\n\n"
                
                detailed_messages.append({
                    "id": msg['id'],
                    "subject": subject,
                    "from": from_clean,
                    "date": date,
                    "snippet": msg_details.get('snippet', '')
                })
                
            except Exception as e:
                user_message += f"**{i}. Error obteniendo email**\n   🚫 **Error:** {str(e)}\n\n"
        
        return {
            "success": True,
            "messages": detailed_messages,
            "raw_messages": messages,
            "message": user_message
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ **Error listando emails**\n\n🚫 **Error:** {str(e)}"
        }


def read_email(user_id: str, message_id: str, **kwargs) -> Dict[str, Any]:
    """Lee un email específico"""
    try:
        service = gmail.get_service(user_id)
        msg = service.users().messages().get(userId="me", id=message_id, format="full").execute()
       
        headers = msg.get('payload', {}).get('headers', [])
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'Sin asunto')
        from_email = next((h['value'] for h in headers if h['name'] == 'From'), 'Desconocido')
        to_email = next((h['value'] for h in headers if h['name'] == 'To'), 'Desconocido')
        date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Fecha desconocida')
        from_clean = from_email.split('<')[0].strip().strip('"') if '<' in from_email else from_email
        
        body = extract_message_body(msg.get('payload', {}))
        preview_length = kwargs.get('preview_length', 500)
        show_full = kwargs.get('show_full', False)
        
        user_message = f"📧 **Email leído exitosamente**\n\n"
        user_message += f"📝 **Asunto:** {subject}\n"
        user_message += f"📤 **De:** {from_clean}\n"
        user_message += f"📥 **Para:** {to_email}\n"
        user_message += f"📅 **Fecha:** {date}\n"
        user_message += f"🆔 **ID:** `{message_id}`\n\n"
        
        if show_full or len(body) <= preview_length:
            user_message += f"📄 **Contenido:**\n```\n{body}\n```"
        else:
            user_message += f"📄 **Contenido:**\n```\n{body[:preview_length]}...\n```\n\n*(Vista previa truncada)*"
       
        return {
            "success": True,
            "message_id": message_id,
            "subject": subject,
            "from": from_clean,
            "to": to_email,
            "date": date,
            "body": body,
            "body_length": len(body),
            "body_preview": body[:preview_length] if len(body) > preview_length else body,
            "raw_message": msg,
            "message": user_message
        }
       
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ **Error leyendo email**\n\n🆔 **ID:** `{message_id}`\n🚫 **Error:** {str(e)}"
        }


def test_connection(user_id: str, **kwargs) -> Dict[str, Any]:
    connect_service = gmail.test_connection(user_id)
    return  connect_service 


# Funciones auxiliares sin cambios
def extract_message_body(payload) -> str:
    """Extrae el cuerpo del mensaje desde el payload de Gmail"""
    body_parts = []
    
    def extract_parts(payload_part):
        if 'parts' in payload_part:
            for part in payload_part['parts']:
                extract_parts(part)
        else:
            mime_type = payload_part.get('mimeType', '')
            if mime_type in ['text/plain', 'text/html']:
                body_data = payload_part.get('body', {}).get('data')
                if body_data:
                    try:
                        decoded_body = base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')
                        if mime_type == 'text/html':
                            decoded_body = html_to_text(decoded_body)
                        if decoded_body.strip():
                            body_parts.append(decoded_body.strip())
                    except Exception as e:
                        print(f"Error decodificando parte: {e}")
    
    extract_parts(payload)
    full_body = '\n\n'.join(body_parts)
    
    if not full_body and payload.get('body', {}).get('data'):
        try:
            data = payload['body']['data']
            full_body = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
            if payload.get('mimeType') == 'text/html':
                full_body = html_to_text(full_body)
        except Exception as e:
            print(f"Error decodificando mensaje principal: {e}")
    
    return full_body.strip()


def html_to_text(html_content: str) -> str:
    """Convierte HTML a texto plano"""
    if not html_content:
        return ""
    
    html_content = html_content.replace('<br>', '\n').replace('<br/>', '\n').replace('<br />', '\n')
    html_content = html_content.replace('</p>', '\n\n').replace('</div>', '\n')
    html_content = html_content.replace('</h1>', '\n').replace('</h2>', '\n').replace('</h3>', '\n')
    html_content = html_content.replace('</li>', '\n')
    
    link_pattern = r'<a[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>'
    html_content = re.sub(link_pattern, r'\2 (\1)', html_content, flags=re.IGNORECASE)
    
    clean = re.compile('<.*?>')
    text = re.sub(clean, '', html_content)
    text = html.unescape(text)
    
    lines = [line.strip() for line in text.split('\n')]
    final_lines = []
    empty_count = 0
    
    for line in lines:
        if line == '':
            empty_count += 1
            if empty_count <= 1:
                final_lines.append(line)
        else:
            empty_count = 0
            final_lines.append(line)
    
    return '\n'.join(final_lines).strip()


GMAIL_TOOL_METHODS = {
    "send_email": {"func": send_email, "description": "Enviar email con Gmail API"},
    "list_emails": {"func": list_emails, "description": "Listar emails de Gmail"},
    "read_email": {"func": read_email, "description": "Leer contenido de un email"},
    "test_connection": {"func": test_connection, "description": "Probar conexión con Gmail API"},
}