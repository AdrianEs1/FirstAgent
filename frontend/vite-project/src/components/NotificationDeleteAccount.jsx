import { useState } from "react";
import { fetchAgentAccountDelection } from "../services/agentServices";
import {X} from "lucide-react";

function NotificationDeleteAccountCard({onClose}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(""); 

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError("");

    try {
      const resp = await fetchAgentAccountDelection();
      setResponse(resp.message);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err.message ||
        "Error al solicitar eliminación de cuenta"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm mx-auto w-full text-center">

      {onClose && (
        <div className="flex justify-end mb-2">
            <button
            onClick={onClose}
            className="top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
            >
                <X size={20} />
            </button>

        </div>
        
      )}

      <div className="mb-4 mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86L12 5.2 5.07 19z" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Eliminar cuenta
      </h3>

      <p className="text-gray-600 text-sm mb-6">
        Esta acción es <span className="font-semibold text-red-600">permanente</span>.
        Te enviaremos un correo para confirmar la eliminación.
      </p>

      <button
        onClick={handleDeleteAccount}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-semibold transition
          ${loading ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
      >
        {loading ? "Enviando correo..." : "Confirmar eliminación"}
      </button>

      {response && (
        <p className="text-green-600 mt-4 text-sm">
          {response}
        </p>
      )}

      {error && (
        <p className="text-red-600 mt-4 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export default NotificationDeleteAccountCard;
