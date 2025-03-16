"use client";

import { useState } from "react";

/**
 * Button to download a DOCX file generated on server from the API.
 * @returns JSX.Element
 */
export const DownloadDocxFromAPI = () => {
  const [loading, setLoading] = useState(false);
  /** fetch from server */
  const downloadDocx = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/docx");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "document.docx";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading DOCX:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", paddingBottom: "20px" }}>
      {/* skipcq: JS-0417 */}
      <button disabled={loading} onClick={downloadDocx} style={{ padding: "10px 20px" }}>
        {loading ? "Downloading..." : "Download DOCX (From API)"}
      </button>
    </div>
  );
};
