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
        className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-left text-sm sm:text-base"
        aria-label="Seleccionar archivos"
      >
        <span className="text-base sm:text-lg">📎</span>
        <span className="hidden sm:inline">Archivos</span>
        <span className="sm:hidden">Files</span>
      </button>
    </>
  );
}

