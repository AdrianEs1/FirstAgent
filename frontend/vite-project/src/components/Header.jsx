import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Mail,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import LocalFilePickerButton from "../components/LocalFilePickerButton";
import { fetchAgentSendFiles } from "../services/agentServices";

function Header({ onConnectApp, connectedApps, onDeleteAccount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showAppsDropdown, setShowAppsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const apps = [
    { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-red-500' },
  ];

  const appsMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (appsMenuRef.current && !appsMenuRef.current.contains(event.target)) {
        setShowAppsDropdown(false);
      }

      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleFilesSelected = async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    try {
      const res = await fetchAgentSendFiles(formData);
      console.log("📎 Respuesta backend:", res);
    } catch (error) {
      console.error(error?.response?.data?.detail || "Error al enviar archivos");
      alert("Se produjo un error al enviar los archivos");
    }
  };

  return (
    <header className="w-full bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-40">
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-2 py-1">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          AssistWork
        </h1>

        <div className="flex items-center gap-4">

          <LocalFilePickerButton enabled={true} onFilesSelected={handleFilesSelected} />

          {/* Apps Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAppsDropdown(prev => !prev);
                setShowUserDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <span>Apps</span>
              <ChevronDown size={16} />
            </button>

            {showAppsDropdown && (
              <div
                ref={appsMenuRef}
                className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-50"
              >
                <div className="p-2">
                  <p className="text-xs text-gray-500 px-3 py-2 font-semibold uppercase">
                    Integraciones
                  </p>

                  {apps.map((app) => {
                    const Icon = app.icon;
                    const isConnected = connectedApps[app.id];

                    return (
                      <button
                        key={app.id}
                        onClick={() => {
                          onConnectApp(app.id);
                          setShowAppsDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={app.color} size={20} />
                          <span className="font-medium">{app.name}</span>
                        </div>

                        {isConnected ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Conectado
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Conectar
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserDropdown(prev => !prev);
                setShowAppsDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="font-medium">{user?.name || user?.email}</span>
              <ChevronDown size={16} />
            </button>

            {showUserDropdown && (
              <div
                ref={userMenuRef}
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50"
              >
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-left">
                    <User size={18} />
                    <span>Perfil</span>
                  </button>

                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-left">
                    <Settings size={18} />
                    <span>Configuración</span>
                  </button>

                  <hr className="my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition text-left"
                  >
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                  </button>

                  <button
                    onClick={() => {
                      onDeleteAccount();
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition text-left"
                  >
                    <span>Eliminar Cuenta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </nav>
    </header>
  );
}

export default Header;
