import React, { useState, useEffect, useContext } from "react";
import PDFViewer from "../PDFViewer/PDFViewer";
import {
  NextOutline,
  PreviousOutline,
  Rotate,
  WatsonHealthZoomPan,
  ZoomIn,
  ZoomOut,
  ZoomReset,
} from "@carbon/icons-react";
import { Tooltip } from "carbon-components-react";
import { UserContext } from "../../context/UserContext.jsx";

const PViewer = ({ hoveredKey, data, setPageRenderReady }) => {
  const { selectedDocType } = useContext(UserContext);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [PDFLoad, setPDFLoad] = useState("/sample.pdf");

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const togglePan = () => setIsPanning((p) => !p);

  useEffect(() => {
    if (
      hoveredKey &&
      hoveredKey.pageNum != null &&
      hoveredKey.pageNum !== pageNumber
    ) {
      setPageNumber(hoveredKey.pageNum);
    }

    // Cleanup: reset to page 1 when hover ends
    // return () => {
    //   setPageNumber(1);
    // };
  }, [hoveredKey?.pageNum]);

  useEffect(() => {
    setPageRenderReady(false);
  }, [pageNumber]);

  useEffect(() => {
    handlePDFChange();
  }, [selectedDocType]);

  const handlePDFChange = () => {
    switch (selectedDocType) {
      case "Bank Statement":
        setPDFLoad("/3188332/pdf/ic_3188332_bankstatement1.pdf");
        break;
      case "Paystub":
        setPDFLoad("/3188332/pdf/ic_3188332_paystub.pdf");
        break;
      case "W2":
        setPDFLoad("/3188332/pdf/ic_3188332_w2.pdf");
        break;
      case "Schedule E":
        setPDFLoad("");
        break;
      case "Credit Report":
        setPDFLoad("/3188332/pdf/ic_3188332_creditreport.pdf");
        break;
      case "VVOE":
        setPDFLoad("");
        break;
      case "WVOE":
        setPDFLoad("/3188332/pdf/ic_3188332_wvoe.pdf");
        break;
      case "1040":
        setPDFLoad("/1040/pdf/31883324_1.pdf");
        break;
      default:
        setPDFLoad("/3188332/pdf/ic_3188332_paystub.pdf");
        break;
    }
    try {
    } catch (ex) {
      console.log("Error in PDFChange", ex);
    }
  };

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
          {/* <Tooltip autoAlign label={'Zoom In'} closeOnActivation={false}> */}
          {/* </Tooltip> */}
          <ZoomIn onClick={handleZoomIn} />
          <ZoomOut onClick={handleZoomOut} />
          <WatsonHealthZoomPan onClick={togglePan} />
          {/* <Rotate onClick={handleRotate} /> */}
          {showResetButton && <ZoomReset onClick={handleReset} />}
        </div>
        <div
          style={{
            // display: "flex",
            // justifyContent: "center",
            gap: "1rem",
            display: "flex",
            marginTop: "10px",
          }}
        >
          <PreviousOutline
            onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
          />
          <span>
            Page {pageNumber} of {numPages}
          </span>
          <NextOutline
            onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))}
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
            file={PDFLoad}
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
