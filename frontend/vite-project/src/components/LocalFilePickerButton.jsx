import { useRef } from "react";

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
        className="flex items-center justify-center gap-1 sm:gap-2 bg-cyan-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-cyan-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        aria-label="Seleccionar archivos"
      >
        <span className="text-base sm:text-lg">📎</span>
        <span className="hidden sm:inline">Archivos</span>
        <span className="sm:hidden">Files</span>
      </button>
    </>
  );
}

