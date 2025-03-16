"use client";

import { useState } from "react";

export const DownloadDocxFromAPI = () => {
  const [loading, setLoading] = useState(false);
  const downloadDocx = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/docx");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Error downloading DOCX:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", paddingBottom: "20px" }}>
      <button disabled={loading} onClick={downloadDocx} style={{ padding: "10px 20px" }}>
        {loading ? "Downloading..." : "Download DOCX (From API)"}
      </button>
    </div>
  );
};
