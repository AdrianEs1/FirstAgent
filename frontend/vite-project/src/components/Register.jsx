import { useState } from "react";
import { fetchAgentRegister } from "../services/agentServices";

function RegisterCard({ onSwitchToLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email || !password || !name) {
            setError("Todos los campos son obligatorios");
            setLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            setLoading(false);
            return;
        }

        try {
            await fetchAgentRegister({ email, password, name });
            setSuccess(true);
            
            setTimeout(() => {
                if (onSwitchToLogin) {
                    onSwitchToLogin();
                }
            }, 2000);

        } catch (error) {
            console.error("Error en el registro", error);
            const errorMessage = error.detail || error.message || "Error al registrarse";
            setError(errorMessage);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-cyan-50 p-6 rounded-xl shadow-xl max-w-sm mx-auto w-full text-center py-12">
                <div className="mb-4 mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Registro exitoso!</h3>
                <p className="text-gray-600">Redirigiendo al login...</p>
            </div>
        );
    }

    return (
        <div className="bg-cyan-50 p-6 rounded-xl shadow-xl max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-center text-black mb-4 pb-3">Crear Cuenta</h2>
            
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="pb-2 flex justify-center">
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-2 border-gray-500/100 rounded-lg pl-2 w-full py-2"
                        placeholder="nombre completo"
                        disabled={loading}
                    />
                </div>

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
                        placeholder="contraseña (mínimo 8)"
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
                                Registrando...
                            </>
                        ) : (
                            'Crear Cuenta'
                        )}
                    </button>
                </div>
            </form>

            <div className="pt-3 flex-row text-center text-gray-700">
                <p>¿Ya tienes cuenta?{' '}
                    {onSwitchToLogin ? (
                        <button 
                            onClick={onSwitchToLogin}
                            className="text-cyan-600 hover:underline font-semibold"
                        >
                            Inicia sesión
                        </button>
                    ) : (
                        <a href="/login" className="text-cyan-600 hover:underline font-semibold">
                            Inicia sesión
                        </a>
                    )}
                </p>
            </div>
        </div>
    );
}

export default RegisterCard;