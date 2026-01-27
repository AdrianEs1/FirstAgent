/**
 * websocketService.js
 * Servicio para gestionar conexión WebSocket con el backend
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.messageHandlers = new Map();
    this.isConnecting = false;
  }

  /**
   * Conectar al WebSocket
   * @param {string} token - JWT token desde localStorage
   * @returns {Promise<void>}
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log("✅ WebSocket ya conectado");
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log("⏳ Conexión en progreso...");
        return;
      }

      this.isConnecting = true;

      // Determinar URL según entorno
      const wsUrl = import.meta.env.DEV
        ? `ws://localhost:5000/ws?token=${token}`
        : `wss://assistwork-backend-273334954418.us-central1.run.app/ws?token=${token}`;

      console.log("🔌 Conectando WebSocket...");

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("✅ WebSocket conectado");
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📨 Evento recibido:", data.type, data);
            
            // Llamar handlers registrados para este tipo de evento
            const handlers = this.messageHandlers.get(data.type) || [];
            handlers.forEach(handler => handler(data));
          } catch (error) {
            console.error("❌ Error procesando mensaje WS:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("❌ Error WebSocket:", error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log("🔌 WebSocket cerrado:", event.code, event.reason);
          this.isConnecting = false;

          // Intentar reconectar si no fue cierre intencional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
              this.connect(token).catch(console.error);
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Enviar mensaje al WebSocket
   * @param {string} message - Mensaje del usuario
   * @param {string|null} conversationId - ID de conversación (opcional)
   */
  sendMessage(message, conversationId = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket no está conectado");
    }

    const payload = {
      type: "chat",
      message,
      conversation_id: conversationId
    };

    console.log("📤 Enviando mensaje:", payload);
    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Registrar handler para un tipo de evento específico
   * @param {string} eventType - Tipo de evento (analyzing, executing, completed, etc.)
   * @param {Function} handler - Función callback
   */
  on(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType).push(handler);
  }

  /**
   * Eliminar handler de un tipo de evento
   * @param {string} eventType - Tipo de evento
   * @param {Function} handler - Función callback a eliminar
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
   * Cerrar conexión WebSocket
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
   * @returns {boolean}
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Exportar instancia singleton
export const wsService = new WebSocketService();