from typing import Dict, Any, Optional
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaFileUpload
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from sqlalchemy.orm import Session
from apps.models.oauth_connection import OAuthConnection
from apps.database import SessionLocal
from datetime import datetime
import io
import base64
import mimetypes
import fitz  # PyMuPDF (para PDF)
import docx
import os
from tools.google_service_base import GoogleServiceBase

# Scopes mínimos para Drive
#SCOPES = ["https://www.googleapis.com/auth/drive"]

class DriveService(GoogleServiceBase):
    def __init__(self):
        super().__init__("drive", api_version="v3")
        
    def _ping_service(self, service):
        about_info = service.about().get(fields="user, storageQuota").execute()
        print("ℹ️ Ping Drive ejecutado correctamente. Usuario:", about_info.get("user", {}))


drive = DriveService()

# ---------------------------------------------
# 🔐 Obtener servicio autenticado
# ---------------------------------------------
"""def get_drive_service(user_id: str):
    db = SessionLocal()
    try:
        oauth_conn = db.query(OAuthConnection).filter_by(
            user_id=user_id,
            service='drive',
            is_active=True
        ).first()

        if not oauth_conn:
            raise ValueError("Drive no conectado. Conecta tu cuenta de Google Drive primero.")

        access_token = oauth_conn.get_access_token()
        refresh_token = oauth_conn.get_refresh_token()

        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=oauth_conn.meta_data.get('client_id'),
            client_secret=oauth_conn.meta_data.get('client_secret'),
            scopes=oauth_conn.scopes
        )

        if oauth_conn.token_expires_at < datetime.utcnow():
            creds.refresh(Request())
            oauth_conn.set_tokens(creds.token, creds.refresh_token)
            oauth_conn.token_expires_at = creds.expiry
            db.commit()

        oauth_conn.last_used_at = datetime.utcnow()
        db.commit()

        return build("drive", "v3", credentials=creds)

    except RefreshError:
        oauth_conn.is_active = False
        db.commit()
        raise ValueError("Token de Google Drive expirado o revocado.")
    finally:
        db.close()"""



# ---------------------------------------------
# 📂 Listar archivos
# ---------------------------------------------
"""def list_files(user_id: str, query: Optional[str] = None, page_size: int = 10, **kwargs) -> Dict[str, Any]:
    try:
        service = drive.get_service(user_id)
        results = service.files().list(
            q=query,
            pageSize=page_size,
            fields="files(id, name, mimeType, modifiedTime, size)"
        ).execute()

        files = results.get("files", [])
        if not files:
            return {"success": True, "files": [], "message": "📂 No se encontraron archivos en tu Drive."}

        msg = "📄 **Archivos en tu Drive:**\n\n"
        for i, f in enumerate(files, 1):
            size_kb = int(f.get('size', 0)) / 1024 if f.get('size') else 0
            msg += f"{i}. **{f['name']}** ({f['mimeType']}) — {size_kb:.1f} KB\n"

        return {"success": True, "files": files, "message": msg}

    except Exception as e:
        return {"success": False, "error": str(e), "message": f"❌ Error listando archivos: {str(e)}"}"""

def list_files(user_id: str, query: Optional[str] = None, max_results: int = 10, **kwargs):
    """Lista archivos en Google Drive del usuario"""
    try:
        service = drive.get_service(user_id)

        # Si la query no contiene operadores Drive, la convertimos automáticamente
        if query and not any(op in query for op in ["name =", "name contains", "mimeType", "in owners"]):
            query = f"name contains '{query}'"

        results = service.files().list(
            q=query,
            pageSize=max_results,
            fields="files(id, name, mimeType, modifiedTime, size)"
        ).execute()

        files = results.get("files", [])
        if not files:
            return {
                "success": True,
                "files": [],
                "message": "📂 **No se encontraron archivos**\n\nNo hay archivos que coincidan con tu búsqueda."
            }

        detailed_files = []
        user_message = f"📄 **Se encontraron {len(files)} archivos:**\n\n"

        for i, f in enumerate(files, 1):
            user_message += f"**{i}. {f['name']}**\n"
            user_message += f"   📁 **Tipo:** {f.get('mimeType', 'Desconocido')}\n"
            user_message += f"   🆔 **ID:** `{f['id']}`\n"
            user_message += f"   📅 **Modificado:** {f.get('modifiedTime', 'N/A')[:25]}...\n\n"

            detailed_files.append({
                "id": f["id"],
                "name": f["name"],
                "mimeType": f.get("mimeType"),
                "modifiedTime": f.get("modifiedTime"),
                "size": f.get("size")
            })

        return {
            "success": True,
            "files": detailed_files,  # 💡 Igual que "messages" en Gmail
            "raw_files": files,
            "message": user_message
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ **Error listando archivos**\n\n🚫 **Error:** {str(e)}"
        }



# ---------------------------------------------
# 📖 Leer contenido de un archivo
# ---------------------------------------------


def read_file(user_id: str, file_id: str, **kwargs):
    """
    Lee el contenido completo de un archivo en Google Drive (PDF, DOCX, TXT, etc.).
    Retorna en formato estandarizado compatible con el orquestador.
    """
    try:
        service = drive.get_service(user_id)
        
        # Si el argumento parece un nombre en lugar de un ID, buscarlo
        if len(file_id) < 20 and not any(c in file_id for c in "-_"):
            print(f"🔍 Buscando archivo por nombre: {file_id}")
            query = f"name contains '{file_id}' and trashed = false"
            results = service.files().list(
                q=query,
                pageSize=1,
                fields="files(id, name, mimeType)"
            ).execute()
            files = results.get("files", [])
            if not files:
                return {"success": False, "message": f"❌ No se encontró ningún archivo con nombre '{file_id}'."}
            file_id = files[0]["id"]
            print(f"✅ Archivo encontrado: {files[0]['name']} → ID: {file_id}")
        
        # Obtener metadatos
        file = service.files().get(fileId=file_id, fields="name, mimeType").execute()
        file_name = file["name"]
        mime_type = file["mimeType"]
        
        # Descargar contenido binario
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        fh.seek(0)
        
        # Procesar texto según tipo MIME
        content = ""
        if mime_type == "application/pdf":
            import fitz
            with fitz.open(stream=fh, filetype="pdf") as doc:
                content = "\n".join(page.get_text("text") for page in doc)
        elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            from docx import Document
            doc = Document(fh)
            content = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        else:
            content = fh.read().decode(errors="ignore")
        
        # Configuración de preview (similar a Gmail)
        preview_length = kwargs.get('preview_length', 500)
        show_full = kwargs.get('show_full', False)
        
        # Mensaje formateado para el usuario
        user_message = f"📄 **Archivo leído exitosamente**\n\n"
        user_message += f"📝 **Nombre:** {file_name}\n"
        user_message += f"📋 **Tipo:** {mime_type}\n"
        user_message += f"📊 **Tamaño:** {len(content)} caracteres\n"
        user_message += f"🆔 **ID:** `{file_id}`\n\n"
        
        if show_full or len(content) <= preview_length:
            user_message += f"📄 **Contenido:**\n```\n{content}\n```"
        else:
            user_message += f"📄 **Contenido:**\n```\n{content[:preview_length]}...\n```\n\n*(Vista previa truncada)*"
        
        # Retorno estandarizado (mismo formato que Gmail)
        return {
            "success": True,
            "file_id": file_id,
            "file_name": file_name,
            "mime_type": mime_type,
            "content": content,  # ✅ Contenido completo en primer nivel
            "content_length": len(content),
            "content_preview": content[:preview_length] if len(content) > preview_length else content,
            "message": user_message
        }
       
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"❌ **Error leyendo archivo**\n\n🆔 **ID:** `{file_id}`\n🚫 **Error:** {str(e)}"
        }


# ---------------------------------------------
# ⬆️ Subir archivo
# ---------------------------------------------
def upload_file(user_id: str, file_path: str, mime_type: Optional[str] = None, **kwargs) -> Dict[str, Any]:
    try:
        service = drive.get_service(user_id)
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(file_path)

        file_metadata = {"name": os.path.basename(file_path)}
        media = MediaFileUpload(file_path, mimetype=mime_type)
        uploaded = service.files().create(body=file_metadata, media_body=media, fields="id, name").execute()

        return {
            "success": True,
            "file_id": uploaded["id"],
            "file_name": uploaded["name"],
            "message": f"✅ Archivo **{uploaded['name']}** subido exitosamente a Google Drive."
        }

    except Exception as e:
        return {"success": False, "error": str(e), "message": f"❌ Error subiendo archivo: {str(e)}"}


# ---------------------------------------------
# 🗑️ Eliminar archivo
# ---------------------------------------------
def delete_file(user_id: str, file_id: str, **kwargs) -> Dict[str, Any]:
    try:
        service = drive.get_service(user_id)
        service.files().delete(fileId=file_id).execute()
        return {"success": True, "message": "🗑️ Archivo eliminado correctamente."}
    except Exception as e:
        return {"success": False, "error": str(e), "message": f"❌ Error eliminando archivo: {str(e)}"}


# ---------------------------------------------
# 🔍 Probar conexión
# ---------------------------------------------
def test_connection(user_id: str, **kwargs) -> Dict[str, Any]:
    connect_service = drive.test_connection(user_id)
    return  connect_service 


# ---------------------------------------------
# 🧩 Auxiliares para lectura de texto
# ---------------------------------------------
def _extract_text_from_pdf(fh: io.BytesIO) -> str:
    text = ""
    with fitz.open(stream=fh.read(), filetype="pdf") as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text.strip()


def _extract_text_from_docx(fh: io.BytesIO) -> str:
    text = ""
    with open("temp.docx", "wb") as f:
        f.write(fh.read())
    doc = docx.Document("temp.docx")
    for para in doc.paragraphs:
        text += para.text + "\n"
    os.remove("temp.docx")
    return text.strip()


# ---------------------------------------------
# 📚 Registro para el agente
# ---------------------------------------------
DRIVE_TOOL_METHODS = {
    "list_files": {"func": list_files, "description": "Listar archivos en Google Drive del usuario."},
    "read_file": {"func": read_file, "description": "Leer y devolver el contenido textual de un archivo de Google Drive (PDF, DOCX, TXT, etc.)."},
    "upload_file": {"func": upload_file, "description": "Subir un archivo local o generado por el agente a Google Drive."},
    "delete_file": {"func": delete_file, "description": "Eliminar un archivo del Drive del usuario."},
    "test_connection": {"func": test_connection, "description": "Probar si la conexión a Google Drive está activa y autenticada."}
}
