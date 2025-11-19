import { createContext, useState, useEffect } from "react";
import InvoiceJSON from "C:/Varshini/Document-Review/backend/preap_output/AT&T Bill_Inv 8821934010_20250721113143004.json"; // Your invoice JSON

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [themeStyle, setThemeStyle] = useState({ primary: "#4589ff" }); // Default theme is light
  const [jsonData, setJsonData] = useState(InvoiceJSON); // default to Invoice
  const [docType, setDocType] = useState("Invoice");
  
  const DOC_TYPES = [
    "Invoice"
    // Add more document types here as needed in the future
  ];
  
  const [selectedDocType, setSelectedDocType] = useState(
    DOC_TYPES[0] || "Invoice"
  );

  // Store different feedback dates based on document type
  const feedbackDates = {
    "Invoice": [
      "2025-04-14-13-04"
    ],
  };

  const loadJson = (data) => {
    const finalJson = {
      "Invoice": {
        default: InvoiceJSON,
        "2025-04-14-13-04": InvoiceJSON,
      },
    };
    setJsonData(finalJson[selectedDocType]?.[data] || InvoiceJSON);
  };

  useEffect(() => {
    handleJSONChange();
  }, [selectedDocType]);

  const handleJSONChange = () => {
    switch (selectedDocType) {
      case "Invoice":
        setJsonData(InvoiceJSON);
        break;
      default:
        setJsonData(InvoiceJSON); // Default to Invoice
    }
  };

  return (
    <UserContext.Provider
      value={{
        themeStyle,
        jsonData,
        loadJson,
        docType,
        setDocType,
        selectedDocType,
        setSelectedDocType,
        DOC_TYPES,
        feedbackDates: feedbackDates[selectedDocType] || feedbackDates["Invoice"],
      }}
    >
      {children}
    </UserContext.Provider>
  );
};