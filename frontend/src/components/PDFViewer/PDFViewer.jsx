import { Document, Page, pdfjs } from "react-pdf";
import { Loading } from "@carbon/react";
import { useEffect, useRef, useState } from "react";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "./PDFViewer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

function PdfViewer({
  file,
  numPages,
  setNumPages,
  pageNumber,
  setPageNumber,
  data,
  hoveredKey,
  scale,
}) {
  const pageRef = useRef(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 8.5, height: 11 });

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Improved polygon parsing function
  const parsePolygon = (boundingRegion) => {
    try {
      let polygonString;
      
      if (typeof boundingRegion === 'string') {
        // Handle string format: "{'pageNumber': 1, 'polygon': [1.2695, 0.6988, 2.6009, 0.6985, 2.6009, 1.1626, 1.2663, 1.1626]}"
        const polygonMatch = boundingRegion.match(/polygon':\s*\[([^\]]+)\]/);
        if (polygonMatch) {
          polygonString = polygonMatch[1];
        }
      } else if (boundingRegion && boundingRegion.polygon) {
        // Handle object format
        polygonString = Array.isArray(boundingRegion.polygon) 
          ? boundingRegion.polygon.join(',')
          : boundingRegion.polygon;
      }
      
      if (polygonString) {
        const coords = polygonString.split(',').map(coord => parseFloat(coord.trim()));
        return coords;
      }
    } catch (error) {
      console.error('Error parsing polygon:', error, boundingRegion);
    }
    return null;
  };

  // Improved coordinate conversion function
  const polygonToHighlightStyle = (polygon, pageNum, pageWidth = 8.5, pageHeight = 11) => {
    if (!polygon || polygon.length < 8) {
      console.warn('Invalid polygon data:', polygon);
      return null;
    }
    
    try {
      // Extract coordinates - polygon should have 8 points [x1, y1, x2, y2, x3, y3, x4, y4]
      const [x1, y1, x2, y2, x3, y3, x4, y4] = polygon;
      
      // Calculate bounding box from all points
      const xCoords = [x1, x2, x3, x4];
      const yCoords = [y1, y2, y3, y4];
      
      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minY = Math.min(...yCoords);
      const maxY = Math.max(...yCoords);
      
      // Convert to percentages relative to PDF page size (8.5x11 inches)
      const widthPercent = ((maxX - minX) / pageWidth) * 100;
      const heightPercent = ((maxY - minY) / pageHeight) * 100;
      const leftPercent = (minX / pageWidth) * 100;
      const topPercent = (minY / pageHeight) * 100; // PDF coordinates start from bottom-left
      
      return {
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        position: 'absolute',
      };
    } catch (error) {
      console.error('Error calculating highlight style:', error, polygon);
      return null;
    }
  };

  const renderHighlights = () => {
    const extracted = data?.extracted_data?.documents?.[0];
    if (!extracted) {
      console.log('No extracted data found');
      return null;
    }

    const highlightElements = [];
    const pageWidth = 8.5; // Standard PDF page width in inches
    const pageHeight = 11; // Standard PDF page height in inches

    // Process main fields
    Object.entries(extracted.fields || {}).forEach(([key, field]) => {
      if (field?.bounding_regions?.[0]) {
        const boundingRegion = field.bounding_regions[0];
        const polygon = parsePolygon(boundingRegion);
        
        if (polygon) {
          const pageNum = boundingRegion.pageNumber || (typeof boundingRegion === 'string' ? 
            parseInt(boundingRegion.match(/pageNumber':\s*(\d+)/)?.[1] || '1') : 1);
          
          // Only render highlights for current page
          if (pageNum === pageNumber) {
            const style = polygonToHighlightStyle(polygon, pageNum, pageWidth, pageHeight);
            if (style) {
              const isHovered = hoveredKey?.key === key && hoveredKey?.pageNum === pageNum;
              
              highlightElements.push(
                <div
                  key={`field-${key}`}
                  id={`pdf-${key}`}
                  className="pdf-highlight field-highlight"
                  style={{
                    ...style,
                    backgroundColor: isHovered ? "rgba(255, 0, 0, 0.6)" : "rgba(255, 0, 0, 0.3)",
                    border: "2px solid #ff0000",
                    borderRadius: "3px",
                    cursor: "pointer",
                    zIndex: 10,
                    transition: "background-color 0.2s ease",
                    pointerEvents: "auto",
                  }}
                  title={`${key}: ${field.content || field.value}`}
                />
              );
            }
          }
        }
      }
    });

    // Process line items
    extracted.items?.forEach((item, index) => {
      Object.entries(item.fields || {}).forEach(([fieldKey, field]) => {
        if (field?.bounding_regions?.[0]) {
          const boundingRegion = field.bounding_regions[0];
          const polygon = parsePolygon(boundingRegion);
          
          if (polygon) {
            const pageNum = boundingRegion.pageNumber || (typeof boundingRegion === 'string' ? 
              parseInt(boundingRegion.match(/pageNumber':\s*(\d+)/)?.[1] || '1') : 1);
            
            // Only render highlights for current page
            if (pageNum === pageNumber) {
              const style = polygonToHighlightStyle(polygon, pageNum, pageWidth, pageHeight);
              
              if (style) {
                const fullKey = `${fieldKey}-${index}`;
                const isHovered = hoveredKey?.key === fullKey && hoveredKey?.pageNum === pageNum;
                
                highlightElements.push(
                  <div
                    key={`item-${fullKey}`}
                    id={`pdf-${fullKey}`}
                    className="pdf-highlight item-highlight"
                    style={{
                      ...style,
                      backgroundColor: isHovered ? "rgba(0, 100, 255, 0.6)" : "rgba(0, 100, 255, 0.3)",
                      border: "2px solid #0064ff",
                      borderRadius: "2px",
                      cursor: "pointer",
                      zIndex: 10,
                      transition: "background-color 0.2s ease",
                      pointerEvents: "auto",
                    }}
                    title={`${fieldKey}: ${field.content || field.value}`}
                  />
                );
              }
            }
          }
        }
      });
    });

    console.log(`Rendering ${highlightElements.length} highlights for page ${pageNumber}`);
    return highlightElements;
  };

  // Enhanced highlight rendering with hover support
  const renderEnhancedHighlights = () => {
    const highlights = renderHighlights();
    
    // Update hover states when hoveredKey changes
    useEffect(() => {
      if (!hoveredKey?.key) return;
      
      // Reset all highlights to default state first
      document.querySelectorAll('.field-highlight').forEach(element => {
        element.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      });
      document.querySelectorAll('.item-highlight').forEach(element => {
        element.style.backgroundColor = "rgba(0, 100, 255, 0.3)";
      });
      
      // Apply hover state to active element
      const activeElement = document.getElementById(`pdf-${hoveredKey.key}`);
      if (activeElement) {
        if (hoveredKey.key.includes('-')) {
          activeElement.style.backgroundColor = "rgba(0, 100, 255, 0.6)";
        } else {
          activeElement.style.backgroundColor = "rgba(255, 0, 0, 0.6)";
        }
      }
    }, [hoveredKey]);
    
    return highlights;
  };

  // Handle page load to get actual dimensions
  const onPageLoadSuccess = (page) => {
    const { width, height } = page;
    setPageDimensions({ width, height });
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <Loading description="Loading PDF..." withOverlay={false} />
          </div>
        }
        error={
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#ff0000',
            border: '1px solid #ff0000',
            borderRadius: '4px',
            backgroundColor: '#fff0f0'
          }}>
            Failed to load PDF. Please check the file path and try again.
          </div>
        }
      >
        <div 
          style={{ 
            position: "relative",
            display: 'inline-block'
          }}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale || 1.5}
            renderAnnotationLayer={false}
            renderTextLayer={true}
            onLoadSuccess={onPageLoadSuccess}
            loading={
              <div style={{ 
                width: '612px', 
                height: '792px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f5f5f5'
              }}>
                <Loading description="Loading page..." withOverlay={false} />
              </div>
            }
          />
          {renderEnhancedHighlights()}
        </div>
      </Document>

    </div>
  );
}

export default PdfViewer;