import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LoginCard from "../components/Login";
import RegisterCard from "../components/Register";

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const [task, setTask] = useState("");
  

  // Si ya está autenticado, redirigir al dashboard
  

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <header className="w-full bg-white/80 backdrop-blur-md shadow z-50">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-cyan-600">AssistWork</h1>

          {/* Links desktop */}
          <div className="hidden md:flex gap-6">
            <button 
              onClick={() => setShowRegisterModal(true)}
              className="hover:text-cyan-600 transition"
            >
              Registrarse
            </button>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition"
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Toggle móvil */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col items-center gap-2 pb-4 bg-white">
            <button
              onClick={() => {
                setShowRegisterModal(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2 text-center hover:bg-cyan-100"
            >
              Registrarse
            </button>
            <button
              onClick={() => {
                setShowLoginModal(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2 text-center hover:bg-cyan-100"
            >
              Iniciar Sesión
            </button>
          </div>
        )}
      </header>

      {/* HERO */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4">
        {/* HERO */}
        <section className="py-12 md:py-20">
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4">
            Bienvenido a <span className="text-cyan-600">AssistWork</span>
          </h2>

          <p className="max-w-2xl mx-auto text-gray-600 text-base md:text-lg mb-10">
            Tu asistente inteligente diseñado para optimizar la gestión de información, 
            automatizar procesos y ofrecerte respuestas precisas, rápidas y seguras.
          </p>

          {/* CTA (call to action) */}
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Explora todo lo que AssistWork puede hacer por ti
            </h3>
            <p className="text-gray-600 mb-6">
              Inicia sesión o crea una cuenta para acceder a tu asistente personalizado 
              y comenzar a aprovechar todas sus funciones.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-cyan-600 text-white px-5 py-2 rounded-lg hover:bg-cyan-700 transition"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="border border-cyan-600 text-cyan-600 px-5 py-2 rounded-lg hover:bg-cyan-50 transition"
              >
                Registrarse
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="w-full max-w-6xl grid gap-6 md:grid-cols-3 mt-16">
          {[
            { 
              title: "Gestión Inteligente de Información", 
              text: "Centraliza y organiza tus datos con un asistente que entiende el contexto y te ayuda a encontrar lo que necesitas en segundos." 
            },
            { 
              title: "Automatización de Procesos", 
              text: "Optimiza tus tareas diarias y reduce el trabajo manual con flujos automáticos impulsados por IA." 
            },
            { 
              title: "Aprendizaje y Adaptabilidad", 
              text: "OptimusAgent aprende de tus interacciones para ofrecerte respuestas más útiles y personalizadas cada vez." 
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition"
            >
              <h4 className="text-lg font-semibold mb-2">{f.title}</h4>
              <p className="text-gray-600 text-sm">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-cyan-600 text-white py-4 text-center text-sm">
        © 2025 AssistWork. Todos los derechos reservados. |{" "}
        <a href="/privacy">Privacy Policy</a> |{" "}
        <a href="/terms">Terms of Service</a> |{" "}
        <a href="/refund">Refund Policy</a>
      </footer>

      

      {/* MODAL - LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
          <div className="bg-cyan-50 rounded-2xl shadow-2xl w-full max-w-md relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={24} />
            </button>
            <LoginCard 
              onSwitchToRegister={() => {
                setShowLoginModal(false);
                setShowRegisterModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL - REGISTER */}
      {showRegisterModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
          <div className="bg-cyan-50 rounded-2xl shadow-2xl w-full max-w-md relative">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X size={24} />
            </button>
            <RegisterCard 
              onSwitchToLogin={() => {
                setShowRegisterModal(false);
                setShowLoginModal(true);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
