import { useState, useRef, useEffect } from "react";
import { Plus, Search, MoreVertical, Trash2 } from "lucide-react";

function Sidebar({ conversations, activeConversationId, onSelectConversation, onNewConversation, onDeleteConversation, isOpen, onClose }) {
  const [search, setSearch]         = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const botonRef = useRef(null);

  const filteredConversations = conversations.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e) => {
      if (botonRef.current && !botonRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <aside
      style={{ background: "#070f23", borderRight: "0.5px solid rgba(255,255,255,0.07)" }}
      className={`
        fixed md:static top-0 left-0 h-full
        w-64 md:w-80
        shadow-xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        z-50 md:z-auto flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      {/* Nueva conversación */}
      <div className="p-4 flex-shrink-0">
        <button
          onClick={() => { onNewConversation(); onClose(); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition"
          style={{
            background: "linear-gradient(90deg, rgba(0,210,255,0.15), rgba(123,94,167,0.15))",
            border: "0.5px solid rgba(0,210,255,0.35)",
            color: "#00d2ff",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(90deg, rgba(0,210,255,0.22), rgba(123,94,167,0.22))"}
          onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(90deg, rgba(0,210,255,0.15), rgba(123,94,167,0.15))"}
        >
          <Plus size={18} />
          Nueva Tarea
        </button>
      </div>

      {/* Buscador */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-3 pointer-events-none" size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
            onFocus={e => e.target.style.border = "0.5px solid rgba(0,210,255,0.4)"}
            onBlur={e => e.target.style.border = "0.5px solid rgba(255,255,255,0.1)"}
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="text-xs font-semibold uppercase mb-2 px-2" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
          Conversaciones recientes
        </p>

        {conversations.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>No hay conversaciones aún</p>
        ) : filteredConversations.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.3)" }}>No se encontraron conversaciones</p>
        ) : (
          <div className="space-y-0.5">
            {filteredConversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  className="group relative flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition"
                  style={{
                    background: isActive ? "rgba(0,210,255,0.12)" : "transparent",
                    border: isActive ? "0.5px solid rgba(0,210,255,0.25)" : "0.5px solid transparent",
                  }}
                  onClick={() => { onSelectConversation(conv); onClose(); }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: isActive ? "#00d2ff" : "rgba(255,255,255,0.75)" }}>
                      {conv.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: isActive ? "rgba(0,210,255,0.5)" : "rgba(255,255,255,0.25)" }}>
                      {new Date(conv.last_message_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === conv.id ? null : conv.id); }}
                    className="opacity-0 group-hover:opacity-100 transition p-1 rounded"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openMenuId === conv.id && (
                    <div
                      ref={botonRef}
                      className="absolute right-2 top-11 w-40 rounded-xl z-50 overflow-hidden"
                      style={{ background: "#0d1832", border: "0.5px solid rgba(255,255,255,0.1)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => { onDeleteConversation(conv.id); setOpenMenuId(null); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition"
                        style={{ color: "#ff6b6b" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,100,100,0.08)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <Trash2 size={15} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;