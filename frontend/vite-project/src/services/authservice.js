// authService.js
import { refreshAccessToken } from './api';

export async function getValidAccessToken() {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error("No hay token");
  }

  // Opcional: decodificar exp del JWT
  const payload = JSON.parse(atob(token.split('.')[1]));
  const isExpired = payload.exp * 1000 < Date.now();

  if (!isExpired) {
    return token;
  }

  // 🔄 refresh
  const { token: newToken } = await refreshAccessToken();
  return newToken;
}
