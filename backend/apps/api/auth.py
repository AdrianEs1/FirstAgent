from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.orm import Session
from apps.core.dependencies import get_db, get_current_user
from apps.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    decode_token,COOKIE_SECURE
)
from apps.schemas.auth import UserRegister, UserLogin, Token, TokenRefresh, UserResponse
from apps.models.user import User
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Registrar nuevo usuario
    """
    # Verificar si el email ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear usuario
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        is_active=True,
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login")
async def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Login de usuario"""
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Crear tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # ✅ Guardar refresh_token en HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,  # No accesible desde JavaScript
        secure=COOKIE_SECURE,    # Solo HTTPS en producción
        samesite="lax", # Protección CSRF
        max_age=7 * 24 * 60 * 60  # 7 días en segundos
    )
    
    # Solo devolver access_token en el body
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: str = Cookie(None),  # Leer desde cookie
    db: Session = Depends(get_db)
):
    """Refrescar access token"""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no encontrado"
        )
    
    payload = decode_token(refresh_token)
    
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo"
        )
    
    # Crear nuevos tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Actualizar cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    """Logout - eliminar refresh token"""
    response.delete_cookie(key="refresh_token")
    return {"message": "Logout exitoso"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Obtener información del usuario actual
    """
    return current_user