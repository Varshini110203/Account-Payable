from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
import tempfile
import uuid
from pathlib import Path
from dotenv import load_dotenv
import uvicorn

# Import from your existing invoice_ex.py
from invoice_ex import InvoiceProcessor

# Load environment variables
load_dotenv()

app = FastAPI(title="Invoice Processing API", version="1.0.0")

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the invoice processor
endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")

if not endpoint or not key:
    raise ValueError("Missing Azure Document Intelligence credentials")

invoice_processor = InvoiceProcessor(endpoint, key)

@app.post("/upload-invoice")
async def upload_invoice(file: UploadFile = File(...)):
    """
    Upload and process an invoice PDF file
    """
    try:
        # Validate file type
        if not file.content_type == "application/pdf" and not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        original_filename = file.filename
        saved_filename = f"{file_id}_{original_filename}"
        saved_path = UPLOAD_DIR / saved_filename
        
        file_size = 0
        
        try:
            # Save the uploaded file
            with open(saved_path, "wb") as buffer:
                while chunk := await file.read(8192):  # 8KB chunks
                    file_size += len(chunk)
                    if file_size > 10 * 1024 * 1024:  # 10MB limit
                        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
                    buffer.write(chunk)
            
            # Process the invoice using your existing processor
            preap_data, error = invoice_processor.process_invoice(saved_path)
            
            if preap_data:
                # Add file info to the response
                preap_data["preap_metadata"]["uploaded_file"] = {
                    "file_id": file_id,
                    "original_filename": original_filename,
                    "saved_filename": saved_filename,
                    "file_size": file_size
                }
                
                return {
                    "success": True,
                    "data": preap_data,
                    "message": "Invoice processed successfully",
                    "filename": original_filename,
                    "file_id": file_id
                }
            else:
                # Clean up saved file if processing failed
                if saved_path.exists():
                    saved_path.unlink()
                raise HTTPException(status_code=500, detail=error or "Failed to process invoice")
                
        except Exception as e:
            # Clean up on error
            if saved_path.exists():
                saved_path.unlink()
            raise e
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.get("/pdf/{file_id}")
async def get_pdf(file_id: str):
    """
    Get uploaded PDF file by ID
    """
    try:
        # Find the file by ID
        pdf_files = list(UPLOAD_DIR.glob(f"{file_id}_*"))
        if not pdf_files:
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        pdf_path = pdf_files[0]
        return FileResponse(
            path=pdf_path,
            filename=pdf_path.name.split('_', 1)[1],  # Remove the UUID prefix
            media_type='application/pdf'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving PDF: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Invoice Processing API"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Invoice Processing API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)