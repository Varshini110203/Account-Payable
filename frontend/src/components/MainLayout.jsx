import { schemaMap } from "../config/schemaMap.js";
import { Dropdown, Button } from "carbon-components-react";
import React, { useState } from "react";
import { RightPanelCloseFilled, RightPanelOpen, ArrowLeft } from "@carbon/icons-react";

import Xarrow from "react-xarrows";
import JViewer from "./JViewer/JViewer.jsx";
import PViewer from "./PViewer/Pviewer.jsx";
import GenericInputFields from "./GenericInputFields.jsx";

const MainLayout = ({ onBackToUpload, jsonData, setJsonData }) => {
  const [selectedDocType, setSelectedDocType] = useState("Invoice");
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState({ key: null, pageNum: null });
  const [pageRenderReady, setPageRenderReady] = useState(false);

  const themeStyle = {
    primary: "#0062ff",
    secondary: "#6f6f6f"
  };

  const DOC_TYPES = ["Invoice", "Receipt", "Purchase Order"];

  const toggleRightPanel = () => {
    setIsRightPanelOpen((prev) => !prev);
  };

  return (
    <div
      className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 overflow-hidden"
      style={{
        padding: "10px 20px",
      }}
    >
      {/* Back Button
      <div className="w-full mb-4">
        <Button
          kind="secondary"
          renderIcon={ArrowLeft}
          onClick={onBackToUpload}
          style={{ marginBottom: "10px" }}
        >
          Back to Upload
        </Button>
      </div> */}

      {/* Left Side - PViewer */}
      <div className="w-full md:w-1/2">
        <div className="border rounded-2xl shadow-md p-4 bg-white">
          <PViewer
            hoveredKey={hoveredKey}
            data={jsonData}
            setPageRenderReady={setPageRenderReady}
          />
        </div>
      </div>

      {/* Right Side - InputFields and Optional JViewer */}
      <div className="w-full md:w-1/2 flex flex-row gap-4">
        {/* Left side of the split - InputFields */}
        <div
          className={`transition-all duration-300 ${
            isRightPanelOpen ? "w-1/2" : "w-full"
          }`}
        >
          <div className="flex justify-end mb-2 pr-2">
            {!isRightPanelOpen ? (
              <RightPanelOpen
                size={24}
                onClick={toggleRightPanel}
                className="cursor-pointer"
              />
            ) : (
              <RightPanelCloseFilled
                size={24}
                onClick={toggleRightPanel}
                className="cursor-pointer"
              />
            )}
          </div>
          <div
            className="border rounded-2xl shadow-md p-4 bg-white"
            style={{ height: "85dvh", marginTop: "1%", overflowY: "auto" }}
          >
            <div
              style={{
                padding: "10px 20px",
              }}
            >
              <Dropdown
                id="inline"
                titleText="Document Type"
                initialSelectedItem={selectedDocType}
                label={selectedDocType}
                items={DOC_TYPES}
                onChange={({ selectedItem }) =>
                  setSelectedDocType(selectedItem)
                }
              />
            </div>
            <GenericInputFields
              data={jsonData}
              setHoveredKey={setHoveredKey}
            />
          </div>
        </div>

        {/* Right panel - JViewer */}
        {isRightPanelOpen && (
          <div
            className="w-1/2 border rounded-2xl shadow-md p-4 bg-white transition-all duration-300"
            style={{ height: "100%" }}
          >
            <JViewer data={jsonData} />
          </div>
        )}
      </div>

      {/* Arrow between JSON and PDF */}
      {hoveredKey.key && (
        <Xarrow
          start={`json-${hoveredKey.key}`}
          end={`pdf-${hoveredKey.key}`}
          color={themeStyle.primary}
          strokeWidth={2}
        />
      )}
    </div>
  );
};

export default MainLayout;
