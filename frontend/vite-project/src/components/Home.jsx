import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAgentTask } from "../services/agentServices";
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
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  const [task, setTask] = useState("");
  const [taskResponse, setTaskResponse] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskLoading(true);
    setShowTaskModal(true);

    if (!task) {
      setTaskResponse("Por favor escribe una tarea");
      setTaskLoading(false);
      return;
    }

    try {
      const data = { message: task };
      const response = await fetchAgentTask(data);
      setTaskResponse(response.message);
    } catch (error) {
      setTaskResponse("Error en el servidor");
    } finally {
      setTaskLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <header className="w-full bg-white/80 backdrop-blur-md shadow z-50">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-cyan-600">OptimusAgent</h1>

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
        <section className="py-12 md:py-20">
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4">
            Bienvenido a <span className="text-cyan-600">OptimusAgent</span>
          </h2>

          <p className="max-w-2xl mx-auto text-gray-600 text-base md:text-lg mb-6">
            Te ayudamos en tus tareas diarias de forma rápida, sencilla y segura.
          </p>

          {/* FORM */}
          <form
            onSubmit={handleTaskSubmit}
            className="bg-white p-6 rounded-xl shadow-lg max-w-md mx-auto w-full"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              ¿Qué quieres hacer hoy?
            </h3>

            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Escribe tu tarea..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />

            <button
              type="submit"
              className="w-full mt-4 bg-cyan-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-cyan-700 transition"
            >
              Enviar
            </button>
          </form>
        </section>

        {/* FEATURES */}
        <section className="w-full max-w-6xl grid gap-6 md:grid-cols-3 mt-12">
          {[
            { title: "Fácil de usar", text: "Interfaz clara y amigable para todos los usuarios." },
            { title: "Seguro", text: "Tus datos siempre protegidos y encriptados." },
            { title: "Soporte 24/7", text: "Servicio inmediato para resolver cualquier duda." },
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
        © 2025 OptimusAgent. Todos los derechos reservados.
      </footer>

      {/* MODAL - TAREA */}
      {showTaskModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md text-center">
            {taskLoading ? (
              <>
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium">Por favor espera...</p>
              </>
            ) : (
              <>
                <p className="text-gray-800 mb-4">{taskResponse}</p>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="mt-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
                >
                  Aceptar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL - LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
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
