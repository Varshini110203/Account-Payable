import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [jsonData, setJsonData] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("Invoice");
  const [feedbackDates, setFeedbackDates] = useState([]);
  const [themeStyle, setThemeStyle] = useState({
    primary: "#0062ff",
    secondary: "#6f6f6f"
  });

  const DOC_TYPES = ["Invoice", "Receipt", "Purchase Order"];

  const loadJson = (date) => {
    // Your existing loadJson implementation
    console.log("Loading JSON for date:", date);
  };

  return (
    <UserContext.Provider value={{
      jsonData,
      setJsonData,
      selectedDocType,
      setSelectedDocType,
      feedbackDates,
      setFeedbackDates,
      themeStyle,
      setThemeStyle,
      DOC_TYPES,
      loadJson
    }}>
      {children}
    </UserContext.Provider>
  );
};