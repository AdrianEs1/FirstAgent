/**
 * useSSE.js
 * Hook personalizado para manejar SSE en componentes React.
 * Reemplaza useWebSocket.js — API idéntica, cero WebSocket.
 *
 * Cambios vs useWebSocket:
 *  - No hay estado "isConnected" persistente; cada sendMessage abre su propio stream
 *  - isSending reemplaza isConnected como indicador de actividad
 *  - sendMessage es async y lanza el stream por sí solo
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { sseService } from '../services/sseService';

export function useSSE() {
  const [isSending, setIsSending]       = useState(false);   // stream activo
  const [currentEvent, setCurrentEvent] = useState(null);    // último evento de progreso
  const [error, setError]               = useState(null);

  // ── Listeners automáticos de progreso ──────────────────────────────────
  useEffect(() => {
    const progressHandler = (data) => {
      setCurrentEvent({ type: data.type, message: data.message, ...data });
    };

    const progressEvents = ['analyzing', 'planning', 'executing', 'processing', 'saving', 'warning'];
    progressEvents.forEach(type => sseService.on(type, progressHandler));

    return () => {
      progressEvents.forEach(type => sseService.off(type, progressHandler));
    };
  }, []);

  // ── Enviar mensaje ──────────────────────────────────────────────────────
  /**
   * Abre el stream SSE y espera hasta completado/error.
   * Devuelve una Promise que resuelve con el evento "completed".
   *
   * @param {string} message
   * @param {string|null} conversationId
   * @returns {Promise<object>} datos del evento completed
   */
  const sendMessage = useCallback((message, conversationId = null) => {
    setIsSending(true);
    setCurrentEvent(null);
    setError(null);

    return new Promise((resolve, reject) => {
      // Handler one-shot para completed
      const onCompleted = (data) => {
        sseService.off('completed', onCompleted);
        sseService.off('error', onError);
        setIsSending(false);
        setCurrentEvent(null);
        resolve(data);
      };

      // Handler one-shot para error
      const onError = (data) => {
        sseService.off('completed', onCompleted);
        sseService.off('error', onError);
        setIsSending(false);
        setError(data.message || 'Error desconocido');
        reject(new Error(data.message || 'Error desconocido'));
      };

      sseService.on('completed', onCompleted);
      sseService.on('error', onError);

      // Lanzar stream
      sseService.sendMessage(message, conversationId).catch((err) => {
        sseService.off('completed', onCompleted);
        sseService.off('error', onError);
        setIsSending(false);
        setError(err.message);
        reject(err);
      });
    });
  }, []);

  // ── Cancelar stream activo ──────────────────────────────────────────────
  const disconnect = useCallback(() => {
    sseService.disconnect();
    setIsSending(false);
    setCurrentEvent(null);
  }, []);

  // ── Registro manual de listeners (para uso avanzado) ───────────────────
  const addEventListener = useCallback((eventType, callback) => {
    sseService.on(eventType, callback);
    return () => sseService.off(eventType, callback);
  }, []);

  return {
    // Estado
    isSending,          // true mientras el stream está abierto
    isConnected: isSending,  // alias para compatibilidad con código existente
    currentEvent,
    error,

    // Acciones
    sendMessage,
    disconnect,
    addEventListener,

    // connect() ya no es necesario; se mantiene como no-op para compatibilidad
    connect: async () => {},
  };
}