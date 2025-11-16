import axios from "axios";


//http://localhost:5000/ En LOCAL 
//https://adrianarchitecia-optimusagent.hf.space En Producción

// Crear instancia de axios con configuración correcta
const api = axios.create({
  baseURL: "https://adrianarchitecia-optimusagent.hf.space/", // 👈 Pon aquí tu URL de Hugging Face
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true  // 👈 Cambia a false para Hugging Face (no necesitas cookies cross-origin)
});




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
    console.error("Error al renovar el token:", error);
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

    if (error.response && error.response.status === 401) {
      // 1. Si es refresh que falló, limpiar y redirigir
      if (originalRequest.url.includes("/api/auth/refresh")) {
        console.error("Refresh token inválido o expirado. Redirigiendo a login.");
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 2. Manejar múltiples requests 401 simultáneos
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // 3. Si no se ha intentado aún
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          console.log('🔄 Intentando refresh token...');
          const response = await refreshAccessToken();
          
          // Actualizar headers por defecto
          api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
          
          // Procesar cola de requests fallidos
          processQueue(null, response.token);
          
          // Reintentar request original
          originalRequest.headers['Authorization'] = `Bearer ${response.token}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          console.error("No se pudo renovar el token", refreshError);
          
          // Procesar cola con error
          processQueue(refreshError, null);
          
          // Limpiar y redirigir
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { refreshAccessToken };