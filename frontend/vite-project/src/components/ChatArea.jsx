import { useEffect, useRef } from 'react';

function ChatArea({ messages, loading }) {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {

        // 🟢 Desplaza suavemente hacia el final cada vez que cambian los mensajes
        // o cuando el loading cambia (para que siga el "efecto de escritura")
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });
    }, [messages, loading]);


    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p className="text-lg font-medium">No hay mensajes aún</p>
                    <p className="text-sm">Escribe algo para empezar</p>
                </div>
            ) : (
                messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                msg.role === 'user'
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-xs mt-2 ${
                                msg.role === 'user' ? 'text-cyan-100' : 'text-gray-500'
                            }`}>
                                {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))
            )}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatArea;