import { useRef } from "react";
import { FileUp } from "lucide-react";

export default function LocalFilePickerButton({
  enabled = true,
  onFilesSelected,
  accept = ".pdf,.docx,.txt",
  multiple = true,
}) {
  const fileInputRef = useRef(null);

  const openFilePicker = () => {
    if (!enabled) {
      alert("Funcionalidad deshabilitada");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    onFilesSelected?.(files);

    // 🔁 Permite volver a seleccionar el mismo archivo
    event.target.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={openFilePicker}
        disabled={!enabled}
        className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 transition font-medium shadow-md"
      >
        <FileUp size={16}/>
        <span className="hidden sm:inline">Cargar Archivos</span>
        <span className="sm:hidden">Files</span>
      </button>
    </>
  );
}

