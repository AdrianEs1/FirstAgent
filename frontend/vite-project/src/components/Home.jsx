import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, X, Zap, Brain, Shield, ArrowRight, ChevronDown,
  MessageSquare, PlugZap, LayoutDashboard, Mail, Github, Linkedin, CheckCircle2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LoginCard from "../components/Login";
import RegisterCard from "../components/Register";

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

  .step-card { transition:transform .22s ease,box-shadow .22s ease; }
  .step-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(8,145,178,.12); }

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

  .founder-card {
    background: linear-gradient(145deg, #ffffff, #f0f9ff);
    transition: transform .22s ease, box-shadow .22s ease;
  }
  .founder-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(8,145,178,.14); }

  .contact-input {
    transition: border-color .18s ease, box-shadow .18s ease;
  }
  .contact-input:focus {
    outline: none;
    border-color: #0891b2;
    box-shadow: 0 0 0 3px rgba(8,145,178,.12);
  }

  .plan-card { transition:transform .22s ease,box-shadow .22s ease; }
  .plan-card:hover { transform:translateY(-6px); box-shadow:0 20px 48px rgba(8,145,178,.16); }

  .avatar-ring {
    background: linear-gradient(135deg, #0891b2, #22d3ee);
    padding: 3px;
    border-radius: 9999px;
    display: inline-block;
  }
  .avatar-inner {
    background: #e0f2fe;
    border-radius: 9999px;
    width: 96px;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Sora', sans-serif;
    font-weight: 800;
    font-size: 2rem;
    color: #0891b2;
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

const steps = [
  {
    number: "01",
    icon: <MessageSquare size={22} className="text-cyan-600" />,
    iconBg: "bg-sky-100",
    title: "Escribe en lenguaje natural",
    text: "Dile a AssistWork lo que necesitas en español cotidiano, sin comandos técnicos ni formularios complejos.",
  },
  {
    number: "02",
    icon: <Brain size={22} className="text-cyan-700" />,
    iconBg: "bg-cyan-100",
    title: "El agente interpreta y actúa",
    text: "Nuestro agente de IA analiza tu instrucción, decide qué plataformas de tu empresa involucrar y ejecuta la acción.",
  },
  {
    number: "03",
    icon: <PlugZap size={22} className="text-cyan-700" />,
    iconBg: "bg-cyan-50",
    title: "Se conecta a tus apps",
    text: "AssistWork se integra vía API con tus herramientas: CRM, email, calendario, Drive, hojas de cálculo y más.",
  },
  {
    number: "04",
    icon: <LayoutDashboard size={22} className="text-cyan-900" />,
    iconBg: "bg-sky-50",
    title: "Recibe una respuesta unificada",
    text: "Obtienes resultados consolidados de todas tus plataformas en un solo lugar, listos para tomar decisiones.",
  },
];

const plans = [
  {
    name: "Gratuito/ 7 dias",
    price: "Gratis",
    period: "",
    description: "Para equipos que quieren empezar a explorar AssistWork sin compromisos.",
    features: [
      "20 conversaciones",
      "5 archivos PDF (máx. 10MB c/u)",
      "Gmail básico (lectura)",
      "Historial 7 días",
      "5 mensajes de contexto",
      "Soporte por email (72hrs)",
    ],
    cta: "Comenzar gratis",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Próximamente",
    period: "",
    description: "Para PYMES que necesitan automatización avanzada y más integraciones.",
    features: [
      "Conversaciones ilimitadas",
      "50 archivos PDF (máx. 10MB c/u)",
      "Gmail completo (leer, enviar, automatizar)",
      "Analisis de archivos (leer, resumir)",
      "Teams (proximamente)",
      "Historial completo",
      "10 mensajes de contexto",
      "Acceso prioritario a nuevas herramientas",
      "Soporte por email (24hrs)",
    ],
    cta: "Notifícame",
    highlight: true,
  },
];

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal]       = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [scrolled, setScrolled]                   = useState(false);
  const [contactForm, setContactForm]             = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent]             = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Abre el cliente de correo con los datos del formulario
    const subject = encodeURIComponent(`Contacto AssistWork - ${contactForm.name}`);
    const body = encodeURIComponent(`Nombre: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMensaje:\n${contactForm.message}`);
    window.open(`mailto:adrian@assistwork.online?subject=${subject}&body=${body}`);
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
  };

  return (
    <>
      <style>{globalStyles}</style>

      <div className="min-h-screen flex flex-col font-dm">

        {/* ── NAVBAR ── */}
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

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { label: "Cómo funciona", href: "#how-it-works" },
                { label: "Planes",        href: "#plans" },
                { label: "Equipo",        href: "#team" },
                { label: "Contacto",      href: "#contact" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`font-dm font-medium text-sm px-3 py-2 rounded-lg transition
                    ${scrolled
                      ? "text-gray-600 hover:text-cyan-600 hover:bg-sky-50"
                      : "text-white/80 hover:text-white hover:bg-white/10"}`}
                >
                  {item.label}
                </a>
              ))}
              <div className="w-px h-5 bg-white/20 mx-1" />
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

          {isMobileMenuOpen && (
            <div className="md:hidden flex flex-col bg-white border-t border-sky-100 px-6 py-3 gap-1">
              {["#how-it-works", "#plans", "#team", "#contact"].map((href, i) => (
                <a
                  key={href}
                  href={href}
                  className="text-left font-dm text-sm text-gray-600 hover:text-cyan-600 hover:bg-sky-50 px-3 py-2 rounded-lg transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {["Cómo funciona", "Planes", "Equipo", "Contacto"][i]}
                </a>
              ))}
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

        {/* ── HERO ── */}
        <section className="hero-bg relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 overflow-hidden">
          <div className="hero-grid" />
          <div className="absolute -top-28 -right-20 w-96 h-96 rounded-full bg-cyan-400 opacity-20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 -left-16 w-72 h-72 rounded-full bg-cyan-800 opacity-20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="fade-up fade-up-1 flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 bg-white/15 border border-white/30 backdrop-blur-md text-white text-xs font-dm font-medium tracking-wide px-4 py-1.5 rounded-full">
                <span className="badge-dot w-1.5 h-1.5 rounded-full bg-cyan-200" />
                Agente IA para PYMES · Disponible 24/7
              </span>
            </div>

            <h2 className="fade-up fade-up-2 font-sora font-extrabold text-white leading-tight tracking-tight text-4xl sm:text-5xl md:text-6xl mb-5">
              Gestiona todas tus apps<br />
              <span className="text-cyan-200">con una sola instrucción</span>
            </h2>

            <p className="fade-up fade-up-3 font-dm font-light text-white/75 text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-10">
              AssistWork conecta tus herramientas empresariales — CRM, email, calendario, Drive y más —
              y las controla mediante instrucciones en lenguaje natural. Sin código, sin fricción.
            </p>

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

          <div className="fade-up fade-up-5 scroll-bounce absolute bottom-8 flex flex-col items-center gap-1 text-white/50 text-xs font-dm">
            <span>Descubre más</span>
            <ChevronDown size={18} />
          </div>
        </section>

        {/* ── FEATURES ── */}
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
                  <h4 className="font-sora font-bold text-cyan-900 text-base mb-2">{f.title}</h4>
                  <p className="font-dm font-light text-gray-500 text-sm leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ── */}
        <section id="how-it-works" className="bg-white py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="font-dm font-semibold text-xs text-cyan-600 tracking-widest uppercase">
                Flujo de trabajo
              </span>
              <h3 className="font-sora font-bold text-cyan-900 text-2xl sm:text-3xl md:text-4xl mt-2 tracking-tight">
                ¿Cómo funciona AssistWork?
              </h3>
              <p className="font-dm font-light text-gray-500 text-base mt-3 max-w-xl mx-auto">
                Cuatro pasos simples para transformar la forma en que tu equipo trabaja con sus herramientas digitales.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={i} className="step-card relative bg-sky-50 border border-cyan-100 rounded-2xl p-7">
                  <span className="font-sora font-extrabold text-4xl text-cyan-200 leading-none">{s.number}</span>
                  <div className={`${s.iconBg} p-3 rounded-xl w-fit mt-4 mb-4`}>
                    {s.icon}
                  </div>
                  <h4 className="font-sora font-bold text-cyan-900 text-sm mb-2">{s.title}</h4>
                  <p className="font-dm font-light text-gray-500 text-sm leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>

            {/* Ejemplo de instrucción */}
            <div className="mt-12 bg-cyan-950 rounded-2xl px-8 py-6 flex items-start gap-4">
              <MessageSquare size={20} className="text-cyan-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-dm text-xs text-cyan-400 font-semibold mb-1 tracking-widest uppercase">Ejemplo de instrucción</p>
                <p className="font-dm font-light text-white text-sm leading-relaxed italic">
                  "Dame el resumen de ventas de esta semana, agenda una reunión de seguimiento para el viernes con el equipo y envía el reporte por email al gerente."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PLANES ── */}
        <section id="plans" className="bg-sky-50 py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <span className="font-dm font-semibold text-xs text-cyan-600 tracking-widest uppercase">
                Precios
              </span>
              <h3 className="font-sora font-bold text-cyan-900 text-2xl sm:text-3xl md:text-4xl mt-2 tracking-tight">
                Planes diseñados para crecer contigo
              </h3>
              <p className="font-dm font-light text-gray-500 text-base mt-3 max-w-lg mx-auto">
                Empieza gratis y escala cuando lo necesites. Sin sorpresas, sin tarjeta de crédito.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              {plans.map((plan, i) => (
                <div
                  key={i}
                  className={`plan-card rounded-2xl p-8 border ${
                    plan.highlight
                      ? "bg-gradient-to-br from-cyan-600 to-cyan-800 border-cyan-500 text-white shadow-xl"
                      : "bg-white border-cyan-100 shadow-sm"
                  }`}
                >
                  {plan.highlight && (
                    <span className="inline-block bg-white/20 text-white text-xs font-sora font-semibold px-3 py-1 rounded-full mb-4 border border-white/30">
                      Próximamente
                    </span>
                  )}
                  <h4 className={`font-sora font-extrabold text-xl mb-1 ${plan.highlight ? "text-white" : "text-cyan-900"}`}>
                    {plan.name}
                  </h4>
                  <p className={`font-sora font-bold text-3xl mb-2 ${plan.highlight ? "text-cyan-200" : "text-cyan-600"}`}>
                    {plan.price}
                  </p>
                  <p className={`font-dm font-light text-sm mb-6 leading-relaxed ${plan.highlight ? "text-white/75" : "text-gray-500"}`}>
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle2
                          size={16}
                          className={plan.highlight ? "text-cyan-300 flex-shrink-0" : "text-cyan-500 flex-shrink-0"}
                        />
                        <span className={`font-dm text-sm ${plan.highlight ? "text-white/85" : "text-gray-600"}`}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => plan.highlight ? document.getElementById("contact").scrollIntoView({ behavior: "smooth" }) : setShowRegisterModal(true)}
                    className={`w-full font-sora font-semibold text-sm py-3 rounded-full transition
                      ${plan.highlight
                        ? "bg-white text-cyan-700 hover:bg-cyan-50"
                        : "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:opacity-90 shadow-md"
                      }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EQUIPO / FUNDADOR ── */}
        <section id="team" className="bg-white py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <span className="font-dm font-semibold text-xs text-cyan-600 tracking-widest uppercase">
                El equipo
              </span>
              <h3 className="font-sora font-bold text-cyan-900 text-2xl sm:text-3xl md:text-4xl mt-2 tracking-tight">
                Construido por alguien que entiende las PYMES
              </h3>
            </div>

            <div className="flex justify-center">
              <div className="founder-card rounded-3xl border border-cyan-100 shadow-sm p-10 max-w-md w-full text-center">
                <div className="flex justify-center mb-5">
                  <div className="avatar-ring">
                    <div className="avatar-inner">AE</div>
                  </div>
                </div>

                <h4 className="font-sora font-bold text-cyan-900 text-xl mb-1">
                  Adrián Esteban Armero Burbano
                </h4>
                <p className="font-dm font-semibold text-cyan-600 text-sm mb-4">
                  Fundador & Desarrollador · Ingeniero de Sistemas
                </p>
                <p className="font-dm font-light text-gray-500 text-sm leading-relaxed mb-6">
                  Ingeniero de Sistemas con enfoque en inteligencia artificial e integraciones de software.
                  AssistWork nació de la necesidad real de conectar las herramientas digitales de las PYMES
                  de manera sencilla y accesible, sin requerir conocimientos técnicos del equipo.
                </p>

                {/* Tech stack badges */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {["React", "Python", "FastAPI", "Google Cloud", "LangChain", "OpenAI API"].map((tech) => (
                    <span key={tech} className="bg-sky-50 border border-cyan-100 text-cyan-700 text-xs font-dm font-medium px-3 py-1 rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>

                <a
                  href="mailto:adrian@assistwork.online"
                  className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 font-dm text-sm font-medium transition"
                >
                  <Mail size={15} />
                  adrian@assistwork.online
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTACTO ── */}
        <section id="contact" className="bg-sky-50 py-24 px-6">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
              <span className="font-dm font-semibold text-xs text-cyan-600 tracking-widest uppercase">
                Contacto
              </span>
              <h3 className="font-sora font-bold text-cyan-900 text-2xl sm:text-3xl mt-2 tracking-tight">
                ¿Tienes alguna pregunta?
              </h3>
              <p className="font-dm font-light text-gray-500 text-sm mt-2">
                Escríbenos directamente y te respondemos en menos de 24 horas.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-8">
              {contactSent ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle2 size={40} className="text-cyan-500" />
                  <p className="font-sora font-bold text-cyan-900 text-lg">¡Mensaje enviado!</p>
                  <p className="font-dm text-gray-500 text-sm text-center">
                    Se abrió tu cliente de correo con el mensaje listo. Te responderemos pronto.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="font-dm font-medium text-cyan-900 text-sm mb-1.5 block">Nombre</label>
                    <input
                      type="text"
                      required
                      placeholder="Tu nombre completo"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="contact-input w-full font-dm text-sm text-gray-700 border border-cyan-100 rounded-xl px-4 py-3 bg-sky-50"
                    />
                  </div>
                  <div>
                    <label className="font-dm font-medium text-cyan-900 text-sm mb-1.5 block">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="tu@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="contact-input w-full font-dm text-sm text-gray-700 border border-cyan-100 rounded-xl px-4 py-3 bg-sky-50"
                    />
                  </div>
                  <div>
                    <label className="font-dm font-medium text-cyan-900 text-sm mb-1.5 block">Mensaje</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="¿En qué podemos ayudarte?"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="contact-input w-full font-dm text-sm text-gray-700 border border-cyan-100 rounded-xl px-4 py-3 bg-sky-50 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-sora font-semibold text-sm py-3 rounded-full shadow-md"
                  >
                    Enviar mensaje
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-cyan-100 text-center">
                <p className="font-dm text-xs text-gray-400 mb-2">O escríbenos directamente</p>
                <a
                  href="mailto:adrian@assistwork.online"
                  className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 font-dm text-sm font-medium transition"
                >
                  <Mail size={14} />
                  adrian@assistwork.online
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
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

        {/* ── FOOTER ── */}
        <footer className="bg-cyan-950 text-white/50 text-xs font-dm py-6">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="font-sora font-bold text-white/70 text-sm">AssistWork</span>
            <span>© 2025 AssistWork. Todos los derechos reservados.</span>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-white/80 transition">Privacidad</a>
              <a href="/terms"   className="hover:text-white/80 transition">Términos</a>
              <a href="/refund"  className="hover:text-white/80 transition">Reembolsos</a>
              <a href="mailto:adrian@assistwork.online" className="hover:text-white/80 transition inline-flex items-center gap-1">
                <Mail size={12} /> Contacto
              </a>
            </div>
          </div>
        </footer>

        {/* ── MODALS ── */}
        {showLoginModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/55 backdrop-blur-sm z-50 p-4">
            <LoginCard
              onClose={() => setShowLoginModal(false)}
              onSwitchToRegister={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
            />
          </div>
        )}
        {showRegisterModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/55 backdrop-blur-sm z-50 p-4">
            <RegisterCard
              onClose={() => setShowRegisterModal(false)}
              onSwitchToLogin={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default Home;