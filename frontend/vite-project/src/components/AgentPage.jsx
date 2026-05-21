import { useState, useEffect, useRef } from "react";
import { useSSE } from "../hooks/useSSE";
import EventIndicator from "../components/EventIndicator";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SidebarRight from "../components/SidebarRight";
import ChatArea from "../components/ChatArea";
import NotificationDeleteAccount from "../components/NotificationDeleteAccount";
import DeleteArchiveConversation from "../components/DeleteArchiveConversation";

import {
  fetchConversations,
  fetchConversationById,
  fetchAgentSendFiles,
  fetchAgentGetFiles,
  fetchAgentDeleteFiles,
  getOAuthStatus,
  connectOAuth,
  disconnectOAuth,
} from "../services/agentServices";
import { Menu, X, Send, Mail, Sheet, Users, Target } from "lucide-react";

// ─── Hex background SVG (memo-ized as static string) ───────────────────────
const HEX_ROWS = [
  [60, 120, 180, 240, 300, 360, 420, 480, 540],
  [30, 90, 150, 210, 270, 330, 390, 450, 510, 570],
  [60, 120, 180, 240, 300, 360, 420, 480, 540],
  [30, 90, 150, 210, 270, 330, 390, 450, 510, 570],
];
const HEX_Y_START = [20, 90, 160, 230];

function HexBackground() {
  const hexPoints = (cx, cy, r = 35) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.045 }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="100%" stopColor="#7b5ea7" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#hg)" strokeWidth="0.8">
        {HEX_ROWS.map((row, ri) =>
          row.map((cx) => (
            <polygon key={`${ri}-${cx}`} points={hexPoints(cx, HEX_Y_START[ri] + 40)} />
          ))
        )}
      </g>
    </svg>
  );
}

// ─── Wave accent ────────────────────────────────────────────────────────────
function WaveAccent() {
  return (
    <svg
      className="absolute bottom-16 left-0 right-0 w-full pointer-events-none"
      style={{ height: "100px", opacity: 0.12 }}
      viewBox="0 0 800 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 50 Q200 10 400 60 T800 30" fill="none" stroke="#00d2ff" strokeWidth="1.2" />
      <path d="M0 70 Q200 30 400 80 T800 50" fill="none" stroke="#7b5ea7" strokeWidth="0.8" />
    </svg>
  );
}

// ─── Quick-action chips ──────────────────────────────────────────────────────
const CHIPS = ["Revisar correos", "Crear tarea", "Resumir archivo", "Agendar reunión"];

// ─── Main component ──────────────────────────────────────────────────────────
function AgentPage() {
  const { user } = useAuth();
  const textareaRef = useRef(null);

  // ── Auto-resize textarea ─────────────────────────────────────────────────


  const {
    isSending,
    currentEvent,
    streamingText,   
    sendMessage: sendSSEMessage,
    addEventListener,
  } = useSSE();



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

  const apps = [
    { id: 'google:gmail', name: 'Gmail', icon: Mail, color: 'text-red-500' },
    { id: 'google:sheets', name: 'Sheets', icon: Sheet, color: 'text-green-500' },
    { id: 'microsoft:teams', name: 'Teams', icon: Users, color: 'text-blue-500' }
    //{ id: 'hubspot:crm', name: 'HubSpot', icon: Target, color: 'text-orange-500' }
  ];

  const [files, setFiles] = useState([]);


  const handleGetFiles = async () => {
    try {
      const res = await fetchAgentGetFiles();
      setFiles(res.file);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFilesSelected = async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    await fetchAgentSendFiles(formData);
    await handleGetFiles();
  };

  const handleDeleteFile = async (file_id) => {
    await fetchAgentDeleteFiles(file_id);
    await handleGetFiles();
  };

  useEffect(() => {
    handleGetFiles();
  }, []);

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
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"; // ← agregar límite
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
      //console.error("Error cargando conversaciones:", error);
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
      //console.error("Error cargando mensajes:", error);
      setMessages([]);
    }
  };

  // ── OAuth ─────────────────────────────────────────────────────────────────
  const checkOAuthStatus = async () => {
    const integrations = ["google:gmail", "google:sheets", "microsoft:teams"];

    try {
      const statuses = await Promise.all(
        integrations.map((i) =>
          getOAuthStatus(i).catch(() => ({ connected: false }))
        )
      );

      const newStates = integrations.reduce((acc, i, index) => {
        acc[i] = statuses[index].connected;
        return acc;
      }, {});

      setConnectedApps((prev) => ({ ...prev, ...newStates }));
    } catch (error) {
      //console.error("Error verificando OAuth:", error);
    }
  };

  const handleConnectApp = async (appId) => {
    const isConnected = connectedApps[appId];
    const appName = appId.split(":")[1];

    if (isConnected) {
      try {
        await disconnectOAuth(appId);
        await checkOAuthStatus();
        alert(`${appName} desconectado exitosamente`);
      } catch (error) {
        //console.error(`Error desconectando ${appName}:`, error);
        alert(`Error al desconectar ${appName}`);
      }
    } else {
      try {
        const result = await connectOAuth(appId);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await checkOAuthStatus();

        if (result?.connected) {
          setConnectedApps(prev => ({ ...prev, [appName]: true }));
        }

        await checkOAuthStatus();
        alert(`${appName} conectado exitosamente`);
      } catch (error) {
        //console.error(`❌ Error conectando ${appName}:`, error);
        alert(`Error al conectar ${appName}`);
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

      //console.log("✅ Mensaje completado:", data);

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
      //console.error("Error enviando mensaje:", error);
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

  const activeConversations = conversations.filter(c => c.status !== "archived");
  const archivedConversations = conversations.filter(c => c.status === "archived");

  // ─────────────────────────────────────────────────────────────────────────

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loadingConversations) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d1f" }}>
        <div className="text-center">
          <div
            className="rounded-full mx-auto mb-4"
            style={{
              width: 56, height: 56,
              border: "3px solid rgba(0,210,255,0.15)",
              borderTop: "3px solid #00d2ff",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Cargando AssistWork...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#050d1f" }}>

      {/* HEADER */}
      <Header
        apps={apps}
        onConnectApp={handleConnectApp}
        connectedApps={connectedApps}
        onDeleteAccount={() => setShowDeleteAccountModal(true)}
        files={files}
        onFilesSelected={handleFilesSelected}
        onDeleteFile={handleDeleteFile}
      />

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-3 left-3 md:hidden z-30 p-2 rounded-lg transition"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
          aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* SIDEBAR IZQUIERDO */}
        <Sidebar
          conversations={showArchived ? archivedConversations : activeConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* ÁREA DE CHAT */}
        <div
          className="flex flex-col flex-1 overflow-hidden relative"
          style={{ background: "#07111f" }}
        >
          {/* Hex background siempre visible */}
          <HexBackground />

          {/* Mensajes o pantalla de bienvenida */}
          <div className="flex-1 overflow-y-auto pt-14 md:pt-0 relative z-10">
            {!activeConversationId && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center relative">
                {/* Orb */}
                <div
                  className="flex items-center justify-center rounded-full mb-2"
                  style={{
                    width: 64, height: 64,
                    background: "radial-gradient(circle, rgba(0,210,255,0.2), rgba(123,94,167,0.1))",
                    border: "1px solid rgba(0,210,255,0.3)",
                    fontSize: 28,
                    animation: "orbPulse 3s ease-in-out infinite",
                  }}
                >
                  🤖
                </div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#fff" }}>
                  Bienvenido, {user?.name || user?.email}
                </h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Escribe un mensaje para empezar una nueva conversación
                </p>
                {/* Chips */}
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setNewMessage(chip)}
                      className="px-4 py-2 rounded-full text-sm transition"
                      style={{
                        background: "rgba(0,210,255,0.07)",
                        border: "0.5px solid rgba(0,210,255,0.2)",
                        color: "rgba(0,210,255,0.8)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,210,255,0.13)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(0,210,255,0.07)"}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <ChatArea messages={messages} loading={false} streamingText={streamingText} />
                {loading && currentEvent && <EventIndicator event={currentEvent} />}
                {loading && !currentEvent && (
                  streamingText ? null : (
                    <div className="flex justify-start px-4 pb-4">
                      <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                        <div className="flex gap-1.5">
                          {[0, 150, 300].map((delay) => (
                            <div key={delay} className="w-2 h-2 rounded-full animate-bounce"
                              style={{ background: "rgba(0,210,255,0.6)", animationDelay: `${delay}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </div>

          {/* Wave decorativa */}
          <WaveAccent />

          {/* INPUT */}
          <form
            onSubmit={handleSendMessage}
            className="relative z-10 flex-shrink-0 px-3 md:px-4 pb-4 pt-2 mb-6"
            style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
          >
            <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">

              {/* Borde animado */}
              <div className="flex-1 relative rounded-xl p-[2px] overflow-hidden">
                <div className="animated-border" />
                <div className="relative rounded-[10px]" style={{ background: "#0d1832" }}>
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
                    className="block w-full px-3 md:px-4 py-2.5 bg-transparent focus:ring-0 focus:outline-none resize-none overflow-y-auto text-sm md:text-base"
                    style={{
                      minHeight: "44px",
                      maxHeight: "200px",
                      color: "rgba(255,255,255,0.85)",
                      caretColor: "#00d2ff",
                    }}
                  />
                </div>
              </div>

              {/* Botón enviar */}
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="flex items-center justify-center flex-shrink-0 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  width: 44, height: 44,
                  background: "linear-gradient(135deg, #00d2ff, #7b5ea7)",
                  border: "none",
                  color: "#fff",
                }}
                aria-label="Enviar mensaje"
              >
                <Send size={18} />
              </button>

            </div>
          </form>
        </div>

        {/* SIDEBAR DERECHO */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 overflow-y-auto"
          style={{
            width: 220,
            background: "#070f23",
            borderLeft: "0.5px solid rgba(255,255,255,0.07)",
            padding: "20px 14px",
          }}
        >
          <SidebarRight
            apps={apps}
            connectedApps={connectedApps}
            onConnectApp={handleConnectApp}
            files={files}
            onFilesSelected={handleFilesSelected}
            onDeleteFile={handleDeleteFile}
          />
        </aside>

      </div>

      {/* Modal eliminar cuenta */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <NotificationDeleteAccount onClose={() => setShowDeleteAccountModal(false)} />
        </div>
      )}

      {/* Modal conversación */}
      {conversationModal && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md relative mx-4 rounded-2xl overflow-hidden" style={{ background: "#0d1832", border: "0.5px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setConversationModal(null)}
              className="absolute top-4 right-4 z-10 p-1 rounded-lg transition"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              aria-label="Cerrar modal"
            >
              <X size={22} />
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