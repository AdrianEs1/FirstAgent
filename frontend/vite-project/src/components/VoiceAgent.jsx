import React, { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

export function VoiceAgent({ onSend, className = "" }) {
  const [listening, setListening] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const toggleListening = async () => {
    if (listening) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setListening(false);
        stream.getTracks().forEach(t => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        console.log("🎤 Audio grabado:", { 
          blobSize: blob.size, 
          base64Length: base64.length,
          preview: base64.substring(0, 50)
        });

        if (onSend) onSend(base64);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setListening(true);
    } catch (err) {
      console.error("❌ Error accediendo al micrófono:", err);
      alert("No se pudo acceder al micrófono.");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`flex items-center justify-center flex-shrink-0 rounded-xl transition relative group ${className}`}
      style={{
        width: 44, height: 44,
        background: listening ? "rgba(239, 68, 68, 0.18)" : "rgba(255, 255, 255, 0.05)",
        border: listening ? "1px solid rgba(239, 68, 68, 0.45)" : "1px solid rgba(255, 255, 255, 0.08)",
        color: listening ? "#f87171" : "rgba(255, 255, 255, 0.6)",
      }}
      title={listening ? "Detener grabación" : "Dictar mensaje"}
    >
      {listening && <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping pointer-events-none" />}
      {listening
        ? <MicOff size={18} className="animate-pulse" />
        : <Mic size={18} className="group-hover:text-white transition-colors" />}
    </button>
  );
}

export default VoiceAgent;