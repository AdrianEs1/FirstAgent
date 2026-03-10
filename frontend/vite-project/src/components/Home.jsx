import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Zap, Brain, Shield, ArrowRight, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LoginCard from "../components/Login";
import RegisterCard from "../components/Register";

// Estilos mínimos que Tailwind no puede expresar (gradientes complejos, keyframes, pseudo-elementos)
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  .font-sora { font-family: 'Sora', sans-serif; }
  .font-dm   { font-family: 'DM Sans', sans-serif; }

  .fade-up { opacity:0; transform:translateY(32px); animation:fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) forwards; }
  .fade-up-1 { animation-delay:.10s; }
  .fade-up-2 { animation-delay:.28s; }
  .fade-up-3 { animation-delay:.46s; }
  .fade-up-4 { animation-delay:.62s; }
  .fade-up-5 { animation-delay:.78s; }
  @keyframes fadeUp { to { opacity:1; transform:translateY(0); } }

  .hero-bg {
    background: linear-gradient(135deg,#0e4f6e 0%,#0891b2 45%,#06b6d4 75%,#22d3ee 100%);
  }
  .hero-bg::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:
      radial-gradient(ellipse 80% 60% at 70% 40%,rgba(255,255,255,.08) 0%,transparent 60%),
      radial-gradient(ellipse 50% 50% at 20% 80%,rgba(6,182,212,.35) 0%,transparent 60%);
  }
  .hero-grid {
    position:absolute; inset:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
    background-size:48px 48px;
  }

  .badge-dot { animation:pulse-dot 2s ease-in-out infinite; }
  @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }

  .scroll-bounce { animation:bounce-y 2.2s ease-in-out infinite; }
  @keyframes bounce-y { 0%,100%{transform:translateY(0);opacity:.7} 50%{transform:translateY(8px);opacity:1} }

  .feature-card { transition:transform .22s ease,box-shadow .22s ease; }
  .feature-card::before {
    content:''; position:absolute; top:0; left:0; right:0;
    height:3px; background:linear-gradient(90deg,#0891b2,#22d3ee);
    opacity:0; transition:opacity .22s ease;
  }
  .feature-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(8,145,178,.13); }
  .feature-card:hover::before { opacity:1; }

  .cta-section {
    background:linear-gradient(135deg,#0c4a6e 0%,#0e7490 50%,#0891b2 100%);
  }
  .cta-section::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse 70% 80% at 50% 50%,rgba(34,211,238,.12) 0%,transparent 70%);
  }

  .btn-primary { transition:transform .18s ease,box-shadow .18s ease; }
  .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,.18); }
  .btn-outline { transition:background .18s ease,transform .18s ease; }
  .btn-outline:hover { background:rgba(255,255,255,.22); transform:translateY(-2px); }

  .nav-scrolled {
    background:rgba(255,255,255,.92);
    backdrop-filter:blur(16px);
    border-bottom:1px solid rgba(8,145,178,.1);
  }
`;

const features = [
  {
    icon: <Brain size={24} className="text-cyan-600" />,
    iconBg: "bg-sky-100",
    title: "Gestión Inteligente",
    text: "Centraliza y organiza tu información con un asistente que entiende el contexto y localiza lo que necesitas en segundos.",
  },
  {
    icon: <Zap size={24} className="text-cyan-700" />,
    iconBg: "bg-cyan-100",
    title: "Automatización de Procesos",
    text: "Elimina el trabajo manual con flujos automáticos impulsados por IA. Haz más en menos tiempo, sin esfuerzo.",
  },
  {
    icon: <Shield size={24} className="text-cyan-900" />,
    iconBg: "bg-cyan-50",
    title: "Seguridad y Adaptabilidad",
    text: "AssistWork aprende de tus interacciones y protege tus datos, ofreciéndote respuestas cada vez más precisas y seguras.",
  },
];

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen]   = useState(false);
  const [showLoginModal, setShowLoginModal]         = useState(false);
  const [showRegisterModal, setShowRegisterModal]   = useState(false);
  const [scrolled, setScrolled]                     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{globalStyles}</style>

      <div className="min-h-screen flex flex-col font-dm">

        {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "nav-scrolled" : "bg-transparent"}`}>
          <nav className="flex justify-between items-center max-w-6xl mx-auto px-6 py-4">

            <h1
              onClick={() => navigate("/agentPage")}
              className={`font-sora text-2xl font-extrabold tracking-tight cursor-pointer select-none
                ${scrolled
                  ? "bg-gradient-to-r from-cyan-600 to-cyan-900 bg-clip-text text-transparent"
                  : "text-white"}`}
            >
              AssistWork
            </h1>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setShowRegisterModal(true)}
                className={`font-dm font-medium text-sm px-3 py-2 rounded-lg transition
                  ${scrolled
                    ? "text-gray-600 hover:text-cyan-600 hover:bg-sky-50"
                    : "text-white/80 hover:text-white hover:bg-white/10"}`}
              >
                Registrarse
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className={`font-sora font-semibold text-sm px-5 py-2 rounded-full text-white transition
                  ${scrolled
                    ? "bg-gradient-to-r from-cyan-600 to-cyan-700 shadow-md hover:shadow-lg"
                    : "bg-white/20 backdrop-blur-md border border-white/40 hover:bg-white/30"}`}
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              className={`md:hidden ${scrolled ? "text-gray-700" : "text-white"}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden flex flex-col bg-white border-t border-sky-100 px-6 py-3 gap-1">
              <button
                className="text-left font-dm text-sm text-gray-600 hover:text-cyan-600 hover:bg-sky-50 px-3 py-2 rounded-lg transition"
                onClick={() => { setShowRegisterModal(true); setIsMobileMenuOpen(false); }}
              >
                Registrarse
              </button>
              <button
                className="text-left font-dm text-sm text-gray-600 hover:text-cyan-600 hover:bg-sky-50 px-3 py-2 rounded-lg transition"
                onClick={() => { setShowLoginModal(true); setIsMobileMenuOpen(false); }}
              >
                Iniciar Sesión
              </button>
            </div>
          )}
        </header>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="hero-bg relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 overflow-hidden">
          <div className="hero-grid" />
          {/* Orbes decorativos */}
          <div className="absolute -top-28 -right-20 w-96 h-96 rounded-full bg-cyan-400 opacity-20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 -left-16 w-72 h-72 rounded-full bg-cyan-800 opacity-20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">

            {/* Badge */}
            <div className="fade-up fade-up-1 flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 bg-white/15 border border-white/30 backdrop-blur-md text-white text-xs font-dm font-medium tracking-wide px-4 py-1.5 rounded-full">
                <span className="badge-dot w-1.5 h-1.5 rounded-full bg-cyan-200" />
                Asistente IA · Disponible 24/7
              </span>
            </div>

            {/* Título */}
            <h2 className="fade-up fade-up-2 font-sora font-extrabold text-white leading-tight tracking-tight text-4xl sm:text-5xl md:text-6xl mb-5">
              Trabaja más inteligente<br />
              <span className="text-cyan-200">con tu asistente IA</span>
            </h2>

            {/* Subtítulo */}
            <p className="fade-up fade-up-3 font-dm font-light text-white/75 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-10">
              AssistWork optimiza tu gestión de información, automatiza procesos
              y te da respuestas precisas cuando más las necesitas.
            </p>

            {/* CTAs */}
            <div className="fade-up fade-up-4 flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="btn-primary inline-flex items-center gap-2 bg-white text-cyan-600 font-sora font-semibold text-sm px-7 py-3 rounded-full shadow-lg"
              >
                Comenzar gratis <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn-outline inline-flex items-center gap-2 bg-white/10 border border-white/35 backdrop-blur-md text-white font-sora font-medium text-sm px-7 py-3 rounded-full"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="fade-up fade-up-5 scroll-bounce absolute bottom-8 flex flex-col items-center gap-1 text-white/50 text-xs font-dm">
            <span>Descubre más</span>
            <ChevronDown size={18} />
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────────────────── */}
        <section className="bg-sky-50 py-24 px-6">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-14">
              <span className="font-dm font-semibold text-xs text-cyan-600 tracking-widest uppercase">
                ¿Por qué AssistWork?
              </span>
              <h3 className="font-sora font-bold text-cyan-900 text-2xl sm:text-3xl md:text-4xl mt-2 tracking-tight">
                Todo lo que necesitas, en un solo lugar
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="feature-card relative bg-white rounded-2xl p-8 shadow-sm border border-cyan-100 overflow-hidden"
                >
                  <div className={`${f.iconBg} p-3 rounded-xl w-fit mb-5`}>
                    {f.icon}
                  </div>
                  <h4 className="font-sora font-bold text-cyan-900 text-base mb-2">
                    {f.title}
                  </h4>
                  <p className="font-dm font-light text-gray-500 text-sm leading-relaxed">
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
        <section className="cta-section relative py-24 px-6 text-center overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <h3 className="font-sora font-extrabold text-white text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight mb-4">
              Listo para empezar<br />a trabajar mejor
            </h3>
            <p className="font-dm font-light text-white/70 text-base leading-relaxed mb-10">
              Únete a quienes ya optimizan su día a día con AssistWork.
              Crea tu cuenta en segundos, sin tarjeta de crédito.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="btn-primary inline-flex items-center gap-2 bg-white text-cyan-600 font-sora font-semibold text-sm px-7 py-3 rounded-full shadow-lg"
              >
                Crear cuenta gratis <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn-outline inline-flex items-center gap-2 bg-white/10 border border-white/35 backdrop-blur-md text-white font-sora font-medium text-sm px-7 py-3 rounded-full"
              >
                Ya tengo una cuenta
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer className="bg-cyan-950 text-white/50 text-xs font-dm py-5 text-center">
          © 2025 AssistWork. Todos los derechos reservados.
          {" · "}
          <a href="/privacy" className="hover:text-white/80 transition">Privacidad</a>
          {" · "}
          <a href="/terms" className="hover:text-white/80 transition">Términos</a>
          {" · "}
          <a href="/refund" className="hover:text-white/80 transition">Reembolsos</a>
        </footer>

        {/* ── MODAL LOGIN ─────────────────────────────────────────────────── */}
        {showLoginModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/55 backdrop-blur-sm z-50 p-4">
            <LoginCard
              onClose={() => setShowLoginModal(false)}
              onSwitchToRegister={() => {
                setShowLoginModal(false);
                setShowRegisterModal(true);

              }}

            />
          </div>
        )}

        {/* ── MODAL REGISTER ──────────────────────────────────────────────── */}
        {showRegisterModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/55 backdrop-blur-sm z-50 p-4">
              <RegisterCard
                onClose={() => setShowRegisterModal(false)}
                onSwitchToLogin={() => {
                  setShowRegisterModal(false);
                  setShowLoginModal(true);
                }}
              />
          </div>
        )}

      </div>
    </>
  );
}

export default Home;