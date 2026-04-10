
import AppsPanel from "./PanelApps";
import FilesPanel from "./PanelFiles";

function SidebarRight({ apps, connectedApps, onConnectApp, files, onFilesSelected, onDeleteFile }) {
  return (
    <div className="flex flex-col h-full gap-6">
      <p className="text-xs font-semibold uppercase" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
        Recursos Disponibles
      </p>
      <AppsPanel
        apps={apps}
        connectedApps={connectedApps}
        onConnectApp={onConnectApp}
      />
      <FilesPanel
        files={files}
        onFilesSelected={onFilesSelected}
        onDeleteFile={onDeleteFile}
      />
    </div>
  );
}

export default SidebarRight;