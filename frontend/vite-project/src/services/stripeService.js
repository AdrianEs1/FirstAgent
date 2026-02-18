import api from './api';

/**
 * Obtener información de suscripción del usuario
 */
export const fetchSubscriptionInfo = async () => {
  try {
    const response = await api.get('/api/payments/subscription');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Crear sesión de checkout para upgrade a Pro
 */
export const fetchCreateCheckoutSession = async () => {
  try {
    const response = await api.post('/api/payments/create-checkout-session');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Crear sesión del portal de Stripe para gestionar suscripción
 */
export const fetchCreatePortalSession = async () => {
  try {
    const response = await api.post('/api/payments/create-portal-session');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener resumen completo de suscripción y uso
 */
export const fetchSubscriptionSummary = async () => {
  try {
    const response = await api.get('/api/payments/subscription/summary');
    return response.data;
  } catch (error) {
    throw error;
  }
};
