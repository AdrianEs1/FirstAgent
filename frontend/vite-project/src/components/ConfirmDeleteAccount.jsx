import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAgentConfirmDeleteAccount } from "../services/agentServices";

function ConfirmDeleteAccount({onClose}) {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetchAgentConfirmDeleteAccount({ token });
      setResponse(res.message);
    } catch (err) {  
      setError(
        err?.response?.data?.detail ||
        err.message ||
        "Error al eliminar la cuenta"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white p-6 rounded-2xl shadow-xl text-center">

          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Eliminar Cuenta
          </h2>

          <p className="text-gray-600 text-sm mb-6">
            Esta acción es permanente y eliminará toda tu información.
          </p>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold transition
              ${loading ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
          >
            {loading ? "Eliminando cuenta..." : "Eliminar definitivamente"}
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
      </div>
    </div>
  );
}

export default ConfirmDeleteAccount;
