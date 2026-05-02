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

// Lista centralizada — debe coincidir exactamente con PROGRESS_EVENTS en sseService.js
// y con los eventos que emite el orquestador en el backend.
const PROGRESS_EVENTS = [
  'validating',
  'analyzing',   // clasificando intent
  'loading',     // cargando herramientas        ← faltaba
  'connecting',  // iniciando sesión ADK          ← faltaba
  'thinking',    // agente procesando             ← faltaba
  'planning',    // planificando pasos
  'executing',   // ejecutando tool
  'processing',  // procesando resultado de tool
  'saving',      // guardando resultados
  'warning',     // advertencia no fatal
];

export function useSSE() {
  const [isSending, setIsSending]       = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [error, setError]               = useState(null);

  // Ref para los handlers one-shot (completed / error) — permite cancelarlos
  // si el componente se desmonta antes de que el stream termine.
  const oneShotRef = useRef({ onCompleted: null, onError: null });
  const lastEventTimeRef = useRef(0);
  const timeoutRef = useRef(null);

  // ── Listeners de progreso ─────────────────────────────────────────────────
  // Se registran al montar y se limpian al desmontar.
  // Actualizan currentEvent para que el componente pueda mostrar el estado.
  useEffect(() => {

    const MIN_EVENT_DURATION = 500; // 🔥 puedes ajustar: 400–800ms

    const progressHandler = (data) => {
      const now = Date.now();
      const elapsed = now - lastEventTimeRef.current;

      const applyEvent = () => {
        lastEventTimeRef.current = Date.now();
        setCurrentEvent({ type: data.type, message: data.message, ...data });
      };

      // Si el último evento fue muy reciente → retrasar
      if (elapsed < MIN_EVENT_DURATION) {
        clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          applyEvent();
        }, MIN_EVENT_DURATION - elapsed);
      } else {
        applyEvent();
      }
    };

    PROGRESS_EVENTS.forEach(type => sseService.on(type, progressHandler));

    return () => {
      PROGRESS_EVENTS.forEach(type => sseService.off(type, progressHandler));
      clearTimeout(timeoutRef.current);
    };
  }, []); // Sin dependencias — se registra una vez y sobrevive re-renders

  // ── Limpieza si el componente se desmonta con stream activo ───────────────
  useEffect(() => {
    return () => {
      const { onCompleted, onError } = oneShotRef.current;
      if (onCompleted) sseService.off('completed', onCompleted);
      if (onError)     sseService.off('error',     onError);
      sseService.disconnect();
    };
  }, []);

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  /**
   * Abre el stream SSE y resuelve cuando llega "completed" o rechaza en "error".
   *
   * @param {string}      message
   * @param {string|null} conversationId
   * @returns {Promise<object>} datos del evento completed
   */
  const sendMessage = useCallback((message, conversationId = null) => {
    setIsSending(true);
    setCurrentEvent(null);
    setError(null);

    return new Promise((resolve, reject) => {

      // Handlers one-shot: se eliminan solos al dispararse (completed o error)
      const onCompleted = (data) => {
        sseService.off('completed', onCompleted);
        sseService.off('error',     onError);
        oneShotRef.current = { onCompleted: null, onError: null };
        setIsSending(false);
        setCurrentEvent(null);
        resolve(data);
      };

      const onError = (data) => {
        sseService.off('completed', onCompleted);
        sseService.off('error',     onError);
        oneShotRef.current = { onCompleted: null, onError: null };
        setIsSending(false);
        setCurrentEvent(null);
        const msg = data?.message || 'Error desconocido';
        setError(msg);
        reject(new Error(msg));
      };

      // Guardar referencia para poder limpiar si el componente se desmonta
      oneShotRef.current = { onCompleted, onError };

      sseService.on('completed', onCompleted);
      sseService.on('error',     onError);

      // Lanzar stream — sendMessage es async pero no esperamos aquí;
      // el resultado llega por los eventos completed/error de arriba.
      sseService.sendMessage(message, conversationId).catch((err) => {
        sseService.off('completed', onCompleted);
        sseService.off('error',     onError);
        oneShotRef.current = { onCompleted: null, onError: null };
        setIsSending(false);
        setCurrentEvent(null);
        const msg = err?.message || 'Error al enviar mensaje';
        setError(msg);
        reject(new Error(msg));
      });
    });
  }, []);

  // ── Cancelar stream activo ────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    const { onCompleted, onError } = oneShotRef.current;
    if (onCompleted) sseService.off('completed', onCompleted);
    if (onError)     sseService.off('error',     onError);
    oneShotRef.current = { onCompleted: null, onError: null };

    sseService.disconnect();
    setIsSending(false);
    setCurrentEvent(null);
  }, []);

  // ── Registro manual de listeners (para uso avanzado desde componentes) ────
  const addEventListener = useCallback((eventType, callback) => {
    sseService.on(eventType, callback);
    return () => sseService.off(eventType, callback);
  }, []);

  return {
    // Estado
    isSending,
    isConnected: isSending,   // alias para compatibilidad con código existente
    currentEvent,
    error,

    // Acciones
    sendMessage,
    disconnect,
    addEventListener,

    // No-op para compatibilidad con código anterior que llamaba connect()
    connect: async () => {},
  };
}