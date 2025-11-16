/**
 * useWebSocket.js
 * Hook personalizado para manejar WebSocket en componentes React (VERSIÓN CORREGIDA)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { wsService } from '../services/websocketService';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Conectar WebSocket con token
   */
  const connect = useCallback(async (token) => {
    try {
      await wsService.connect(token);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error("Error conectando WebSocket:", err);
      setError(err.message);
      setIsConnected(false);
    }
  }, []);

  /**
   * Desconectar WebSocket
   */
  const disconnect = useCallback(() => {
    wsService.disconnect();
    setIsConnected(false);
    setCurrentEvent(null);
  }, []);

  /**
   * Enviar mensaje por WebSocket
   */
  const sendMessage = useCallback((message, conversationId = null) => {
    if (!wsService.isConnected()) {
      throw new Error("WebSocket no está conectado. Por favor, recarga la página.");
    }
    
    // Limpiar evento anterior
    setCurrentEvent(null);
    wsService.sendMessage(message, conversationId);
  }, []);

  /**
   * Registrar listener para un tipo de evento (CON CLEANUP)
   */
  const addEventListener = useCallback((eventType, callback) => {
    console.log(`📝 Registrando listener para: ${eventType}`);
    wsService.on(eventType, callback);
    
    // Retornar función de cleanup
    return () => {
      console.log(`🗑️ Eliminando listener para: ${eventType}`);
      wsService.off(eventType, callback);
    };
  }, []);

  /**
   * Configurar listeners automáticos para eventos de progreso
   */
  useEffect(() => {
    const progressHandler = (data) => {
      setCurrentEvent({
        type: data.type,
        message: data.message,
        ...data
      });
    };

    // Registrar listeners para todos los eventos de progreso
    const eventTypes = ['analyzing', 'planning', 'executing', 'processing', 'saving'];
    
    eventTypes.forEach(type => {
      wsService.on(type, progressHandler);
    });

    // ✅ CLEANUP: Eliminar listeners al desmontar
    return () => {
      console.log('🧹 Limpiando listeners de progreso');
      eventTypes.forEach(type => {
        wsService.off(type, progressHandler);
      });
    };
  }, []); // ← Sin dependencias, se ejecuta UNA VEZ

  return {
    isConnected,
    currentEvent,
    error,
    connect,
    disconnect,
    sendMessage,
    addEventListener,
  };
}