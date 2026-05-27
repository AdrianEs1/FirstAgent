import axios from "axios";


//http://localhost:5000/ En LOCAL 
//
const VITE_API_URL= import.meta.env.VITE_API_URL
// Crear instancia de axios con configuración correcta
const api = axios.create({
  baseURL: VITE_API_URL, // 👈 
  withCredentials: true  // 👈 cross-origin)
});

const apipublic = axios.create({
  baseURL:VITE_API_URL,
  withCredentials: true 
});

const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];



// Request interceptor
api.interceptors.request.use(config => {
  // Solo agregar Authorization si NO es refresh (correcto)
  if (!config.url.includes('/api/auth/refresh')) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});

// Función para renovar el access_token usando /refresh
const refreshAccessToken = async () => {
  try {
    const response = await api.post("/api/auth/refresh");  // ✅ Simplificado
    
    const newAccessToken = response.data.access_token;
    const usuario = response.data.user;
    localStorage.setItem('token', newAccessToken);
    return { token: newAccessToken, usuario }; // ✅ Devuelve un objeto
  } catch (error) {
    console.error("Error al renovar el token:", error?.response?.data?.detail);
    throw error;
  }
};

// Variables para evitar múltiples refresh simultáneos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor mejorado
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // ⛔ No hacer nada si:
    // - no hay response
    // - no es 401
    // - es una ruta pública (login, register, etc.)
    if (
      !error.response ||
      error.response.status !== 401 ||
      PUBLIC_ROUTES.some(route => originalRequest.url.includes(route))
    ) {
      return Promise.reject(error);
    }

    // ⛔ Si el refresh falló, limpiar sesión
    if (originalRequest.url.includes("/api/auth/refresh")) {
      console.error("❌ Refresh token inválido");
      localStorage.removeItem("token");
      window.location.href = "/";
      return Promise.reject(error);
    }

    // 🔁 Manejar múltiples requests 401 al mismo tiempo
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    // 🔄 Primer intento de refresh
    if (!originalRequest._retry) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Intentando refresh token...");
        const { token } = await refreshAccessToken();

        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        processQueue(null, token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ No se pudo renovar el token", refreshError);

        processQueue(refreshError, null);
        localStorage.removeItem("token");
        delete api.defaults.headers.common.Authorization;
        window.location.href = "/";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export default api;
//export apipublic;
export { apipublic, refreshAccessToken };