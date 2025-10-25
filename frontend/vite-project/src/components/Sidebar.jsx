import { Plus, Search } from 'lucide-react';

function Sidebar({ 
    conversations, 
    activeConversationId, 
    onSelectConversation, 
    onNewConversation,
    isOpen,
    onClose
}) {
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
                {/* Nueva Tarea Button */}
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

                {/* Search */}
                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar conversaciones..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Conversaciones Recientes
                    </h3>
                    <div className="space-y-1">
                        {conversations.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                No hay conversaciones aún
                            </p>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        onSelectConversation(conv.id);
                                        onClose();
                                    }}
                                    className={`
                                        w-full text-left px-3 py-3 rounded-lg transition
                                        ${activeConversationId === conv.id
                                            ? 'bg-cyan-600 text-white shadow-md'
                                            : 'hover:bg-white hover:shadow'
                                        }
                                    `}
                                >
                                    <p className={`font-medium text-sm truncate ${
                                        activeConversationId === conv.id ? 'text-white' : 'text-gray-800'
                                    }`}>
                                        {conv.title}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                        activeConversationId === conv.id ? 'text-cyan-100' : 'text-gray-500'
                                    }`}>
                                        {new Date(conv.last_message_at).toLocaleDateString()}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;