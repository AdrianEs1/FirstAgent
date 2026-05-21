import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { geminiSanitizeSchema } from "../services/MarkdownHTMLStyle";


const formatContent = (text) => {
  if (!text) return "";
  return text
    .replace(/\\n/g, '\n')       // literal \n → salto real
    .replace(/\n{3,}/g, '\n\n')  // máximo doble salto
    .trim();
};

function ChatArea({ messages, loading, streamingText }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamingText]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>No hay mensajes aún</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Escribe algo para empezar</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[72%] rounded-2xl px-4 py-3 break-words"
              style={
                msg.role === "user"
                  ? {
                      background: "linear-gradient(135deg, #00b4cc, #7b5ea7)",
                      color: "#fff",
                    }
                  : {
                      background: "rgba(255,255,255,0.06)",
                      border: "0.5px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.85)",
                    }
              }
            >
              <div className="prose prose-sm max-w-none text-sm break-words" style={{ color: "inherit" }}>
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw, [rehypeSanitize, geminiSanitizeSchema]]}
                  components={{
                    p: ({ children }) => (
                      <p style={{ marginBottom: '0.65rem', lineHeight: '1.75', color: 'inherit' }}>{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ color: '#fff', fontWeight: 600 }}>{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.65rem', color: 'inherit' }}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ paddingLeft: '1.25rem', marginBottom: '0.65rem', color: 'inherit' }}>{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li style={{ marginBottom: '0.25rem', lineHeight: '1.7', color: 'inherit' }}>{children}</li>
                    ),
                    code: ({ inline, children }) => inline
                      ? <code style={{ background: 'rgba(0,210,255,0.1)', color: '#00d2ff', padding: '1px 5px', borderRadius: 4, fontSize: '0.8em' }}>{children}</code>
                      : <code>{children}</code>,
                    pre: ({ children }) => (
                      <pre style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem 1rem', overflowX: 'auto', marginBottom: '0.65rem', fontSize: '0.8em' }}>{children}</pre>
                    ),
                  }}
                >
                  {formatContent(msg.content)}
                </ReactMarkdown>
              </div>
              <p
                className="text-xs mt-2"
                style={{ color: msg.role === "user" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)" }}
              >
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))
      )}

      {/*{loading && (
        <div className="flex justify-start">
          <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(0,210,255,0.6)", animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(0,210,255,0.6)", animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "rgba(0,210,255,0.6)", animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}*/}

      {streamingText && (
        <div className="flex justify-start">
          <div
            className="max-w-[72%] rounded-2xl px-4 py-3 break-words"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <div className="prose prose-sm max-w-none text-sm break-words" style={{ color: "inherit" }}>
              <ReactMarkdown
                rehypePlugins={[rehypeRaw, [rehypeSanitize, geminiSanitizeSchema]]}
                components={{
                  p: ({ children }) => (
                    <p style={{ marginBottom: '0.65rem', lineHeight: '1.75', color: 'inherit' }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: '#fff', fontWeight: 600 }}>{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.65rem', color: 'inherit' }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ paddingLeft: '1.25rem', marginBottom: '0.65rem', color: 'inherit' }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginBottom: '0.25rem', lineHeight: '1.7', color: 'inherit' }}>{children}</li>
                  ),
                  code: ({ inline, children }) => inline
                    ? <code style={{ background: 'rgba(0,210,255,0.1)', color: '#00d2ff', padding: '1px 5px', borderRadius: 4, fontSize: '0.8em' }}>{children}</code>
                    : <code>{children}</code>,
                  pre: ({ children }) => (
                    <pre style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem 1rem', overflowX: 'auto', marginBottom: '0.65rem', fontSize: '0.8em' }}>{children}</pre>
                  ),
                }}
              >
                {formatContent(streamingText)}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatArea;