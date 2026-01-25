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
        style={{
          padding: "8px 12px",
          borderRadius: "6px",
          backgroundColor: enabled ? "#1a73e8" : "#ccc",
          color: "#fff",
          border: "none",
          cursor: enabled ? "pointer" : "not-allowed",
        }}
      >
        📎 Seleccionar archivos locales
      </button>
    </>
  );
}
