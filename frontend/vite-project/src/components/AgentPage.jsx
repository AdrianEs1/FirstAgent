import { useState, useEffect, useRef } from "react";
import { useSSE } from "../hooks/useSSE";
import EventIndicator from "../components/EventIndicator";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import NotificationDeleteAccount from "../components/NotificationDeleteAccount";
import DeleteArchiveConversation from "../components/DeleteArchiveConversation";

import {
  fetchConversations,
  fetchConversationById,
  getOAuthStatus,
  connectOAuth,
  disconnectOAuth,
} from "../services/agentServices";
import { Menu, X, Send } from "lucide-react";

function AgentPage() {
  const { user } = useAuth();

  // ── Hook SSE (reemplaza useWebSocket) ────────────────────────────────────
  // - No necesita connect() explícito; cada sendMessage abre su propio stream
  // - sendMessage ahora es async y retorna Promise con el resultado final
  // - isSending indica si hay un stream activo
  const {
    isSending,
    currentEvent,
    sendMessage: sendSSEMessage,
    addEventListener,
  } = useSSE();

  const textareaRef = useRef(null);

  // Estados principales
  const [isSidebarOpen, setIsSidebarOpen]         = useState(false);
  const [connectedApps, setConnectedApps]         = useState({});
  const [conversations, setConversations]         = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages]                   = useState([]);
  const [newMessage, setNewMessage]               = useState("");
  const [loading, setLoading]                     = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [conversationModal, setConversationModal] = useState(null);
  const [showArchived, setShowArchived]           = useState(() => {
    return localStorage.getItem("conv_view") === "archived";
  });

  // ── Cargar datos iniciales ────────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
    checkOAuthStatus();
  }, []);

  // ── ELIMINADO: useEffect de connect(token) — SSE no necesita conexión previa

  // ── ELIMINADO: useEffect de addEventListener('completed', ...) 
  //    La respuesta final ahora llega como valor resuelto de la Promise
  //    en handleSendMessage, lo que simplifica mucho el flujo.

  // ── Auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [newMessage]);

  // ── Persistir vista activa/archivada ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("conv_view", showArchived ? "archived" : "active");
  }, [showArchived]);

  // ── Cargar conversaciones ─────────────────────────────────────────────────
  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await fetchConversations();
      const unique = Array.from(new Map(data.map(item => [item.id, item])).values());
      setConversations(unique);
      setActiveConversationId(null);
      setMessages([]);
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // ── Cargar mensajes de una conversación ──────────────────────────────────
  const loadConversationMessages = async (conversationId) => {
    try {
      const data = await fetchConversationById(conversationId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error cargando mensajes:", error);
      setMessages([]);
    }
  };

  // ── OAuth ─────────────────────────────────────────────────────────────────
  const checkOAuthStatus = async () => {
    const services = ["gmail"];
    try {
      const statuses = await Promise.all(
        services.map((s) => getOAuthStatus(s).catch(() => ({ connected: false })))
      );
      const newStates = services.reduce((acc, s, i) => {
        acc[s] = statuses[i].connected;
        return acc;
      }, {});
      setConnectedApps((prev) => ({ ...prev, ...newStates }));
    } catch (error) {
      console.error("Error verificando OAuth:", error);
    }
  };

  const handleConnectApp = async (appId) => {
    const isConnected = connectedApps[appId];

    if (isConnected) {
      try {
        await disconnectOAuth(appId);
        await checkOAuthStatus();
        alert(`${appId} desconectado exitosamente`);
      } catch (error) {
        console.error(`Error desconectando ${appId}:`, error);
        alert(`Error al desconectar ${appId}`);
      }
    } else {
      try {
        const result = await connectOAuth(appId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await checkOAuthStatus();

        if (result?.connected) {
          setConnectedApps(prev => ({ ...prev, [appId]: true }));
        }

        await checkOAuthStatus();
        alert(`${appId} conectado exitosamente${result?.email ? ` como ${result.email}` : ""}`);
      } catch (error) {
        console.error(`❌ Error conectando ${appId}:`, error);
        alert(`Error al conectar ${appId}`);
        await checkOAuthStatus();
      }
    }
  };

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  // Cambios vs versión WS:
  //  1. sendSSEMessage es async → await directo, sin listener 'completed' separado
  //  2. La respuesta del agente llega como valor de retorno de la Promise
  //  3. setLoading se controla aquí mismo, no en un useEffect externo
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const userMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    const messageToSend = newMessage;
    setNewMessage("");
    setLoading(true);

    try {
      // sendSSEMessage abre el stream y resuelve cuando llega "completed"
      const data = await sendSSEMessage(messageToSend, activeConversationId);

      console.log("✅ Mensaje completado:", data);

      // Agregar respuesta del agente
      const botMsg = {
        id: `temp-${Date.now()}`,
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);

      // Actualizar conversación si es nueva
      if (data.data?.conversation_id && !activeConversationId) {
        setConversations(prev => {
          const exists = prev.some(conv => conv.id === data.data.conversation_id);
          if (exists) return prev;

          return [{
            id: data.data.conversation_id,
            title: data.data.title,
            status: "active",
            last_message_at: new Date().toISOString(),
          }, ...prev];
        });

        setActiveConversationId(data.data.conversation_id);
      }

    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setMessages(prev => [...prev, {
        id: `temp-${Date.now() + 1}`,
        role: "assistant",
        content: "Error al procesar tu solicitud. Por favor, intenta nuevamente.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Conversaciones ────────────────────────────────────────────────────────
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleSelectConversation = (conversation) => {
    if (conversation.status === "archived") return;
    setActiveConversationId(conversation.id);
    loadConversationMessages(conversation.id);
  };

  const handleDeleteConversation = (id) => {
    setConversationModal({ id, action: "delete" });
  };

  const activeConversations   = conversations.filter(c => c.status !== "archived");
  const archivedConversations = conversations.filter(c => c.status === "archived");

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingConversations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando AssistWork...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* HEADER */}
      <Header
        onConnectApp={handleConnectApp}
        connectedApps={connectedApps}
        onDeleteAccount={() => setShowDeleteAccountModal(true)}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar toggle (mobile) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 md:hidden z-30 bg-white p-2 rounded-lg shadow-md hover:bg-gray-100 transition-all"
          aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Overlay mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 ease-in-out md:w-80 w-64 bg-white shadow-lg z-50 flex-shrink-0 fixed md:relative top-0 left-0 h-full md:h-auto overflow-y-auto`}
        >
          <Sidebar
            conversations={showArchived ? archivedConversations : activeConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </aside>

        {/* ÁREA DE CHAT */}
        <div className="flex flex-col flex-1 bg-white md:rounded-tl-2xl shadow-inner overflow-hidden w-full md:w-auto">
          <div className="flex-1 overflow-y-auto pt-16 md:pt-0 px-2 md:px-4">

            {!activeConversationId && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-gray-500 p-4 md:p-8 h-full">
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">
                  Bienvenido, {user?.name || user?.email}
                </h2>
                <p className="text-center mb-6 text-sm md:text-base px-4">
                  Escribe un mensaje para empezar una nueva conversación
                </p>
              </div>
            )}

            {(activeConversationId || messages.length > 0) && (
              <>
                <ChatArea messages={messages} loading={false} />
                {loading && currentEvent && <EventIndicator event={currentEvent} />}
                {loading && !currentEvent && (
                  <div className="flex justify-start p-4 md:p-6">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* INPUT AREA */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex-shrink-0"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3 w-full">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="flex-1 border border-gray-300 rounded-lg px-3 md:px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none overflow-y-auto text-sm md:text-base"
                style={{ minHeight: "42px", maxHeight: "200px" }}
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="bg-cyan-600 text-white p-2 md:p-2.5 rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Enviar mensaje"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal eliminar cuenta */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
            <NotificationDeleteAccount onClose={() => setShowDeleteAccountModal(false)} />
        </div>
      )}

      {/* Modal conversación */}
      {conversationModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative mx-4">
            <button
              onClick={() => setConversationModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              aria-label="Cerrar modal"
            >
              <X size={24} />
            </button>
            <DeleteArchiveConversation
              conversationId={conversationModal.id}
              action={conversationModal.action}
              onClose={() => setConversationModal(null)}
              onSuccess={() => {
                const { id, action } = conversationModal;
                setConversationModal(null);
                setConversations(prev =>
                  action === "delete" ? prev.filter(c => c.id !== id) : prev
                );
                if (id === activeConversationId) {
                  setActiveConversationId(null);
                  setMessages([]);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentPage;