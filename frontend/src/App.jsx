import React, { useState } from "react";
import MainLayout from "./components/MainLayout.jsx";
import UploadPage from "./components/UploadModal/UploadPage.jsx";
import { UserProvider } from "./context/UserContext.jsx";

const App = () => {
  const [currentPage, setCurrentPage] = useState("upload");
  const [jsonData, setJsonData] = useState(null);
  const [processingInfo, setProcessingInfo] = useState(null);

  const handleFileProcessed = (result) => {
    if (result.success && result.data) {
      setJsonData(result.data);
      setProcessingInfo({
        fileId: result.fileId,
        filename: result.filename,
        jsonSaved: result.jsonSaved
      });
      setCurrentPage("main");
    }
  };

  const handleBackToUpload = () => {
    setCurrentPage("upload");
    setJsonData(null);
    setProcessingInfo(null);
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
            processingInfo={processingInfo}
          />
        )}
      </div>
    </UserProvider>
  );
};

export default App;