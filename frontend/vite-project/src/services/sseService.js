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

const API_BASE = import.meta.env.VITE_API_URL;

const STREAM_TIMEOUT_MS = 60_000;

const PROGRESS_EVENTS = [
  'validating',
  'analyzing',
  'loading',
  'connecting',
  'thinking',
  'planning',
  'executing',
  'processing',
  'saving',
  'warning',
];

class SSEService {
  constructor() {
    this.sessionId = this._getOrCreateSessionId();
    this.messageHandlers = new Map();
    this.activeSource = null;
    this._streamTimeout = null;
  }

  // ─── Session ─────────────────────────────────────────────

  _getOrCreateSessionId() {
    const KEY = 'sse_session_id';
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  }

  resetSession() {
    const KEY = 'sse_session_id';
    const id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
    this.sessionId = id;
  }

  // ─── Handlers ────────────────────────────────────────────

  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType).push(handler);
  }

  off(eventType, handler) {
    const handlers = this.messageHandlers.get(eventType);
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx > -1) handlers.splice(idx, 1);
  }

  _dispatch(eventType, data) {
    console.log('[SSE DISPATCH]', eventType, data);

    const handlers = this.messageHandlers.get(eventType) || [];

    handlers.forEach(h => {
      try {
        h(data);
      } catch (err) {
        console.error('[SSE HANDLER ERROR]', eventType, err);
      }
    });
  }

  // ─── API flow ────────────────────────────────────────────

  async sendMessage(message, conversationId = null) {
    this._closeActiveSource();

    let request_id;

    try {
      console.log('[SSE] Sending message:', { message, conversationId });

      request_id = await this._postMessage(message, conversationId);
    } catch (err) {
      this._dispatch('error', {
        type: 'error',
        message: 'No se pudo enviar el mensaje al servidor. Intenta de nuevo.',
        error_type: 'SendError',
      });
      return;
    }

    this._openStream(request_id);
  }

  async _postMessage(message, conversationId) {
    const token = await getValidAccessToken();
    const t0 = Date.now()
    const response = await fetch(`${API_BASE}/agent/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: this.sessionId,
        conversation_id: conversationId ?? undefined,
      }),
    });
    console.log(`[POST] took: ${Date.now() - t0}ms`)


    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `HTTP ${response.status}`);
    }

    const { request_id } = await response.json();

    if (!request_id) {
      throw new Error('El servidor no devolvió request_id');
    }

    return request_id;
  }

  // ─── STREAM SSE ──────────────────────────────────────────

  _openStream(request_id) {
    const t1 = Date.now()
    const url = `${API_BASE}/agent/stream/${request_id}`;
    console.log('[SSE] Opening stream:', url);

    const source = new EventSource(url);
    this.activeSource = source;

    // Timeout
    this._streamTimeout = setTimeout(() => {
      console.warn('[SSE] Timeout alcanzado');

      this._dispatch('error', {
        type: 'error',
        message: 'El agente tardó demasiado en responder. Intenta de nuevo.',
        error_type: 'TimeoutError',
      });

      this._closeActiveSource();
    }, STREAM_TIMEOUT_MS);

    // Helper seguro
    const safeParse = (raw, label) => {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.error(`[SSE] Error parseando ${label}:`, err, raw);
        return null;
      }
    };

    // Eventos de progreso
    PROGRESS_EVENTS.forEach(eventType => {
      source.addEventListener(eventType, (e) => {
        console.log('[SSE RAW EVENT]', eventType, e.data)
        console.log(`[POST→SSE gap]: ${Date.now() - t1}ms`);

        const data = safeParse(e.data, eventType);
        if (!data) return;

        console.log('[SSE EVENT]', eventType, data);

        this._dispatch(eventType, { type: eventType, ...data });
      });
    });

    // Evento chunk — fragmentos de texto en tiempo real del LLM
    source.addEventListener('chunk', (e) => {
      const data = safeParse(e.data, 'chunk');
      if (!data) return;

      this._dispatch('chunk', { type: 'chunk', ...data });
    });

    // Fallback (MUY IMPORTANTE)
    source.onmessage = (e) => {
      console.log('[SSE DEFAULT EVENT]', e.data);

      const data = safeParse(e.data, 'default');
      if (!data) return;

      this._dispatch('message', { type: 'message', ...data });
    };

    // Completed
    source.addEventListener('completed', (e) => {
      console.log('[SSE COMPLETED RAW]', e.data);

      const data = safeParse(e.data, 'completed');
      if (!data) return;

      console.log('[SSE COMPLETED]', data);

      this._dispatch('completed', { type: 'completed', ...data });

      this._closeActiveSource();
    });

    // Error del backend (evento SSE)
    source.addEventListener('error', (e) => {
      console.warn('[SSE BACKEND ERROR RAW]', e.data);

      const data = safeParse(e.data, 'error');

      if (data) {
        console.warn('[SSE BACKEND ERROR]', data);

        this._dispatch('error', { type: 'error', ...data });
      } else {
        console.warn('[SSE] Error sin payload JSON');
      }

      this._closeActiveSource();
    });

    // Error de red
    source.onerror = (err) => {
      console.error('[SSE NETWORK ERROR]', err, source.readyState);

      if (source.readyState === EventSource.CLOSED) {
        this._dispatch('error', {
          type: 'error',
          message:
            'Conexión perdida con el servidor. Por favor, intenta de nuevo.',
          error_type: 'ConnectionError',
        });

        this._closeActiveSource();
      }
    };
  }

  // ─── Utils ───────────────────────────────────────────────

  _closeActiveSource() {
    if (this._streamTimeout) {
      clearTimeout(this._streamTimeout);
      this._streamTimeout = null;
    }

    if (this.activeSource) {
      console.log('[SSE] Closing stream');

      this.activeSource.close();
      this.activeSource = null;
    }
  }

  disconnect() {
    this._closeActiveSource();
  }

  isConnected() {
    return (
      this.activeSource !== null &&
      this.activeSource.readyState !== EventSource.CLOSED
    );
  }
}

export const sseService = new SSEService();