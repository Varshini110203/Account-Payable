"""
Invoice Processing with Azure Document Intelligence and PREAP Output
"""

import os
import time
import json
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from dotenv import find_dotenv, load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeResult

from preap_builder import PreapBuilder


class InvoiceProcessor:
    """Process invoices using Azure Document Intelligence"""
    
    def __init__(self, endpoint: str, key: str):
        self.client = DocumentIntelligenceClient(
            endpoint=endpoint, 
            credential=AzureKeyCredential(key)
        )
        self.preap_builder = PreapBuilder()
    
    def process_invoice(self, file_path: Path) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Process a single invoice file"""
        try:
            print(f"   📄 Reading file: {file_path.name}")
            if not file_path.exists():
                return None, f"File not found: {file_path}"
            
            with open(file_path, "rb") as f:
                file_content = f.read()

            # Analyze with Azure Document Intelligence
            poller = self.client.begin_analyze_document(
                "prebuilt-invoice",
                body=file_content,
                content_type="application/octet-stream"
            )
            
            # Show progress for long-running operations
            while not poller.done():
                print(" Still processing...")
            
            analyze_result = poller.result()
            
            # Build PREAP format
            source_info = {
                "file_path": str(file_path),
                "file_name": file_path.name,
                "file_size": len(file_content),
                "document_type": "invoice",
            }
            
            preap_data = self.preap_builder.build_from_di_result(analyze_result, source_info)
            return preap_data, None
            
        except Exception as e:
            print(f"Error processing {file_path.name}: {str(e)}")
            return None, str(e)


class InvoiceBatchProcessor:
    """Batch processor for multiple invoice files"""
    
    def __init__(self, processor: InvoiceProcessor, output_dir: Path):
        self.processor = processor
        self.output_dir = output_dir
    
    def process_batch(self, input_dir: Path) -> Dict[str, Any]:
        """Process all PDF files in input directory"""
        pdf_files = list(input_dir.glob("*.pdf"))
        
        if not pdf_files:
            print(f"No PDF files found in {input_dir}")
            return {"error": f"No PDF files found in {input_dir}"}
        
        print(f"Found {len(pdf_files)} PDF files to process")
        
        results = {
            "total_files": len(pdf_files),
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "processed_files": []
        }
        
        for i, pdf_file in enumerate(pdf_files, 1):
            print(f"\n[{i}/{len(pdf_files)}] Processing: {pdf_file.name}")
            file_result = self._process_single_file(pdf_file)
            results["processed_files"].append(file_result)
            
            if file_result["status"] == "success":
                results["successful"] += 1
            elif file_result["status"] == "failed":
                results["failed"] += 1
            else:
                results["skipped"] += 1
        
        self._save_summary(results)
        return results
    
    def _process_single_file(self, pdf_file: Path) -> Dict[str, Any]:
        """Process a single PDF file"""
        json_filename = f"{pdf_file.stem}.json"
        json_path = self.output_dir / json_filename
        
        # Skip if already processed
        if json_path.exists():
            print(f"JSON already exists, skipping: {json_filename}")
            return {
                "file": pdf_file.name,
                "status": "skipped",
                "reason": "JSON already exists",
                "json_output": json_filename
            }
        
        # Process invoice
        preap_data, error = self.processor.process_invoice(pdf_file)
        
        if preap_data:
            if self.processor.preap_builder.save_to_file(preap_data, json_path):
                vendor = self._get_vendor_name(preap_data)
                print(f" Successfully processed and saved: {json_filename}")
                print(f" Vendor: {vendor}")
                return {
                    "file": pdf_file.name,
                    "status": "success",
                    "json_output": json_filename,
                    "vendor": vendor
                }
            else:
                print(f"Failed to save JSON for: {pdf_file.name}")
                return {
                    "file": pdf_file.name,
                    "status": "failed",
                    "error": "Failed to save JSON file"
                }
        else:
            print(f"Failed to process {pdf_file.name}: {error}")
            return {
                "file": pdf_file.name,
                "status": "failed",
                "error": error
            }
    
    def _get_vendor_name(self, preap_data: Dict[str, Any]) -> str:
        """Extract vendor name from PREAP data"""
        try:
            documents = preap_data["extracted_data"]["documents"]
            if documents:
                return documents[0]["fields"].get("VendorName", {}).get("value", "N/A")
        except (KeyError, IndexError):
            pass
        return "N/A"
    
    def _save_summary(self, results: Dict[str, Any]):
        """Save processing summary"""
        summary_file = self.output_dir / "processing_summary.json"
        try:
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"Processing summary saved: {summary_file}")
        except Exception as e:
            print(f"Failed to save summary: {e}")


def validate_environment() -> bool:
    """Validate that all required environment variables are set"""
    required_vars = ["DOCUMENTINTELLIGENCE_ENDPOINT", "DOCUMENTINTELLIGENCE_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file or environment.")
        return False
    return True


def validate_paths(input_folder: Path, output_folder: Path) -> bool:
    """Validate that input and output paths are accessible"""
    if not input_folder.exists():
        print(f"Input folder not found: {input_folder}")
        print("Please check the path and make sure the folder exists.")
        return False
    
    try:
        output_folder.mkdir(parents=True, exist_ok=True)
        print(f"Output folder created/verified: {output_folder}")
        return True
    except Exception as e:
        print(f"Cannot create output folder: {e}")
        return False


def main():
    """Main execution function"""    
    # Load environment variables
    load_dotenv(find_dotenv())
    
    # Configuration
    input_folder = Path("Finance_AP\AP Invoice Samples")
    output_folder = Path("preap_output")
    
    # Validate configuration
    if not validate_environment():
        return
    
    if not validate_paths(input_folder, output_folder):
        return
    
    # Initialize processors
    try:
        endpoint = os.getenv("DOCUMENTINTELLIGENCE_ENDPOINT")
        key = os.getenv("DOCUMENTINTELLIGENCE_API_KEY")
        
        invoice_processor = InvoiceProcessor(endpoint, key)
        batch_processor = InvoiceBatchProcessor(invoice_processor, output_folder)
        
        print("Azure Document Intelligence client initialized successfully")
        
    except Exception as e:
        print(f"Failed to initialize Azure client: {e}")
        return
    
    # Process batch
    start_time = time.time()
    results = batch_processor.process_batch(input_folder)
    total_time = time.time() - start_time
    
    # Print final summary
    print (f"Total PDFs: {results['total_files']} processed")


if __name__ == "__main__":
    main()