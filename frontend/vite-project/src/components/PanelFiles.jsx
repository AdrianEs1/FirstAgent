import { Trash2 } from "lucide-react";
import { FaFilePdf } from "react-icons/fa";
import LocalFilePickerButton from "./LocalFilePickerButton";

function FilesPanel({ files, onFilesSelected, onDeleteFile }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase mb-3" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
        Archivos
      </p>

      {/* Upload */}
      <div className="mb-3">
        <LocalFilePickerButton enabled={true} onFilesSelected={onFilesSelected} />
      </div>

      {/* Listado */}
      <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
        {files.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.25)" }}>
            No hay archivos
          </p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="group flex items-center justify-between p-2 rounded-lg transition"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FaFilePdf size={15} className="text-red-400 flex-shrink-0" />
                <span className="text-sm truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => onDeleteFile(file.id)}
                className="opacity-0 group-hover:opacity-100 transition p-1 rounded"
                style={{ color: "rgba(255,100,100,0.7)" }}
                onMouseEnter={e => e.currentTarget.style.color = "#ff6b6b"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,100,100,0.7)"}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FilesPanel;