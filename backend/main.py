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
import json

# Import from your existing invoice_ex.py
from invoice_ex import InvoiceProcessor

# Load environment variables
load_dotenv()

app = FastAPI(title="Invoice Processing API", version="1.0.0")

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create JSON output directory
JSON_OUTPUT_DIR = Path("processed_json")
JSON_OUTPUT_DIR.mkdir(exist_ok=True)

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
                
                # Save JSON locally
                json_filename = f"{file_id}_{original_filename}.json"
                json_path = JSON_OUTPUT_DIR / json_filename
                
                try:
                    with open(json_path, 'w', encoding='utf-8') as f:
                        json.dump(preap_data, f, indent=2, ensure_ascii=False, default=str)
                    print(f"JSON saved locally: {json_path}")
                except Exception as json_error:
                    print(f"Failed to save JSON locally: {json_error}")
                
                return {
                    "success": True,
                    "data": preap_data,
                    "message": "Invoice processed successfully",
                    "filename": original_filename,
                    "file_id": file_id,
                    "json_saved": True,
                    "json_path": str(json_path)
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

@app.get("/download-json/{file_id}")
async def download_json(file_id: str):
    """
    Download processed JSON file by file ID
    """
    try:
        # Find the JSON file by ID
        json_files = list(JSON_OUTPUT_DIR.glob(f"{file_id}_*"))
        if not json_files:
            raise HTTPException(status_code=404, detail="JSON file not found")
        
        json_path = json_files[0]
        return FileResponse(
            path=json_path,
            filename=json_path.name,
            media_type='application/json'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving JSON: {str(e)}")

@app.get("/list-json")
async def list_json_files():
    """
    List all processed JSON files
    """
    try:
        json_files = []
        for json_path in JSON_OUTPUT_DIR.glob("*.json"):
            json_files.append({
                "filename": json_path.name,
                "file_id": json_path.name.split('_')[0],
                "original_filename": '_'.join(json_path.name.split('_')[1:]).replace('.json', ''),
                "size": json_path.stat().st_size,
                "modified": json_path.stat().st_mtime
            })
        
        return {
            "success": True,
            "files": json_files,
            "count": len(json_files)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing JSON files: {str(e)}")

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