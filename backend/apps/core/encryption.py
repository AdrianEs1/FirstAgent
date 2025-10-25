from cryptography.fernet import Fernet
from config import ENCRYPTION_KEY

class TokenEncryption:
    def __init__(self):
        key = ENCRYPTION_KEY
        if not key:
            raise ValueError("ENCRYPTION_KEY no está configurada en .env")
        self.cipher = Fernet(key.encode())
    
    def encrypt(self, token: str) -> str:
        """Encripta un token"""
        if not token:
            raise ValueError("Token no puede estar vacío")
        return self.cipher.encrypt(token.encode()).decode()
    
    def decrypt(self, encrypted_token: str) -> str:
        """Desencripta un token"""
        if not encrypted_token:
            raise ValueError("Token encriptado no puede estar vacío")
        return self.cipher.decrypt(encrypted_token.encode()).decode()

# Singleton
encryption = TokenEncryption()