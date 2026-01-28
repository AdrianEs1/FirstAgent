/**
 * websocketService.js
 * Servicio para gestionar conexión WebSocket con el backend
 */

import  {getValidAccessToken}  from '../services/authservice';


class WebSocketService {
  constructor() {
    this.ws = null;
    this.sessionId = crypto.randomUUID(); // ← NUEVO
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.messageHandlers = new Map();
    this.isConnecting = false;
  }

  /**
   * Reconectar WebSocket asegurando token válido
   */
  async reconnect() {
    if (this.isConnecting) return;

    console.log("🔄 Reconectando WebSocket...");
    this.ws = null;
    await this.connect();
  }

  /**
   * Conectar al WebSocket
   */
  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("✅ WebSocket ya conectado");
      return;
    }

    if (this.isConnecting) {
      console.log("⏳ Conexión WS en progreso...");
      return;
    }

    this.isConnecting = true;

    try {
      const token = await getValidAccessToken();

      const wsUrl = import.meta.env.DEV
        ? `ws://localhost:5000/ws?token=${token}&sessionId=${this.sessionId}` // ← Agregar sessionId
        : `wss://assistwork-backend-273334954418.us-central1.run.app/ws?token=${token}&sessionId=${this.sessionId}`; // ← Agregar sessionId

      console.log("🔌 Conectando WebSocket...");

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("✅ WebSocket conectado");
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // ← NUEVO: Filtrar por sessionId
          if (data.session_id && data.session_id !== this.sessionId) {
            console.log("⚠️ Evento ignorado (otra pestaña):", data.type);
            return;
          }

          console.log("📨 Evento recibido:", data.type, data);

          const handlers = this.messageHandlers.get(data.type) || [];
          handlers.forEach(handler => handler(data));
        } catch (error) {
          console.error("❌ Error procesando mensaje WS:", error);
        }
      };

      this.ws.onerror = () => {
        // ⚠️ No hacer lógica aquí, el cierre real llega en onclose
      };

      this.ws.onclose = (event) => {
        console.log("🔌 WebSocket cerrado:", event.code, event.reason);
        this.ws = null;
        this.isConnecting = false;

        // Reconexión automática si no fue cierre intencional
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          console.log(
            `🔄 Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
          );

          setTimeout(() => {
            this.reconnect().catch(console.error);
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error("❌ Error al conectar WebSocket:", error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Enviar mensaje al WebSocket (con auto-reconexión)
   */
  async sendMessage(message, conversationId = null) {
    if (!this.isConnected()) {
      await this.reconnect();
    }

    const payload = {
      type: "chat",
      message,
      conversation_id: conversationId,
      session_id: this.sessionId  // ← NUEVO
    };

    console.log("📤 Enviando mensaje:", payload);
    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Registrar handler para un tipo de evento específico
   */
  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType).push(handler);
  }

  /**
   * Eliminar handler de un tipo de evento
   */
  off(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) return;

    const handlers = this.messageHandlers.get(eventType);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Cerrar conexión WebSocket intencionalmente
   */
  disconnect() {
    if (this.ws) {
      console.log("🔌 Cerrando WebSocket...");
      this.ws.close(1000, "Cierre intencional");
      this.ws = null;
    }
  }

  /**
   * Verificar si está conectado
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton
export const wsService = new WebSocketService();
