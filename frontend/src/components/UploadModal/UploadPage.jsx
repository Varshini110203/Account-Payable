
import React, { useState, useRef } from 'react';
import { 
  Button, 
  Loading,
  InlineNotification,
  Tile
} from 'carbon-components-react';
import { Document, DocumentPdf, Upload } from '@carbon/icons-react';
import './UploadPage.css';

const UploadPage = ({ onFileProcessed }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notification, setNotification] = useState({ 
    show: false, 
    kind: '', 
    title: '', 
    message: '' 
  });
  const fileInputRef = useRef(null);

  const showNotification = (kind, title, message) => {
    setNotification({ show: true, kind, title, message });
    setTimeout(() => setNotification({ show: false }), 5000);
  };

  // UploadPage.jsx - Update the handleFileSelect function
const handleFileSelect = async (file) => {
  if (!file) return;

  // Validate file type
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    showNotification('error', 'Invalid File Type', 'Please upload a PDF file');
    return;
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    showNotification('error', 'File Too Large', 'File size must be less than 10MB');
    return;
  }

  setIsUploading(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/upload-invoice', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      showNotification('success', 'Success', 'Invoice processed successfully');
      // Pass the processed data to parent component
      onFileProcessed({
        success: true,
        data: result.data || result // Adjust based on your backend response structure
      });
    } else {
      showNotification('error', 'Processing Failed', result.error || 'Failed to process invoice');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('error', 'Upload Failed', 
      error.message || 'Failed to connect to server. Please make sure the backend is running.'
    );
  } finally {
    setIsUploading(false);
  }
};

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        
        {/* Header Section */}
        <div className="upload-header">
          <div className="header-content">
            <div className="header-icon">
              <Document size={48} />
            </div>
            <div className="header-text">
              <h1 className="upload-title">Invoice Processing</h1>
              <p className="upload-subtitle">
                Upload PDF invoices for automated data extraction and analysis
              </p>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div className="notification-container">
            <InlineNotification
              kind={notification.kind}
              title={notification.title}
              subtitle={notification.message}
              className="notification"
            />
          </div>
        )}

        {/* Main Upload Area */}
        <div className="upload-main">
          <div 
            className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
            
            <div className="upload-dropzone">
              {isUploading ? (
                <div className="upload-loading">
                  <div className="loading-icon">
                    <Loading description="Loading" withOverlay={false} />
                  </div>
                  <div className="loading-content">
                    <h3>Processing Invoice</h3>
                    <p>Extracting data from your document...</p>
                    <div className="loading-progress">
                      <div className="progress-bar">
                        <div className="progress-fill"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="upload-content">
                  <div className="upload-icon">
                    <DocumentPdf size={64} />
                  </div>
                  <div className="upload-text">
                    <h3>Drop your invoice PDF here</h3>
                    <p>or click to browse files</p>
                  </div>
                  <Button
                    kind="primary"
                    onClick={handleBrowseClick}
                    renderIcon={Upload}
                    className="browse-button"
                  >
                    Browse Files
                  </Button>
                  <div className="upload-hint">
                    <p>Supported format: PDF • Maximum size: 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
