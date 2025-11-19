import React, { useState } from "react";
import MainLayout from "./components/MainLayout.jsx";
import UploadPage from "./components/UploadModal/UploadPage.jsx";
import { UserProvider } from "./context/UserContext.jsx";

const App = () => {
  const [currentPage, setCurrentPage] = useState("upload");
  const [jsonData, setJsonData] = useState(null);

  const handleFileProcessed = (result) => {
    if (result.success && result.data) {
      setJsonData(result.data);
      setCurrentPage("main");
    }
  };

  const handleBackToUpload = () => {
    setCurrentPage("upload");
    setJsonData(null);
  };

  return (
    <UserProvider>
      <div className="flex flex-col h-screen">
        {currentPage === "upload" ? (
          <UploadPage onFileProcessed={handleFileProcessed} />
        ) : (
          <MainLayout 
            onBackToUpload={handleBackToUpload} 
            jsonData={jsonData}
            setJsonData={setJsonData}
          />
        )}
      </div>
    </UserProvider>
  );
};

export default App;