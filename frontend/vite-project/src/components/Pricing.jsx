import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchCreateCheckoutSession, fetchSubscriptionInfo } from "../services/stripeService";
import { Check, Zap, X } from "lucide-react";
import Header from "./Header";

function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showCanceledBanner, setShowCanceledBanner] = useState(false);

  // Verificar si viene de checkout exitoso o cancelado
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccessBanner(true);
      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => navigate("/agentPage"), 3000);
    }
    if (searchParams.get("canceled") === "true") {
      setShowCanceledBanner(true);
    }
  }, [searchParams, navigate]);

  // Cargar info de suscripción
  useEffect(() => {
    if (user) {
      fetchSubscriptionInfo()
        .then(setSubscription)
        .catch(console.error);
    }
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const result = await fetchCreateCheckoutSession();
      if (result.checkout_url) {
        // Redirigir a Stripe Checkout
        window.location.href = result.checkout_url;
      }
    } catch (error) {
      console.error("Error creando checkout:", error);
      alert("Error al procesar el pago. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";

  const freeFeatures = [
    "20 conversaciones",
    "5 archivos PDF (máx. 10MB c/u)",
    "Gmail básico (lectura)",
    "Historial 7 días",
    "5 mensajes de contexto",
    "Soporte por email (72hrs)",
  ];

  const proFeatures = [
    "Conversaciones ilimitadas",
    "100 archivos PDF (máx. 25MB c/u)",
    "Gmail completo (leer, enviar, automatizar)",
    "Historial ilimitado",
    "20 mensajes de contexto",
    "Acceso prioritario a nuevas herramientas",
    "Soporte por email (24hrs)",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onConnectApp={() => {}}
        connectedApps={{}}
        onDeleteAccount={() => {}}
      />

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Banner de éxito */}
        {showSuccessBanner && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <Check className="text-green-600" size={20} />
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  🎉 ¡Bienvenido a AssistWork Pro!
                </p>
                <p className="text-sm text-green-600">
                  Tu suscripción está activa. Redirigiendo al dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Banner de cancelación */}
        {showCanceledBanner && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-full p-2">
                <X className="text-yellow-600" size={20} />
              </div>
              <p className="text-yellow-800">
                Pago cancelado. Puedes intentarlo de nuevo cuando quieras.
              </p>
            </div>
            <button
              onClick={() => setShowCanceledBanner(false)}
              className="text-yellow-500 hover:text-yellow-700"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Elige tu plan
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Empieza gratis por 7 días. Sin tarjeta de crédito requerida.
          </p>
        </div>

        {/* Cards de planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

          {/* Plan Free */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
              <p className="text-gray-500 text-sm mb-4">
                Prueba AssistWork sin compromiso
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/7 días</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="bg-gray-100 rounded-full p-0.5 mt-0.5 flex-shrink-0">
                    <Check size={14} className="text-gray-600" />
                  </div>
                  <span className="text-gray-600 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/register")}
              className="w-full py-3 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              {user ? "Plan actual" : "Empezar gratis"}
            </button>
          </div>

          {/* Plan Pro */}
          <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl shadow-lg p-8 flex flex-col relative overflow-hidden">

            {/* Badge popular */}
            <div className="absolute top-4 right-4">
              <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                ⭐ Más popular
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Pro</h2>
              <p className="text-cyan-100 text-sm mb-4">
                Todo lo que necesitas para escalar
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$20</span>
                <span className="text-cyan-100">/mes</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {proFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="bg-white/20 rounded-full p-0.5 mt-0.5 flex-shrink-0">
                    <Check size={14} className="text-white" />
                  </div>
                  <span className="text-white text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button
                disabled
                className="w-full py-3 px-4 bg-white/20 text-white rounded-xl font-semibold cursor-not-allowed"
              >
                ✅ Plan activo
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 px-4 bg-white text-cyan-600 rounded-xl font-bold hover:bg-cyan-50 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-cyan-600" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Suscribirse a Pro
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-8">
            Preguntas frecuentes
          </h3>
          <div className="space-y-4">
            {[
              {
                q: "¿Necesito tarjeta de crédito para el trial?",
                a: "No. Puedes usar AssistWork gratis por 7 días sin ingresar datos de pago."
              },
              {
                q: "¿Puedo cancelar cuando quiera?",
                a: "Sí. Puedes cancelar tu suscripción en cualquier momento. Seguirás teniendo acceso hasta el final del periodo pagado."
              },
              {
                q: "¿Qué métodos de pago aceptan?",
                a: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, Amex) y PSE para Colombia."
              },
              {
                q: "¿Qué pasa con mis datos si cancelo?",
                a: "Tus conversaciones y archivos se conservan. Solo se limita el acceso a features Pro."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                <p className="font-semibold text-gray-900 mb-2">{faq.q}</p>
                <p className="text-gray-500 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;