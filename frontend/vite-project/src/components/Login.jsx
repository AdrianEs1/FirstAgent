import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAgentLogin, fetchCurrentUser, fetchAgentVerifyEmailCode, fetchAgentResendEmailCode } from "../services/agentServices";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "./PasswordInput";
import { Link } from "react-router-dom";
import {X} from "lucide-react";
import { validateEmail } from "../services/validInput";
import { useFormFields, MAX_EMAIL_LENGTH } from "../hooks/useFormFields";

function LoginCard({ onSwitchToRegister, onClose}) {
    const { login } = useAuth();
    const [verifiedAccount, setVerifiedAccount] = useState("");
    const navigate = useNavigate();
    const {
    email, password, code, error, loading, step, fieldErrors,
    setCode, setError, setLoading, setStep,
    handleEmailChange, handleEmailBlur, handlePasswordChange, handleCodeChange,
    } = useFormFields();
    

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        
        // 1. Sanitización y Validaciones previas
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
            setError("Por favor, completa todos los campos.");
            return;
        }

        if (!validateEmail(cleanEmail)) {
            setError("El formato del correo electrónico no es válido.");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            const loginData = await fetchAgentLogin({ email: cleanEmail, password });

            if (!loginData?.access_token) {
                throw new Error("Credenciales inválidas");
            }

            const userData = await fetchCurrentUser(loginData.access_token);
            login(userData);
            setStep("success");
            setTimeout(() => navigate("/agentPage"), 1500);

        } catch (err) {
            const status = err?.response?.status;
            if (status === 403) {
                setStep("verify");
                await fetchAgentResendEmailCode({ email: cleanEmail });
            } else {
                setError(err?.response?.data?.detail || "Email o contraseña incorrectos");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError("");

        if (code.length !== 6) {
            setError("El código debe ser de 6 dígitos.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetchAgentVerifyEmailCode({ email, code });
            setStep("login");
            setVerifiedAccount(response.message || "¡Cuenta verificada con éxito!");
            setCode("");
        } catch {
            setError("Código inválido o expirado");
        } finally {
            setLoading(false);
        }
    };

    // --- Sub-componente de Verificación ---
    if (step === "verify") {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm mx-auto text-center border border-gray-100">
                <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Verifica tu correo</h3>
                <p className="text-slate-500 mb-6 text-sm">
                    Código enviado a <span className="font-semibold text-slate-700">{email}</span>
                </p>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium">{error}</div>}

                <form onSubmit={handleVerifyCode} className="space-y-4">
                    <input
                        type="text"
                        value={code}
                        onChange={handleCodeChange}
                        maxLength={6}
                        placeholder="000000"
                        className="w-full text-center tracking-[0.5em] text-2xl font-mono border-2 border-gray-100 rounded-xl py-3 focus:border-cyan-500 focus:outline-none transition-all"
                    />
                    <button
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "Validando..." : "Verificar ahora"}
                    </button>
                </form>
            </div>
        );
    }

    // --- Render Principal ---
    return (
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm mx-auto w-full border border-gray-100">

            
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
        
                
            <header className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bienvenido</h2>
                <p className="text-slate-500 text-sm mt-2">Ingresa tus credenciales para continuar</p>
            </header>

            <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-xs font-medium animate-pulse">
                        {error}
                    </div>
                )}

                {verifiedAccount && (
                    <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-800 rounded text-xs font-medium">
                        {verifiedAccount}
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

                <div>
                    <PasswordInput
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Contraseña"
                        disabled={loading}
                        className={`w-full border-2 rounded-xl py-3 px-4 outline-none transition-all ${
                            fieldErrors.email 
                            ? "border-red-300 bg-red-50 focus:ring-red-500" 
                            : "border-gray-100 bg-gray-50 focus:ring-cyan-500"
                        }`}
                    />
                    {fieldErrors.password && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-wider">
                            {fieldErrors.password}
                        </p>
                    )}
                </div>

                <div className="pt-2">
                    <button 
                        className={`group relative w-full bg-cyan-600 text-white font-bold py-3 rounded-xl transition-all duration-300 hover:bg-cyan-700 hover:shadow-lg hover:shadow-cyan-200 flex items-center justify-center ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Iniciar Sesión'}
                    </button>
                </div>
            </form>

            <footer className="mt-8 space-y-3 text-center">
                <p className="text-sm text-slate-500">
                    ¿No tienes cuenta?{' '}
                    {onSwitchToRegister ? ( 
                        <button 
                            onClick={onSwitchToRegister}
                            className="text-cyan-600 hover:underline font-semibold"
                        >
                            Registrarse
                        </button>
                    ) : (
                        <a href="/register" className="text-cyan-600 hover:underline font-semibold">
                            Registrarse
                        </a>
                    )}
                </p>
                <Link to="/forgotpassword" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    ¿Olvidaste tu contraseña?
                </Link>
            </footer>
        </div>
    );
}

export default LoginCard;