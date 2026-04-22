/**
 * sseService.js
 * Servicio para gestionar conexión SSE con el backend.
 * Reemplaza websocketService.js — misma API pública, sin WebSocket.
 *
 * Diferencias clave vs WS:
 *  - El mensaje se envía como POST HTTP normal (no por el canal SSE)
 *  - El stream SSE se abre por GET y se cierra al recibir "completed" o "error"
 *  - Reconexión automática nativa del browser via EventSource
 *  - Sin gestión de estado de conexión persistente (cada mensaje = un stream)
 */

import { getValidAccessToken } from '../services/authservice';

const API_BASE = import.meta.env.DEV
  ? `http://${import.meta.env.VITE_API_URL_LOC}`
  : `https://${import.meta.env.VITE_API_URL_PROD}`;


class SSEService {
  constructor() {
    this.sessionId = crypto.randomUUID();   // UUID estable por pestaña
    this.messageHandlers = new Map();        // event_type → [handlers]
    this.activeSource = null;                // EventSource activo (un stream por vez)
  }

  // ─── Registro de handlers ──────────────────────────────────────────────

  /** Suscribirse a un tipo de evento (e.g. "analyzing", "completed") */
  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType).push(handler);
  }

  /** Desuscribirse */
  off(eventType, handler) {
    const handlers = this.messageHandlers.get(eventType);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx > -1) handlers.splice(idx, 1);
  }

  /** Despachar a todos los handlers registrados para ese tipo */
  _dispatch(eventType, data) {
    const handlers = this.messageHandlers.get(eventType) || [];
    handlers.forEach(h => h(data));
  }

  // ─── Envío de mensaje + apertura de stream ────────────────────────────

  /**
   * Envía el mensaje y abre el stream SSE para recibir eventos del agente.
   *
   * @param {string} message          Texto del usuario
   * @param {string|null} conversationId  UUID conversación existente
   */
  async sendMessage(message, conversationId = null) {
    // Cerrar stream anterior si existe
    this._closeActiveSource();

    const token = await getValidAccessToken();

    // Construir URL con query params (GET — SSE no soporta body)
    const params = new URLSearchParams({
      token,
      message,
      session_id: this.sessionId,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    });

    const url = `${API_BASE}/agent/stream?${params.toString()}`;
    //console.log('📡 Abriendo stream SSE...');

    const source = new EventSource(url);
    this.activeSource = source;

    // ── Eventos de progreso del agente ────────────────────────────────
    const progressEvents = ['analyzing', 'planning', 'executing', 'processing', 'saving', 'warning'];

    progressEvents.forEach(eventType => {
      source.addEventListener(eventType, (e) => {
        try {
          const data = JSON.parse(e.data);
          //console.log(`📨 Evento [${eventType}]:`, data);
          this._dispatch(eventType, { type: eventType, ...data });
        } catch (err) {
          //console.error(`❌ Error parseando evento ${eventType}:`, err);
        }
      });
    });

    // ── Evento final: operación completada ────────────────────────────
    source.addEventListener('completed', (e) => {
      try {
        const data = JSON.parse(e.data);
        //console.log('✅ Completado:', data);
        this._dispatch('completed', { type: 'completed', ...data });
      } catch (err) {
        //console.error('❌ Error parseando completed:', err);
      } finally {
        this._closeActiveSource();
      }
    });

    // ── Evento de error del agente ────────────────────────────────────
    source.addEventListener('error', (e) => {
      // Este listener captura errores enviados INTENCIONALMENTE por el backend
      // (event: error\ndata: {...})
      try {
        const data = JSON.parse(e.data);
        //console.error('❌ Error del agente:', data);
        this._dispatch('error', { type: 'error', ...data });
      } catch {
        // Si no tiene data parseable, ignorar (lo maneja onerror abajo)
      } finally {
        this._closeActiveSource();
      }
    });

    // ── Error de conexión (red caída, timeout, etc.) ──────────────────
    source.onerror = (e) => {
      // EventSource reintenta automáticamente en errores transitorios.
      // Solo propagamos si la fuente ya está cerrada (error definitivo).
      if (source.readyState === EventSource.CLOSED) {
        //console.error('❌ Conexión SSE cerrada inesperadamente');
        this._dispatch('error', {
          type: 'error',
          message: 'Conexión perdida con el servidor. Por favor, intenta de nuevo.',
          error_type: 'ConnectionError',
        });
        this._closeActiveSource();
      }
    };
  }

  // ─── Utilidades ───────────────────────────────────────────────────────

  _closeActiveSource() {
    if (this.activeSource) {
      this.activeSource.close();
      this.activeSource = null;
      //console.log('🔌 Stream SSE cerrado');
    }
  }

  /** Cancelar stream activo (e.g. usuario navega a otra página) */
  disconnect() {
    this._closeActiveSource();
  }

  /** Compatibilidad con código que llama isConnected() */
  isConnected() {
    return this.activeSource !== null &&
           this.activeSource.readyState !== EventSource.CLOSED;
  }
}

// Singleton — mismo patrón que wsService
export const sseService = new SSEService();