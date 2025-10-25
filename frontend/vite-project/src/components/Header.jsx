import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Mail, Music, Video, LogOut, Settings, User } from 'lucide-react';

function Header({ onConnectApp, connectedApps }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showAppsDropdown, setShowAppsDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const apps = [
        { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-red-500' },
        { id: 'youtube', name: 'YouTube', icon: Video, color: 'text-red-600' },
        { id: 'spotify', name: 'Spotify', icon: Music, color: 'text-green-500' }
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="w-full bg-white/80 backdrop-blur-md shadow-md z-50 sticky top-0">
            <nav className="flex justify-between items-center max-w-7xl mx-auto px-4 py-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    OptimusAgent
                </h1>

                <div className="flex items-center gap-4">
                    {/* Apps Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowAppsDropdown(!showAppsDropdown)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            <span>Apps</span>
                            <ChevronDown size={16} />
                        </button>

                        {showAppsDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowAppsDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-20">
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
                            </>
                        )}
                    </div>

                    {/* User Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            <span className="font-medium">{user?.name || user?.email}</span>
                            <ChevronDown size={16} />
                        </button>

                        {showUserDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowUserDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-20">
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
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;