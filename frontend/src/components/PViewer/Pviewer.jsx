import React, { useState, useEffect } from "react";
import PDFViewer from "../PDFViewer/PDFViewer";
import {
  NextOutline,
  PreviousOutline,
  WatsonHealthZoomPan,
  ZoomIn,
  ZoomOut,
  ZoomReset,
} from "@carbon/icons-react";

const PViewer = ({ hoveredKey, data, setPageRenderReady }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pdfFile, setPdfFile] = useState(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const togglePan = () => setIsPanning((p) => !p);

  // Extract PDF data from the processed JSON
  useEffect(() => {
    if (data && data.preap_metadata && data.preap_metadata.uploaded_file) {
      const { file_id } = data.preap_metadata.uploaded_file;
      loadUploadedPdf(file_id);
    }
  }, [data]);

  const loadUploadedPdf = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:8000/pdf/${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfFile(url);
    } catch (error) {
      console.error("Error loading uploaded PDF:", error);
    }
  };

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfFile) {
        URL.revokeObjectURL(pdfFile);
      }
    };
  }, [pdfFile]);

  useEffect(() => {
    if (
      hoveredKey &&
      hoveredKey.pageNum != null &&
      hoveredKey.pageNum !== pageNumber
    ) {
      setPageNumber(hoveredKey.pageNum);
    }
  }, [hoveredKey?.pageNum]);

  useEffect(() => {
    setPageRenderReady(false);
  }, [pageNumber]);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setIsPanning(false);
  };

  const handleMouseDown = (e) => {
    if (!isPanning) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = { ...offset };

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setOffset({ x: startOffset.x + dx, y: startOffset.y + dy });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const showResetButton =
    zoom !== 1 || rotation !== 0 || offset.x !== 0 || offset.y !== 0;

  // Show placeholder if no PDF is available
  if (!data) {
    return (
      <div
        style={{
          height: "85dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          color: "#6f6f6f",
        }}
      >
        <div style={{ fontSize: "48px" }}>📄</div>
        <h3>No PDF Uploaded</h3>
        <p>Upload a PDF invoice to see it displayed here</p>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          margin: "10px 20px",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "1rem" }}>
          <ZoomIn onClick={handleZoomIn} style={{ cursor: "pointer" }} />
          <ZoomOut onClick={handleZoomOut} style={{ cursor: "pointer" }} />
          <WatsonHealthZoomPan onClick={togglePan} style={{ cursor: "pointer" }} />
          {showResetButton && <ZoomReset onClick={handleReset} style={{ cursor: "pointer" }} />}
        </div>
        <div
          style={{
            gap: "1rem",
            display: "flex",
            marginTop: "10px",
            alignItems: "center",
          }}
        >
          <PreviousOutline
            onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
            style={{ cursor: "pointer" }}
          />
          <span>
            Page {pageNumber} of {numPages || "?"}
          </span>
          <NextOutline
            onClick={() => setPageNumber((p) => Math.min(p + 1, numPages || 1))}
            style={{ cursor: "pointer" }}
          />
        </div>
      </div>

      <div
        onMouseDown={handleMouseDown}
        style={{
          height: "85dvh",
          overflow: "auto",
          position: "relative",
          cursor: isPanning ? "grab" : "default",
        }}
      >
        <div
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${offset.x}px, ${offset.y}px)`,
            transformOrigin: "top center",
            transition: isPanning ? "none" : "transform 0.3s ease",
          }}
        >
          <PDFViewer
            file={pdfFile}
            numPages={numPages}
            setNumPages={setNumPages}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            data={data}
            hoveredKey={hoveredKey.key}
            scale={zoom}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default PViewer;