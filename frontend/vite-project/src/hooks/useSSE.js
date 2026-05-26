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
  const [isSending, setIsSending]           = useState(false);
  const [currentEvent, setCurrentEvent]     = useState(null);
  const [error, setError]                   = useState(null);
  const [streamingText, setStreamingText]   = useState('');

  // Acumulador de texto — useRef para no generar renders extra en cada concat;
  // el useState arriba es lo que el componente consume para renderizar.
  const streamingTextRef = useRef('');

  // Ref para los handlers one-shot (completed / error) — permite cancelarlos
  // si el componente se desmonta antes de que el stream termine.
  const oneShotRef = useRef({ onCompleted: null, onError: null });

  // ── Listener de chunks ────────────────────────────────────────────────────
  // Se registra al montar y se limpia al desmontar.
  // Acumula data.text en el ref y actualiza el estado para triggear render.
  useEffect(() => {
    const chunkHandler = (data) => {
      if (!data?.text) return;
      streamingTextRef.current += data.text;
      setStreamingText(streamingTextRef.current);
    };

    sseService.on('chunk', chunkHandler);
    return () => sseService.off('chunk', chunkHandler);
  }, []);

  useEffect(() => {
    const progressEvents = [
      'validating', 'analyzing', 'loading', 'connecting',
      'thinking', 'planning', 'executing', 'processing', 'saving', 'warning',
    ];

    const progressHandler = (data) => {
      setCurrentEvent({ type: data.type, message: data.message, ...data });
    };

    progressEvents.forEach(type => sseService.on(type, progressHandler));
    return () => {
      progressEvents.forEach(type => sseService.off(type, progressHandler));
    };
  }, []);

  // ── Limpieza si el componente se desmonta con stream activo ───────────────
  useEffect(() => {
    return () => {
      const { onCompleted, onError } = oneShotRef.current;
      if (onCompleted) sseService.off('completed', onCompleted);
      if (onError)     sseService.off('error',     onError);
      sseService.disconnect();
    };
  }, []);

  // ── Helper interno: resetea el texto de streaming ─────────────────────────
  const _clearStreamingText = () => {
    streamingTextRef.current = '';
    setStreamingText('');
  };

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  /**
   * Abre el stream SSE y resuelve cuando llega "completed" o rechaza en "error".
   *
   * @param {string}      message
   * @param {string|null} conversationId
   * @returns {Promise<object>} datos del evento completed
   */
  const sendMessage = useCallback((message, conversationId = null, audioBase64 = null) => {
    setIsSending(true);
    setCurrentEvent(null);
    setError(null);
    _clearStreamingText();

    return new Promise((resolve, reject) => {

      // Handlers one-shot: se eliminan solos al dispararse (completed o error)
      const onCompleted = (data) => {
        sseService.off('completed', onCompleted);
        sseService.off('error',     onError);
        oneShotRef.current = { onCompleted: null, onError: null };
        setIsSending(false);
        setCurrentEvent(null);
        _clearStreamingText();
        resolve(data);
      };

      const onError = (data) => {
        sseService.off('completed', onCompleted);
        sseService.off('error',     onError);
        oneShotRef.current = { onCompleted: null, onError: null };
        setIsSending(false);
        setCurrentEvent(null);
        _clearStreamingText();
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
      sseService.sendMessage(message, conversationId, audioBase64).catch((err) => {
        sseService.off('completed', onCompleted);
        sseService.off('error',     onError);
        oneShotRef.current = { onCompleted: null, onError: null };
        setIsSending(false);
        setCurrentEvent(null);
        _clearStreamingText();
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
    _clearStreamingText();
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
    streamingText,            // texto parcial acumulado durante el stream

    // Acciones
    sendMessage,
    disconnect,
    addEventListener,

    // No-op para compatibilidad con código anterior que llamaba connect()
    connect: async () => {},
  };
}