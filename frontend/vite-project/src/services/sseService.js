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

class SSEService {
  constructor() {
    this.sessionId = this._getOrCreateSessionId();
    this.messageHandlers = new Map();
    this._activeReader = null;
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

  async sendMessage(message, conversationId = null, audioBase64 = null) {
    this._closeActiveSource();

    try {
      console.log('[SSE] Sending message:', { message, conversationId, audioBase64Length: audioBase64?.length });
      await this._openStream(message, conversationId, audioBase64);
    } catch (err) {
      console.error('[SSE] Error enviando mensaje:', err);
      this._dispatch('error', {
        type: 'error',
        message: 'No se pudo enviar el mensaje al servidor. Intenta de nuevo.',
        error_type: 'SendError',
      });
    }
  }

  // ─── STREAM SSE via fetch ─────────────────────────────────

  async _openStream(message, conversationId, audioBase64 = null) {
    const token = await getValidAccessToken();

    const response = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: this.sessionId,
        conversation_id: conversationId ?? undefined,
        audio_base64: audioBase64 ?? undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    this._activeReader = reader;

    // Timeout global del stream
    this._streamTimeout = setTimeout(() => {
      console.warn('[SSE] Timeout alcanzado');
      this._dispatch('error', {
        type: 'error',
        message: 'El agente tardó demasiado en responder. Intenta de nuevo.',
        error_type: 'TimeoutError',
      });
      this._closeActiveSource();
    }, STREAM_TIMEOUT_MS);

    await this._readStream(reader, decoder);
  }

  async _readStream(reader, decoder) {
    let buffer = '';
    let currentEvent = null;

    const safeParse = (raw, label) => {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.error(`[SSE] Error parseando ${label}:`, err, raw);
        return null;
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // última línea incompleta — esperar más datos

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();
            if (!raw) continue;
            const data = safeParse(raw, currentEvent || 'unknown');
            if (!data) continue;
            console.log('[SSE EVENT]', currentEvent, data);
            if (currentEvent) {
              this._dispatch(currentEvent, { type: currentEvent, ...data });
            }
            currentEvent = null;
          }
          // Líneas vacías y comentarios ": heartbeat" se ignoran
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[SSE NETWORK ERROR]', err);
        this._dispatch('error', {
          type: 'error',
          message: 'Conexión perdida con el servidor. Por favor, intenta de nuevo.',
          error_type: 'ConnectionError',
        });
      }
    } finally {
      this._closeActiveSource();
    }
  }

  // ─── Utils ───────────────────────────────────────────────

  _closeActiveSource() {
    if (this._streamTimeout) {
      clearTimeout(this._streamTimeout);
      this._streamTimeout = null;
    }
    if (this._activeReader) {
      this._activeReader.cancel();
      this._activeReader = null;
    }
  }

  disconnect() {
    this._closeActiveSource();
  }

  isConnected() {
    return this._activeReader !== null;
  }
}

export const sseService = new SSEService();