import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAgentLogin, fetchCurrentUser } from "../services/agentServices";
import { useAuth } from "../context/AuthContext";

function LoginCard({ onSwitchToRegister }) {  // ✅ Recibe prop
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email || !password) {
            setError("Todos los campos son obligatorios");
            setLoading(false);
            return;
        }

        try {
            const loginData = await fetchAgentLogin({ email, password });
            //localStorage.setItem('access_token', loginData.access_token);
            const userData = await fetchCurrentUser(loginData.access_token);
            login(userData);
            
            setTimeout(() => {
                navigate('/agentPage');
            }, 500);

        } catch (error) {
            console.error("Error en el login", error);
            const errorMessage = error.detail || error.message || "Error al iniciar sesión. Intenta nuevamente.";
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="bg-cyan-50 p-6 rounded-xl shadow-xl max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-center text-black mb-4 pb-3">Login</h2>
            
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="pb-2 flex justify-center">
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-2 border-gray-500/100 rounded-lg pl-2 w-full py-2"
                        placeholder="correo electrónico"
                        disabled={loading}
                    />
                </div>

                <div className="pb-2 flex justify-center">
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-2 border-gray-500/100 rounded-lg pl-2 w-full py-2"
                        placeholder="password"
                        disabled={loading}
                    />
                </div>

                <div className="pt-4">
                    <button 
                        className={`bg-cyan-500 shadow-lg shadow-cyan-500/50 text-white font-bold px-4 py-2 rounded-md hover:bg-cyan-600 w-full flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Ingresando...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </div>
            </form>

            <div className="pt-3 flex-row text-center text-gray-700">
                <p>¿No tienes cuenta?{' '}
                    {onSwitchToRegister ? (
                        <button 
                            onClick={onSwitchToRegister}
                            className="text-cyan-600 hover:underline font-semibold"
                        >
                            Regístrate
                        </button>
                    ) : (
                        <a href="/register" className="text-cyan-600 hover:underline font-semibold">
                            Regístrate
                        </a>
                    )}
                </p>
            </div>
        </div>
    );
}

export default LoginCard;