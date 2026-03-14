import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAgentForgotPassword } from "../services/agentServices";
import { useFormFields } from "../hooks/useFormFields";


function ForgotPassword() {
    const navigate = useNavigate();

    const [response, setResponse] = useState("");
    const {email, error, setError, loading, setLoading, handleEmailChange, handleEmailBlur, fieldErrors, MAX_EMAIL_LENGTH} = useFormFields();


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email) {
            setError("Ingrese su correo");
            setLoading(false);
            return;
        }

        try {
            const res = await fetchAgentForgotPassword({
                email
            });

            setResponse(res.message);
            setLoading(false);

            // opcional
            // setTimeout(() => navigate("/login"), 2000);

        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                err.message ||
                "Error al verficar su cuenta"
            );
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-0 ">
            <div className="w-full max-w-sm">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm mx-auto w-full border border-gray-100">
                    <h2 className="text-2xl font-bold text-center mb-4">
                        Restablecer Contraseña
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <div>
                            <input 
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                onBlur={handleEmailBlur}
                                maxLength={MAX_EMAIL_LENGTH + 1} // Dejamos +1 para que el onChange detecte el intento de exceso y dispare la alerta
                                className={`w-full border-2 rounded-xl py-3 px-4 outline-none transition-all ${
                                    fieldErrors.email 
                                    ? "border-red-300 bg-red-50 focus:ring-red-500" 
                                    : "border-gray-100 bg-gray-50 focus:ring-cyan-500"
                                }`}
                                placeholder="ejemplo@correo.com"
                                disabled={loading}
                            />
                            {fieldErrors.email && (
                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-wider">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <button
                            className="bg-cyan-500 text-white font-bold px-4 py-2 rounded w-full mt-4"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Verificando cuenta..." : "Verificar"}
                        </button>

                        {response && (
                            <p className="text-green-600 mt-4 text-center">
                                {response}
                            </p>
                        )}
                    </form>

                </div>
                

            </div>
            
        </div>
    );
}

export default ForgotPassword;
