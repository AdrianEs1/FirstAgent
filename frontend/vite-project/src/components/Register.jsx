import { useState } from "react";
import { fetchAgentRegister, fetchAgentVerifyEmailCode } from "../services/agentServices";
import { validateEmail } from "../services/validInput";
import { useFormFields, MAX_EMAIL_LENGTH } from "../hooks/useFormFields";

import PasswordInput from "./PasswordInput";
import {X} from "lucide-react";

function RegisterCard({ onSwitchToLogin, onClose}) {
    const [name, setName] = useState(""); 
    const {
    email, password, code, error, loading, step, fieldErrors,
    setCode, setError, setLoading, setStep,
    handleEmailChange, handleEmailBlur, handlePasswordChange, handleCodeChange,
    } = useFormFields("register");


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // ✅ Validaciones ANTES de setLoading
        const cleanEmail = email.trim();
        if (!cleanEmail || !password || !name) {
            setError("Por favor, completa todos los campos.");
            return;
        }

        if (!validateEmail(cleanEmail)) {
            setError("El formato del correo electrónico no es válido.");
            return;
        }

        if (password.length < 9) {
            setError("La contraseña debe tener al menos 9 caracteres.");
            return;
        }

        // ✅ Solo activas loading cuando vas a llamar al backend
        setLoading(true);
        try {
            await fetchAgentRegister({ email, password, name });
            setStep("verify");
        } catch (err) {
            const detail = err?.response?.data?.detail;
            let errorMessage;
            if (Array.isArray(detail)) {
                errorMessage = detail.map(e => e.msg).join(", ");
            } else if (typeof detail === "string") {
                errorMessage = detail;
            } else {
                errorMessage = err?.message || "Error al registrarse";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (code.length !== 6) {
            setError("El código debe tener 6 dígitos");
            setLoading(false);
            return;
        }

        try {
            await fetchAgentVerifyEmailCode({ email, code });

            setStep("success");

            setTimeout(() => {
            onSwitchToLogin?.();
            }, 2000);

        } catch (error) {
            setError(error?.message || "Código inválido o expirado");
            setLoading(false);
        }
    };

    
    if (step === "verify") {
        return (
            <div className="bg-cyan-50 p-6 rounded-xl shadow-xl max-w-sm mx-auto w-full text-center">
            <h3 className="text-xl font-bold mb-2">Verifica tu correo</h3>
            <p className="text-gray-600 mb-4 text-sm">
                Hemos enviado un código de 6 dígitos a:
                <br />
                <span className="font-semibold">{email}</span>
            </p>

            {error && (
                <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                {error}
                </div>
            )}

            <form onSubmit={handleVerifyCode}>
                <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                maxLength={6}
                placeholder="Código de verificación"
                className="w-full text-center tracking-widest text-xl border rounded-lg py-3 px-4 focus:ring-2 focus:ring-cyan-500"
                disabled={loading}
                />

                <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-cyan-600 text-white font-semibold py-2 rounded-lg hover:bg-cyan-700 transition"
                >
                {loading ? "Verificando..." : "Verificar cuenta"}
                </button>
            </form>
            </div>
        );
    }



    if (step=== "success") {
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
                        className={`w-full border-2 rounded-xl py-3 px-4 outline-none transition-all ${
                            fieldErrors.name 
                            ? "border-red-300 bg-red-50 focus:ring-red-500" 
                            : "border-gray-100 bg-gray-50 focus:ring-cyan-500"
                        }`}
                        placeholder="nombre completo"
                        disabled={loading}
                    />
                </div>

                <div className="pb-2 flex justify-center">
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

                <div className="pb-2 flex justify-center">
                    <PasswordInput
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="contraseña"
                        disabled={loading}
                        className={`w-full border-2 rounded-xl py-3 px-4 outline-none transition-all ${
                            fieldErrors.password 
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
                <div className="pt-4 pb-2 flex justify-center">
                    <p>Al hacer clic en Crear Cuenta, aceptas la <a className="text-cyan-600 hover:underline font-semibold" href="/privacy">Privacy Policy</a> y los <a className="text-cyan-600 hover:underline font-semibold" href="/terms">Terms of Service</a></p>
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