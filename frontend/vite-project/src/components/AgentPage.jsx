import { useState, useEffect } from "react";
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
    try {
      const gmailStatus = await getOAuthStatus("gmail");
      setConnectedApps((prev) => ({
        ...prev,
        gmail: gmailStatus.connected,
      }));
    } catch (error) {
      console.error("Error verificando OAuth:", error);
    }
  };

  // ✅ Conexión/desconexión de apps (versión optimizada)
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
      // 🔗 Conectar app
      try {
        const { authorization_url } = await connectOAuth(appId);

        // Abre la ventana emergente de OAuth
        const popup = window.open(
          authorization_url,
          `${appId}-oauth`,
          "width=600,height=700,left=200,top=100"
        );

        if (!popup) {
          alert("Por favor, permite ventanas emergentes para continuar con la autenticación.");
          return;
        }

        // Escucha mensajes del popup cuando finaliza OAuth
        const handleMessage = (event) => {
          // 🔒 Seguridad: valida el origen
          if (event.origin !== "http://localhost:5000") return;

          if (event.data.status === "success" && event.data.app === appId) {
            setConnectedApps((prev) => ({ ...prev, [appId]: true }));
            popup.close();
            window.removeEventListener("message", handleMessage);
            alert(`${appId} conectado exitosamente`);
          } else if (event.data.status === "error") {
            popup.close();
            window.removeEventListener("message", handleMessage);
            alert(`Error al conectar ${appId}`);
          }
        };

        window.addEventListener("message", handleMessage);
      } catch (error) {
        console.error(`Error conectando ${appId}:`, error);
        alert(`Error al conectar ${appId}`);
      }
    }
  };


  // ✅ Enviar mensaje (crea conversación automáticamente si no existe)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const messageToSend = newMessage;
    setNewMessage("");
    setLoading(true);

    try {
      // ✅ El backend crea la conversación automáticamente
      const response = await sendMessageToConversation(
        activeConversationId,
        messageToSend, user?.id
      );

      // Si es la primera conversación, actualizar el ID
      

      // ✅ Si es una nueva conversación, usar el título generado y actualizar lista localmente
      if (response.conversation_id && !activeConversationId) {
        const newConv = {
          id: response.conversation_id,
          title: response.title || messageToSend.slice(0, 50) + "...",
          status: "active",
          last_message_at: new Date().toISOString(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(response.conversation_id);
      }


      // Mensaje del asistente (con animación)
      // Mensaje del asistente (con animación)
      const botMsg = {
        id: `temp-${Date.now() + 1}`,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);

      // Animar escritura
      typeWriterEffect(
        response.message,
        (partialText) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsg.id ? { ...m, content: partialText } : m
            )
          );
        },
        () => {
          setLoading(false);
          // ⚡ Evita recargar toda la lista de conversaciones
          // Solo actualiza localmente si es necesario
          if (response.conversation_id && !activeConversationId) {
            setActiveConversationId(response.conversation_id);
            //loadConversations();
          }
        }
      );

    } catch (error) {
      console.error("Error enviando mensaje:", error);
      const errorMsg = {
        id: `temp-${Date.now() + 2}`,
        role: "assistant",
        content: "Error al procesar tu solicitud. Por favor, intenta nuevamente.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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
            <ChatArea messages={messages} loading={loading} />
          )}
        </div>
        
        {/* INPUT AREA */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 p-4 flex items-center gap-3 bg-gray-50"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-cyan-600 text-white p-2 rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  </div>

  );
}

export default AgentPage;
