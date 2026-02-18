import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchSubscriptionSummary,
  fetchCreatePortalSession
} from "../services/stripeService";
import Header from "./Header";
import {
  CreditCard,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight
} from "lucide-react";

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionSummary()
      .then(setSubscription)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const result = await fetchCreatePortalSession();
      if (result.portal_url) {
        window.location.href = result.portal_url;
      }
    } catch (error) {
      console.error("Error abriendo portal:", error);
      alert("Error al abrir el portal. Inténtalo de nuevo.");
    } finally {
      setPortalLoading(false);
    }
  };

  // Componente de estado del plan
  const PlanBadge = () => {
    if (!subscription) return null;

    const { plan, status, trial_active, trial_expired, days_left } = subscription;

    if (plan === "pro" && status === "active") {
      return (
        <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          ⚡ PRO
        </span>
      );
    }

    if (trial_active) {
      return (
        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
          🕐 Trial ({days_left} días)
        </span>
      );
    }

    if (trial_expired) {
      return (
        <span className="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
          ❌ Trial expirado
        </span>
      );
    }

    return (
      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
        Free
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onConnectApp={() => {}}
        connectedApps={{}}
        onDeleteAccount={() => {}}
      />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Configuración
        </h1>

        {/* Sección: Perfil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Perfil
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user?.name || "Usuario"}
              </p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
            <div className="ml-auto">
              <PlanBadge />
            </div>
          </div>
        </div>

        {/* Sección: Suscripción */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Suscripción
          </h2>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-600" />
            </div>
          ) : subscription ? (
            <div className="space-y-4">

              {/* Estado del plan */}
              {subscription.plan === "pro" && subscription.status === "active" ? (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                  <CheckCircle className="text-cyan-600 flex-shrink-0" size={22} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">AssistWork Pro</p>
                    {subscription.current_period_end && (
                      <p className="text-sm text-gray-500">
                        Próxima renovación:{" "}
                        {new Date(subscription.current_period_end).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </p>
                    )}
                    {subscription.cancel_at_period_end && (
                      <p className="text-sm text-red-500 mt-1">
                        ⚠️ Se cancelará al final del periodo
                      </p>
                    )}
                  </div>
                  <span className="text-cyan-600 font-bold flex-shrink-0">$20/mes</span>
                </div>
              ) : subscription.trial_active ? (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <Clock className="text-yellow-600 flex-shrink-0" size={22} />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Trial gratuito
                    </p>
                    <p className="text-sm text-gray-500">
                      {subscription.days_left} días restantes
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={22} />
                  <div>
                    <p className="font-semibold text-gray-900">Trial expirado</p>
                    <p className="text-sm text-gray-500">
                      Upgrade a Pro para seguir usando AssistWork
                    </p>
                  </div>
                </div>
              )}

              {/* Uso actual */}
              {subscription.usage && (
                <div className="space-y-3 pt-2">
                  {/* Conversaciones */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Conversaciones</span>
                      <span className="text-gray-900 font-medium">
                        {subscription.usage.conversations_count}
                        {subscription.usage.conversations_limit
                          ? ` / ${subscription.usage.conversations_limit}`
                          : " (ilimitadas)"}
                      </span>
                    </div>
                    {subscription.usage.conversations_limit && (
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (subscription.usage.conversations_count /
                                subscription.usage.conversations_limit) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Archivos */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Archivos PDF</span>
                      <span className="text-gray-900 font-medium">
                        {subscription.usage.files_count} / {subscription.usage.files_limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (subscription.usage.files_count /
                              subscription.usage.files_limit) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex flex-col gap-3 pt-2">
                {subscription.plan === "pro" ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} className="text-gray-600" />
                      <span className="font-medium text-gray-700">
                        {portalLoading ? "Abriendo portal..." : "Gestionar suscripción"}
                      </span>
                    </div>
                    {portalLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-gray-400" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400" />
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/pricing")}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
                  >
                    <Zap size={18} />
                    Upgrade a Pro - $20/mes
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No se pudo cargar la información de tu suscripción.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;