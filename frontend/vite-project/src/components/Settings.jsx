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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
      if (result.portal_url) window.location.href = result.portal_url;
    } catch (error) {
      console.error("Error abriendo portal:", error);
      alert("Error al abrir el portal. Inténtalo de nuevo.");
    } finally {
      setPortalLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] || "U").toUpperCase();

  const PlanBadge = () => {
    if (!subscription) return null;
    const { plan, status, trial_active, trial_expired, days_left } = subscription;

    if (plan === "pro" && status === "active") {
      return (
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: "linear-gradient(90deg, #00d2ff, #7b5ea7)", color: "#fff" }}
        >
          ⚡ PRO
        </span>
      );
    }
    if (trial_active) {
      return (
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: "rgba(234,179,8,0.12)", color: "#facc15", border: "0.5px solid rgba(234,179,8,0.3)" }}
        >
          🕐 Trial ({days_left} días)
        </span>
      );
    }
    if (trial_expired) {
      return (
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: "rgba(255,100,100,0.1)", color: "#ff6b6b", border: "0.5px solid rgba(255,100,100,0.2)" }}
        >
          ❌ Trial expirado
        </span>
      );
    }
    return (
      <span
        className="text-xs font-bold px-3 py-1 rounded-full"
        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "0.5px solid rgba(255,255,255,0.1)" }}
      >
        Free
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#050d1f" }}>
      <Header
        onConnectApp={() => {}}
        connectedApps={{}}
        onDeleteAccount={() => {}}
      />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-8" style={{ color: "#fff" }}>
          Configuración
        </h1>

        {/* PERFIL */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#0d1832", border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <h2
            className="text-xs font-semibold uppercase mb-4"
            style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}
          >
            Perfil
          </h2>
          <div className="flex items-center gap-4">
            <div
              className="rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, #00d2ff, #7b5ea7)" }}
            >
              {initials}
            </div>
            <div>
              <p className="font-semibold" style={{ color: "#fff" }}>
                {user?.name || "Usuario"}
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                {user?.email}
              </p>
            </div>
            <div className="ml-auto">
              <PlanBadge />
            </div>
          </div>
        </div>

        {/* SUSCRIPCIÓN */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#0d1832", border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <h2
            className="text-xs font-semibold uppercase mb-4"
            style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}
          >
            Suscripción
          </h2>

          {loading ? (
            <div className="flex justify-center py-4">
              <div
                className="animate-spin rounded-full h-8 w-8"
                style={{
                  borderTop: "2px solid #00d2ff",
                  borderRight: "2px solid transparent",
                  borderBottom: "2px solid transparent",
                  borderLeft: "2px solid transparent",
                }}
              />
            </div>
          ) : subscription ? (
            <div className="space-y-4">

              {/* Estado del plan */}
              {subscription.plan === "pro" && subscription.status === "active" ? (
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: "rgba(0,210,255,0.07)", border: "0.5px solid rgba(0,210,255,0.2)" }}
                >
                  <CheckCircle size={22} style={{ color: "#00d2ff", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: "#fff" }}>AssistWork Pro</p>
                    {subscription.current_period_end && (
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                        Próxima renovación:{" "}
                        {new Date(subscription.current_period_end).toLocaleDateString("es-CO", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    )}
                    {subscription.cancel_at_period_end && (
                      <p className="text-sm mt-1" style={{ color: "#ff6b6b" }}>
                        ⚠️ Se cancelará al final del periodo
                      </p>
                    )}
                  </div>
                  <span className="font-bold flex-shrink-0" style={{ color: "#00d2ff" }}>$20/mes</span>
                </div>
              ) : subscription.trial_active ? (
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: "rgba(234,179,8,0.07)", border: "0.5px solid rgba(234,179,8,0.2)" }}
                >
                  <Clock size={22} style={{ color: "#facc15", flexShrink: 0 }} />
                  <div>
                    <p className="font-semibold" style={{ color: "#fff" }}>Trial gratuito</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {subscription.days_left} días restantes
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: "rgba(255,100,100,0.07)", border: "0.5px solid rgba(255,100,100,0.2)" }}
                >
                  <AlertTriangle size={22} style={{ color: "#ff6b6b", flexShrink: 0 }} />
                  <div>
                    <p className="font-semibold" style={{ color: "#fff" }}>Trial expirado</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
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
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Conversaciones</span>
                      <span className="font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                        {subscription.usage.conversations_count}
                        {subscription.usage.conversations_limit
                          ? ` / ${subscription.usage.conversations_limit}`
                          : " (ilimitadas)"}
                      </span>
                    </div>
                    {subscription.usage.conversations_limit && (
                      <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            background: "linear-gradient(90deg, #00d2ff, #7b5ea7)",
                            width: `${Math.min(
                              (subscription.usage.conversations_count / subscription.usage.conversations_limit) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Archivos */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Archivos PDF</span>
                      <span className="font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                        {subscription.usage.files_count} / {subscription.usage.files_limit}
                      </span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          background: "linear-gradient(90deg, #00d2ff, #7b5ea7)",
                          width: `${Math.min(
                            (subscription.usage.files_count / subscription.usage.files_limit) * 100,
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
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition text-left"
                    style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={17} style={{ color: "rgba(255,255,255,0.5)" }} />
                      <span className="font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                        {portalLoading ? "Abriendo portal..." : "Gestionar suscripción"}
                      </span>
                    </div>
                    {portalLoading ? (
                      <div
                        className="animate-spin rounded-full h-4 w-4"
                        style={{
                          borderTop: "2px solid #00d2ff",
                          borderRight: "2px solid transparent",
                          borderBottom: "2px solid transparent",
                          borderLeft: "2px solid transparent",
                        }}
                      />
                    ) : (
                      <ChevronRight size={17} style={{ color: "rgba(255,255,255,0.3)" }} />
                    )}
                  </button>
                ) : (
                  <>
                    <div
                      className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                        Actualmente la actualización a{" "}
                        <span className="font-semibold" style={{ color: "#00d2ff" }}>PRO</span>{" "}
                        no está disponible, ya que estamos realizando pruebas piloto para
                        mejorar la experiencia.
                      </p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Muy pronto podrás acceder a esta funcionalidad 🚀
                      </p>
                    </div>
                    <button
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold transition text-white"
                      style={{ background: "linear-gradient(90deg, #00d2ff, #7b5ea7)", opacity: 0.5, cursor: "not-allowed" }}
                      disabled
                    >
                      <Zap size={17} />
                      Upgrade a Pro — $20/mes
                    </button>
                  </>
                )}
              </div>

            </div>
          ) : (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              No se pudo cargar la información de tu suscripción.
            </p>
          )}
        </div>
      </div>

      {/* Modal "Función en pruebas" */}
      {showUpgradeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div
            className="rounded-2xl p-6 text-center w-full max-w-md"
            style={{ background: "#0d1832", border: "0.5px solid rgba(255,255,255,0.1)" }}
          >
            <div className="text-4xl mb-3">🚧</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#fff" }}>
              Función en pruebas
            </h2>
            <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
              Actualmente la actualización a{" "}
              <span className="font-semibold" style={{ color: "#00d2ff" }}>PRO</span>{" "}
              no está disponible, ya que estamos realizando pruebas piloto.
            </p>
            <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>
              Muy pronto podrás acceder a esta funcionalidad 🚀
            </p>
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="px-6 py-2 rounded-xl text-sm font-medium transition"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
                border: "0.5px solid rgba(255,255,255,0.15)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;