import { useState, useRef, useEffect } from 'react';
import { Plus, Search, MoreVertical, Archive, Trash2 } from 'lucide-react';

function Sidebar({ 
  conversations, 
  activeConversationId,
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [search, setSearch] = useState("");
  const filteredConversations = conversations.filter((conv) =>
    (conv.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const botonRef = useRef(null)


  useEffect(() => {
      function handleClickOutside(event) {
        if (botonRef.current && !botonRef.current.contains(event.target)) {
          setOpenMenuId(null); // cerrar botón
        }
      }

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
  


  return (
    <aside
      className={`
        fixed md:static
        top-0 left-0
        h-full
        w-64 bg-gradient-to-b from-gray-50 to-gray-100
        shadow-xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        z-50 md:z-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      <div className="flex flex-col h-full">
        {/* Nueva conversación */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewConversation();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 transition font-medium shadow-md"
          >
            <Plus size={20} />
            Nueva Tarea
          </button>
        </div>

        {/* Buscador (frontend-only por ahora) */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

          </div>
        </div>
        

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto px-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Conversaciones recientes
          </h3>

          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay conversaciones aún
            </p>
          ) : (
            <div className="space-y-1">

              {filteredConversations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No se encontraron conversaciones
                </p>
              ) : (
                filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`
                    group relative flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition
                    ${activeConversationId === conv.id
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'hover:bg-white hover:shadow'
                    }
                  `}
                  onClick={() => {
                    onSelectConversation(conv);
                    onClose();
                  }}
                >
                  {/* Info conversación */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-sm truncate ${
                        activeConversationId === conv.id
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                    >
                      {conv.title}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        activeConversationId === conv.id
                          ? 'text-cyan-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(conv.last_message_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Botón tres puntos */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-black/10"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Menú contextual */}
                  {openMenuId === conv.id && (
                    <div
                      ref={botonRef}
                      className="absolute right-2 top-12 w-44 bg-white rounded-xl shadow-lg border z-50"
                      onClick={(e) => e.stopPropagation()}
                    >

                      <button
                        onClick={() => {
                          onDeleteConversation(conv.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  )}

                </div>
              ))
                
            )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
