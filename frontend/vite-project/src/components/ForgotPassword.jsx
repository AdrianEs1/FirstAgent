import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAgentForgotPassword } from "../services/agentServices";


function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setemail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState("");


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
                <div className="bg-cyan-50 p-6 rounded-xl shadow-xl">
                    <h2 className="text-2xl font-bold text-center mb-4">
                        Restablecer Contraseña
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setemail(e.target.value)}
                            className="border rounded w-full py-2 px-2"
                            placeholder="correo electónico"
                            disabled={loading}
                        />

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
