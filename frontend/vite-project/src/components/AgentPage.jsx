import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import EventIndicator from "../components/EventIndicator";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import {
  fetchConversations,
  fetchConversationById,
  sendMessageToConversation,
  getOAuthStatus,
  connectOAuth,
  disconnectOAuth,
} from "../services/agentServices";
import { Menu, X, Send } from "lucide-react";

function AgentPage() {
  const { user } = useAuth();

  // Hook de WebSocket
  const { 
    isConnected, 
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
    const services = ["gmail", "drive", "calendar"];
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

    if (isConnected) {
      // 🔌 Desconectar app
      try {
        await disconnectOAuth(appId);
        setConnectedApps((prev) => ({ ...prev, [appId]: false }));
        alert(`${appId} desconectado exitosamente`);
      } catch (error) {
        console.error(`Error desconectando ${appId}:`, error);
        alert(`Error al desconectar ${appId}`);
      }
    } else {
      // 🔗 Conectar app (popup manejado desde connectOAuth)
      try {
        const result = await connectOAuth(appId);
        setConnectedApps((prev) => ({ ...prev, [appId]: true }));
        alert(`${appId} conectado exitosamente (${result.email || "sin correo"})`);
      } catch (error) {
        console.error(`Error conectando ${appId}:`, error);
        alert(`Error al conectar ${appId}`);
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
  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    loadConversationMessages(id);
  };

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
          <p className="text-gray-600">Cargando OptimusAgent...</p>
        </div>
      </div>
    );
  }

  

  return (
    <div className="flex flex-col h-screen bg-gray-50">
    {/* HEADER */}
    <Header onConnectApp={handleConnectApp} connectedApps={connectedApps} />
    
    {/* CONTENEDOR PRINCIPAL */}
    <div className="flex flex-1 overflow-hidden relative">
      {/* Sidebar toggle (mobile) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 left-4 md:hidden z-30 bg-white p-2 rounded-lg shadow hover:bg-gray-100"
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
      
      {/* ✅ SIDEBAR con scroll propio y posición fija */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 md:w-80 w-64 bg-white shadow-lg z-50 flex-shrink-0 fixed md:static top-0 left-0 h-full overflow-y-auto`}
      >
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </aside>
      
      {/* ✅ ÁREA DE CHAT con scroll independiente */}
      <div className="flex flex-col flex-1 bg-white rounded-tl-2xl shadow-inner overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {!activeConversationId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-gray-500 p-8 h-full">
              <h2 className="text-2xl font-bold mb-2">
                Bienvenido, {user?.name || user?.email}
              </h2>
              <p className="text-center mb-6">
                Escribe un mensaje para empezar una nueva conversación
              </p>
            </div>
          )}
          {(activeConversationId || messages.length > 0) && (
          <>
            <ChatArea messages={messages} loading={false} />
            {loading && currentEvent && <EventIndicator event={currentEvent} />}
            {loading && !currentEvent && (
              <div className="flex justify-start p-6">
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
        
        
        {/* INPUT AREA */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 p-4 bg-gray-50"
        >
          <div className="max-w-4xl mx-auto flex items-center gap-3">
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
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none overflow-y-auto"
              style={{
                minHeight: '42px',
                maxHeight: '200px',
              }}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-cyan-600 text-white p-2 rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  );
}

export default AgentPage;
