import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
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


  // Hook de WebSocket
  const { 
    //isConnected, 
    currentEvent, 
    connect, 
    sendMessage: sendWsMessage,
    addEventListener 
  } = useWebSocket();
  
  const textareaRef = useRef(null);

  // Estados principales
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [connectedApps, setConnectedApps] = useState({});
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [conversationModal, setConversationModal] = useState(null);
  const [showArchived, setShowArchived] = useState(() => {

    return localStorage.getItem("conv_view") === "archived";
  });

  
  // ✅ Cargar conversaciones al inicio
  useEffect(() => {
    loadConversations();
    checkOAuthStatus();
  }, []);


  // Conectar WebSocket al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connect(token).catch(err => {
        console.error('Error conectando WebSocket:', err);
      });
    }
  }, [connect]);

  // Escuchar evento "completed" del WebSocket
  useEffect(() => {
    const cleanup = addEventListener('completed', (data) => {
      console.log('✅ Mensaje completado:', data);
      
      // Mensaje del bot con animación
      const botMsg = {
        id: `temp-${Date.now()}`,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMsg]);

      // ✅ DESPUÉS (instantáneo)
      setMessages(prev =>
        prev.map(m => m.id === botMsg.id ? { ...m, content: data.message } : m)
      );
      setLoading(false);
          
      // Actualizar conversación SOLO si es nueva Y no existe
      if (data.data?.conversation_id && !activeConversationId) {
        setConversations(prev => {
          const exists = prev.some(conv => conv.id === data.data.conversation_id);
          if (exists) {
            console.log('⚠️ Conversación ya existe, saltando');
            return prev;
          }
          
          const newConv = {
            id: data.data.conversation_id,
            title: data.data.title,
            status: 'active',
            last_message_at: new Date().toISOString()
          };
          return [newConv, ...prev];
        });
        
        setActiveConversationId(data.data.conversation_id);
      }
        
    });

    // ✅ CLEANUP cuando el componente se desmonta o activeConversationId cambia
    return cleanup;
  }, [addEventListener, activeConversationId]);


  // Auto-resize textarea

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [newMessage]);


  // ✅ Cargar lista de conversaciones sin abrir ninguna automáticamente
  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await fetchConversations();

      // Evitar duplicados por ID
      const unique = Array.from(new Map(data.map(item => [item.id, item])).values());

      // Actualizar lista de conversaciones
      setConversations(unique);

      // 👇 No seleccionar ninguna conversación al cargar la página
      setActiveConversationId(null);
      setMessages([]);
    } catch (error) {
      console.error("Error cargando conversaciones:", error);
    } finally {
      setLoadingConversations(false);
    }
  };


  useEffect(() => {
    localStorage.setItem(
      "conv_view",
      showArchived ? "archived" : "active"
    );
  }, [showArchived]);


  // ✅ Cargar mensajes de una conversación
  const loadConversationMessages = async (conversationId) => {
    try {
      const data = await fetchConversationById(conversationId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error cargando mensajes:", error);
      setMessages([]);
    }
  };

  // ✅ Verificar estado de OAuth al cargar
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

  // ✅ Conexión/desconexión unificada (con popup incluido en connectOAuth)
  const handleConnectApp = async (appId) => {
    const isConnected = connectedApps[appId];
    
    console.log('🔵 handleConnectApp iniciado para:', appId);
    console.log('🔵 Estado actual conectado:', isConnected);

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
        console.log('🟢 Iniciando connectOAuth...');
        const result = await connectOAuth(appId);

        // Esperar un momento para que el usuario autorice
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verificar el estado real
        await checkOAuthStatus();
        console.log('🟢 connectOAuth completado:', result);
        
        // ✅ Actualizar inmediatamente si la conexión fue exitosa
        if (result?.connected) {
          console.log('🟢 Actualizando estado a conectado');
          setConnectedApps(prev => ({ ...prev, [appId]: true }));
        }
        
        console.log('🟢 Llamando a checkOAuthStatus...');
        await checkOAuthStatus();
        console.log('🟢 checkOAuthStatus completado');

        alert(`${appId} conectado exitosamente${result?.email ? ` como ${result.email}` : ""}`);
      } catch (error) {
        console.error(`❌ Error conectando ${appId}:`, error);
        alert(`Error al conectar ${appId}`);
        
        // Intentar sincronizar incluso si hay error
        await checkOAuthStatus();
      }
    }
  };



  // ✅ Enviar mensaje (crea conversación automáticamente si no existe)
  // ✅ Enviar mensaje via WebSocket
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: newMessage,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    const messageToSend = newMessage;
    setNewMessage('');
    setLoading(true);

    try {
      // Enviar por WebSocket
      sendWsMessage(messageToSend, activeConversationId);
      
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      const errorMsg = {
        id: `temp-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Error al procesar tu solicitud. Por favor, intenta nuevamente.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      setLoading(false);
    }
  };


  // 🧾 Nueva conversación (manual)
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };


  


  // 🗂️ Seleccionar conversación
  const handleSelectConversation = (conversation) => {
    if (conversation.status === "archived") {
      return; // ⛔ NO abrir conversaciones archivadas
    }

    setActiveConversationId(conversation.id);
    loadConversationMessages(conversation.id);
    
  };



  const handleDeleteConversation = (id) => {
    setConversationModal({ id, action: "delete" });
  };


  const activeConversations = conversations.filter(
    (c) => c.status !== "archived"
  );

  const archivedConversations = conversations.filter(
    (c) => c.status === "archived"
  );



  // Función de escritura progresiva
  const typeWriterEffect = (text, onUpdate, onFinish) => {
    let i = 0;
    const speed = 20;
    const interval = setInterval(() => {
      if (i < text.length) {
        onUpdate(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        onFinish?.();
      }
    }, speed);
  };

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

      <Header onConnectApp={handleConnectApp} connectedApps={connectedApps} onDeleteAccount={() => setShowDeleteAccountModal(true)}/>
    
    {/* CONTENEDOR PRINCIPAL */}
    <div className="flex flex-1 overflow-hidden relative">
      
      {/* Sidebar toggle (mobile) - Ajustado para evitar superposiciones */}
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
      
      {/* ✅ SIDEBAR mejorado con mejor manejo responsive */}
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
      
      {/* ✅ ÁREA DE CHAT con scroll independiente y padding responsive mejorado */}
      <div className="flex flex-col flex-1 bg-white md:rounded-tl-2xl shadow-inner overflow-hidden w-full md:w-auto">
        {/* Contenedor de mensajes con padding superior en mobile para el botón toggle */}
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        </div>
        
        
        {/* INPUT AREA - Mejorado con padding responsive */}
        
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Escribe tu mensaje..."
              rows={1}
              className="flex-1 border border-gray-300 rounded-lg px-3 md:px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none overflow-y-auto text-sm md:text-base"
              style={{
                minHeight: '42px',
                maxHeight: '200px',
              }}
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

    {/* Modal de eliminar cuenta - Mejorado con mejor padding mobile */}
    {showDeleteAccountModal && (
      <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative mx-4">
            <button
              onClick={() => setShowDeleteAccountModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              aria-label="Cerrar modal"
            >
              <X size={24} />
            </button>
            <NotificationDeleteAccount
              onClose={() => setShowDeleteAccountModal(false)}
            />
          </div>
        </div>
    
    )}

    {/* Modal de conversación - Mejorado con mejor padding mobile */}
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

              setConversations((prev) => {

                if (action === "delete") {
                  return prev.filter((c) => c.id !== id);
                }

                return prev;
              });

              // limpiar chat si era la activa
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
