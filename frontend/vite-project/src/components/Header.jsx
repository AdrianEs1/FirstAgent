import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, Settings, LogOut, Menu, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import FilesPanel from "./PanelFiles";
import AppsPanel from "./PanelApps";

function Header({ apps, onConnectApp, connectedApps, onDeleteAccount, files, onFilesSelected, onDeleteFile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showUserDropdown, setShowUserDropdown]   = useState(false);
  const [showAppsDropdown, setShowAppsDropdown]   = useState(false);
  const [showFilesDropdown, setShowFilesDropdown] = useState(false);

  const userMenuRef  = useRef(null);
  const appsMenuRef  = useRef(null);
  const filesMenuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current  && !userMenuRef.current.contains(e.target))  setShowUserDropdown(false);
      if (appsMenuRef.current  && !appsMenuRef.current.contains(e.target))  setShowAppsDropdown(false);
      if (filesMenuRef.current && !filesMenuRef.current.contains(e.target)) setShowFilesDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] || "U").toUpperCase();

  return (
    <header className="w-full sticky top-0 z-40" style={{ background: "#070f23", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
      <nav className="flex justify-between items-center max-w-full px-4 md:px-6 py-0" style={{ height: "52px" }}>

        {/* Logo */}
        <h1
          onClick={() => navigate("/agentPage")}
          className="cursor-pointer font-bold text-lg md:text-xl select-none"
          style={{
            background: "linear-gradient(90deg, #00d2ff, #7b5ea7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AssistWork
        </h1>

        <div className="flex items-center gap-1 sm:gap-2">

          {/* FILES — mobile/tablet */}
          <div className="relative lg:hidden" ref={filesMenuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowFilesDropdown(p => !p); setShowAppsDropdown(false); setShowUserDropdown(false); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span>Archivos</span>
              <ChevronDown size={15} />
            </button>
            {showFilesDropdown && (
              <div className="absolute right-1/2 translate-x-1/2 mt-2 w-64 rounded-xl p-3 z-50 overflow-y-auto" style={{ maxHeight: "80vh", background: "#0d1832", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                <FilesPanel files={files} onFilesSelected={onFilesSelected} onDeleteFile={onDeleteFile} />
              </div>
            )}
          </div>

          {/* APPS — mobile/tablet */}
          <div className="relative lg:hidden" ref={appsMenuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowAppsDropdown(p => !p); setShowUserDropdown(false); setShowFilesDropdown(false); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span>Apps</span>
              <ChevronDown size={15} />
            </button>
            {showAppsDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl p-3 z-50 overflow-y-auto" style={{ maxHeight: "80vh", background: "#0d1832", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                <AppsPanel apps={apps} connectedApps={connectedApps} onConnectApp={onConnectApp} />
              </div>
            )}
          </div>

          {/* USER */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowUserDropdown(p => !p); setShowAppsDropdown(false); setShowFilesDropdown(false); }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition"
              style={{ color: "rgba(255,255,255,0.65)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #00d2ff, #7b5ea7)" }}>
                {initials}
              </div>
              <span className="truncate text-sm max-w-[120px] hidden sm:inline">{user?.name || user?.email}</span>
              <ChevronDown size={14} />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl z-50 overflow-hidden" style={{ background: "#0d1832", border: "0.5px solid rgba(255,255,255,0.1)" }}>
                <div className="p-1.5">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition" style={{ color: "rgba(255,255,255,0.65)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <User size={15} /> Perfil
                  </button>
                  <button
                    onClick={() => { navigate("/settings"); setShowUserDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition" style={{ color: "rgba(255,255,255,0.65)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Settings size={15} /> Configuración
                  </button>
                  <div style={{ height: "0.5px", background: "rgba(255,255,255,0.08)", margin: "6px 0" }} />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition" style={{ color: "#ff6b6b" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,100,100,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <LogOut size={15} /> Cerrar Sesión
                  </button>
                  <button
                    onClick={() => { onDeleteAccount(); setShowUserDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition" style={{ color: "#ff6b6b" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,100,100,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Trash2 size={15}/> Eliminar Cuenta
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