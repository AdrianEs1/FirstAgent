import { useState } from "react";
import {
  fetchAgentDeleteConversation,
} from "../services/agentServices";

function DeleteArchiveConversation({
  conversationId,
  action, // "archive" | "delete"
  onClose,
  onSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDelete = action === "delete"
  const [success, setSuccess] = useState("");


  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    console.log("ACTION:", action);
    console.log("ID:", conversationId);
    console.log("DELETE FN:", fetchAgentDeleteConversation);

    try {
      if (isDelete) {
          await fetchAgentDeleteConversation(conversationId);
        } 
      
      if (isDelete) {
        setSuccess("Conversación eliminada correctamente");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err.message ||
        "Ocurrió un error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
        
        <h2
          className={`text-2xl font-bold mb-4 ${
            isDelete
              && "text-red-600"
          }`}
        >
          {isDelete
            && "Eliminar conversación"
          }
        </h2>


        <p className="text-gray-600 text-sm mb-6">
          {isDelete && "Esta acción es permanente y no se puede deshacer."}
        </p>


        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm mb-4">{success}</p>
        )}


        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-white font-semibold transition bg-red-600 hover:bg-red-700"
          >
            {loading ? "Procesando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteArchiveConversation;



