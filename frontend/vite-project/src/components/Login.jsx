import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAgentLogin, fetchCurrentUser, fetchAgentVerifyEmailCode, fetchAgentResendEmailCode } from "../services/agentServices";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "./PasswordInput";

function LoginCard({ onSwitchToRegister, onSwitchToForgotPassword }) {  // ✅ Recibe prop
    const { login } = useAuth();
    const [step, setStep] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [verifiedAccount, setVerifiedAccount] = useState("")



    const handleLogin = async (e) => {
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
                await fetchAgentResendEmailCode({ email });
            } else {
                setError(
                    err?.response?.data?.detail ||
                    "Email o contraseña incorrectos"
                );
            }
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
            const response= await fetchAgentVerifyEmailCode({ email, code });
            setStep("login");
            setVerifiedAccount(response.message);

        } catch {
            setError("Código inválido o expirado");
        } finally {
            setLoading(false);
        }
    };


    
    
    if (step === "verify") {
        return (
            <div className="bg-cyan-50 p-6 rounded-xl shadow-xl max-w-sm mx-auto text-center">
                <h3 className="text-xl font-bold mb-2">Verifica tu correo</h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Debes verificar tu cuenta para continuar. Enviamos un código a <b>{email}</b>
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
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        maxLength={6}
                        placeholder="Código de verificación"
                        className="w-full text-center tracking-widest text-xl border rounded-lg py-3"
                    />

                    <button
                        className="mt-4 w-full bg-cyan-600 text-white py-2 rounded-lg"
                        disabled={loading}
                    >
                        {loading ? "Verificando..." : "Verificar cuenta"}
                    </button>
                </form>
            </div>
        );
    }


    {/*if (step === "success") {
        return (
            <div className="bg-cyan-50 p-6 rounded-xl shadow-xl text-center py-12">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    ✔
                </div>
                <h3 className="text-xl font-semibold">Login exitoso</h3>
                <p className="text-gray-600">Redirigiendo...</p>
            </div>
        );
    }*/}


    return (
        <div className="bg-cyan-50 p-6 rounded-xl shadow-xl max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-center text-black mb-4 pb-3">Login</h2>

            
            <form onSubmit={handleLogin}>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {verifiedAccount && (

                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-black-700 rounded-lg text-sm"> {verifiedAccount} </div>

                )}


                <div className="pb-2 flex justify-center">
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border rounded-lg py-2 px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="correo electrónico"
                        disabled={loading}
                    />
                </div>

                <div className="pb-2 flex justify-center">
                    

                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="contraseña"
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
                <p>¿Olvido su Contraseña?{' '}
                    {onSwitchToForgotPassword ? (
                        <button 
                            onClick={onSwitchToForgotPassword}
                            className="text-cyan-600 hover:underline font-semibold"
                        >
                            Recuperar Cuenta
                        </button>
                    ) : (
                        <a href="/forgotpassword" className="text-cyan-600 hover:underline font-semibold">
                            Recuperar Cuenta
                        </a>
                    )}
                </p>
            </div>
        </div>
    );
}

export default LoginCard;

