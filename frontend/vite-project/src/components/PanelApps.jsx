function AppsPanel({ apps, connectedApps, onConnectApp }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase mb-3" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
        Integraciones
      </p>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-0.5">
        {apps.map((app) => {
          const Icon = app.icon;
          const isConnected = connectedApps[app.id];
          return (
            <button
              key={app.id}
              onClick={() => onConnectApp(app.id)}
              title={isConnected ? "Desconectar" : "Conectar"}
              className="w-full flex items-center justify-between p-2 rounded-lg transition"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`${app.color} flex-shrink-0`} size={17} />
                <span className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {app.name}
                </span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={
                  isConnected
                    ? { background: "rgba(0,180,100,0.15)", color: "#00c070", border: "0.5px solid rgba(0,180,100,0.3)" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "0.5px solid rgba(255,255,255,0.1)" }
                }
              >
                {isConnected ? "Activo" : "Conectar"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AppsPanel;