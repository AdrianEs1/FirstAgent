import React, { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

export function VoiceAgent({ onSend, className = "" }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-CO";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("🎤 Micrófono activado");
      setListening(true);
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      console.log("✅ Transcript:", transcript);
      if (transcript && onSend) onSend(transcript);
    };

    recognition.onerror = (e) => {
      console.log("❌ Error código:", e.error, "| mensaje:", e.message);
      setListening(false);
    };

    recognition.onend = () => {
      console.log("🔴 Micrófono desactivado");
      setListening(false);
    };

    recognition.onnomatch = () => {
      console.log("⚠️ No se reconoció ninguna palabra");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`flex items-center justify-center flex-shrink-0 rounded-xl transition relative group ${className}`}
      style={{
        width: 44,
        height: 44,
        background: listening
          ? "rgba(239, 68, 68, 0.18)"
          : "rgba(255, 255, 255, 0.05)",
        border: listening
          ? "1px solid rgba(239, 68, 68, 0.45)"
          : "1px solid rgba(255, 255, 255, 0.08)",
        color: listening ? "#f87171" : "rgba(255, 255, 255, 0.6)",
      }}
      title={listening ? "Detener grabación" : "Dictar mensaje"}
      aria-label="Dictar mensaje por voz"
    >
      {listening && (
        <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping pointer-events-none" />
      )}
      {listening ? (
        <MicOff size={18} className="animate-pulse" />
      ) : (
        <Mic size={18} className="group-hover:text-white transition-colors" />
      )}
    </button>
  );
}

export default VoiceAgent;