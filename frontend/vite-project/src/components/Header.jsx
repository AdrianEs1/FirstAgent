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
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 md:py-3">
        {/* Logo - Responsive sizing */}
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent flex-shrink-0">
          AssistWork
        </h1>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">

          {/* File Picker - Hidden on very small screens */}
          <div className="hidden sm:block">
            <LocalFilePickerButton enabled={true} onFilesSelected={handleFilesSelected} />
          </div>

          {/* Apps Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAppsDropdown(prev => !prev);
                setShowUserDropdown(false);
              }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 transition text-sm sm:text-base"
              aria-label="Menú de aplicaciones"
            >
              <span className="hidden sm:inline">Apps</span>
              <span className="sm:hidden text-xs">Apps</span>
              <ChevronDown size={14} className="sm:hidden" />
              <ChevronDown size={16} className="hidden sm:block" />
            </button>

            {showAppsDropdown && (
              <div
                ref={appsMenuRef}
                className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border z-50 max-h-[80vh] overflow-y-auto"
              >
                <div className="p-2">
                  <p className="sm:hidden text-xs text-gray-500 px-3 py-2 font-semibold uppercase">
                    Archivos
                  </p>
                  <div className="sm:hidden p-2">
                    {/* File Picker Button - Only visible on mobile */}
                    <div className="mb-2">
                      <LocalFilePickerButton enabled={true} onFilesSelected={handleFilesSelected} />
                    </div>
                  <div className='pt-2'><hr className="h-px bg-gray-200 my-2"/></div> 
                  </div>
                  
                
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
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <Icon className={app.color} size={18} />
                          <span className="font-medium text-sm sm:text-base truncate">{app.name}</span>
                        </div>

                        {isConnected ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex-shrink-0">
                            Conectado
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 flex-shrink-0">
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

          {/* User Dropdown - Responsive with truncated text */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserDropdown(prev => !prev);
                setShowAppsDropdown(false);
              }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 transition max-w-[120px] sm:max-w-[200px] md:max-w-none"
              aria-label="Menú de usuario"
            >
              <span className="font-medium truncate text-sm sm:text-base">
                {user?.name || user?.email}
              </span>
              <ChevronDown size={14} className="sm:hidden flex-shrink-0" />
              <ChevronDown size={16} className="hidden sm:block flex-shrink-0" />
            </button>

            {showUserDropdown && (
              <div
                ref={userMenuRef}
                className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl border z-50"
              >
                <div className="p-2">
                  <button className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-left text-sm sm:text-base">
                    <User size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span>Perfil</span>
                  </button>

                  <button className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-left text-sm sm:text-base">
                    <Settings size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span>Configuración</span>
                  </button>

                  <hr className="my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition text-left text-sm sm:text-base"
                  >
                    <LogOut size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span>Cerrar Sesión</span>
                  </button>

                  <button
                    onClick={() => {
                      onDeleteAccount();
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition text-left text-sm sm:text-base"
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
