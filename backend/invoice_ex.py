# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# coding: utf-8

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

# coding: utf-8

# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------

"""
This code sample shows Prebuilt Invoice operations with the Azure AI Document Intelligence client library. 
The async versions of the samples require Python 3.8 or later.

To learn more, please visit the documentation - Quickstart: Document Intelligence (formerly Form Recognizer) SDKs
https://learn.microsoft.com/azure/ai-services/document-intelligence/quickstarts/get-started-sdks-rest-api?pivots=programming-language-python
"""

import os
import json
from datetime import datetime, UTC
import uuid
from pathlib import Path
from copy import deepcopy
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest, AnalyzeResult
from dotenv import find_dotenv, load_dotenv

"""
Remember to remove the key from your code when you're done, and never post it publicly. For production, use
secure methods to store and access your credentials. For more information, see 
https://docs.microsoft.com/en-us/azure/cognitive-services/cognitive-services-security?tabs=command-line%2Ccsharp#environment-variables-and-application-configuration
"""

load_dotenv(find_dotenv())

endpoint = os.environ["DOCUMENTINTELLIGENCE_ENDPOINT"]
key = os.environ["DOCUMENTINTELLIGENCE_API_KEY"]

def build_preap_from_di(analyze_result, source_info=None):
    """
    Build a PREAP (Prebuilt Result Adapter Parser) JSON object from Document Intelligence result.
    """
    
    # Convert to dictionary if it's a SDK object
    if hasattr(analyze_result, "to_dict"):
        di_result = analyze_result.to_dict()
    else:
        di_result = analyze_result

    # Build PREAP structure
    preap = {
        "preap_version": "1.0",
        "preap_id": str(uuid.uuid4()),
        "timestamp": datetime.now(UTC).isoformat(),
        "source": source_info or {},
        "metadata": {
            "apiVersion": di_result.get("apiVersion"),
            "modelId": di_result.get("modelId"),
            "contentFormat": di_result.get("contentFormat", "text")
        },
        "content": di_result.get("content", ""),
        "pages": deepcopy(di_result.get("pages", [])),
        "documents": deepcopy(di_result.get("documents", []))
    }
    
    return preap

def save_preap_to_file(preap_data, file_path):
    """
    Save PREAP data to JSON file.
    """
    try:
        # Create parent directory if it doesn't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(preap_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"   💾 File saved successfully: {file_path}")
        return str(file_path)
    except Exception as e:
        print(f"   ❌ Error saving file: {e}")
        return None

def extract_invoice_fields_to_dict(invoices):
    """
    Extract invoice fields to a structured dictionary for easy JSON serialization.
    """
    result = {
        "documents": []
    }
    
    for idx, invoice in enumerate(invoices.documents):
        invoice_data = {
            "document_number": idx + 1,
            "fields": {}
        }
        
        # Helper function to extract field data
        def extract_field(field_name, field_obj, value_type="value"):
            if field_obj:
                field_data = {
                    "value": getattr(field_obj, value_type, None),
                    "confidence": field_obj.confidence
                }
                
                # Handle specific value types
                if value_type == "value_currency":
                    field_data["value"] = field_obj.value_currency.amount if field_obj.value_currency else None
                    field_data["currency"] = field_obj.value_currency.currency_symbol if field_obj.value_currency else None
                elif value_type == "value_address":
                    field_data["value"] = field_obj.value_address
                elif value_type == "value_date":
                    field_data["value"] = field_obj.value_date
                
                return field_data
            return None
        
        # Extract all fields
        fields_to_extract = [
            ("VendorName", "value_string"),
            ("VendorAddress", "value_address"),
            ("VendorAddressRecipient", "value_string"),
            ("CustomerName", "value_string"),
            ("CustomerId", "value_string"),
            ("CustomerAddress", "value_address"),
            ("CustomerAddressRecipient", "value_string"),
            ("InvoiceId", "value_string"),
            ("InvoiceDate", "value_date"),
            ("InvoiceTotal", "value_currency"),
            ("DueDate", "value_date"),
            ("PurchaseOrder", "value_string"),
            ("BillingAddress", "value_address"),
            ("BillingAddressRecipient", "value_string"),
            ("ShippingAddress", "value_address"),
            ("ShippingAddressRecipient", "value_string"),
            ("SubTotal", "value_currency"),
            ("TotalTax", "value_currency"),
            ("PreviousUnpaidBalance", "value_currency"),
            ("AmountDue", "value_currency"),
            ("ServiceStartDate", "value_date"),
            ("ServiceEndDate", "value_date"),
            ("ServiceAddress", "value_address"),
            ("ServiceAddressRecipient", "value_string"),
            ("RemittanceAddress", "value_address"),
            ("RemittanceAddressRecipient", "value_string")
        ]
        
        for field_name, value_type in fields_to_extract:
            field_obj = invoice.fields.get(field_name)
            if field_obj:
                invoice_data["fields"][field_name] = extract_field(field_name, field_obj, value_type)
        
        # Extract items
        items_field = invoice.fields.get("Items")
        if items_field and hasattr(items_field, 'value_array') and items_field.value_array:
            invoice_data["items"] = []
            for item_idx, item in enumerate(items_field.value_array):
                item_data = {
                    "item_number": item_idx + 1
                }
                
                item_fields_to_extract = [
                    ("Description", "value_string"),
                    ("Quantity", "value_number"),
                    ("Unit", "value_number"),
                    ("UnitPrice", "value_currency"),
                    ("ProductCode", "value_string"),
                    ("Date", "value_date"),
                    ("Tax", "value_string"),
                    ("Amount", "value_currency")
                ]
                
                for field_name, value_type in item_fields_to_extract:
                    field_obj = item.value_object.get(field_name)
                    if field_obj:
                        item_data[field_name] = extract_field(field_name, field_obj, value_type)
                
                invoice_data["items"].append(item_data)
        
        result["documents"].append(invoice_data)
    
    return result

def process_single_invoice(file_path, document_intelligence_client):
    """
    Process a single invoice file and return the analysis results.
    """
    try:
        print(f"\n🔍 Processing: {file_path.name}")
        
        # Check if file exists and is readable
        if not file_path.exists():
            return None, f"File does not exist: {file_path}"
        
        # Read the file content
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        print(f"   📄 File size: {len(file_content)} bytes")
        
        # Analyze the document using the correct method signature
        print("   ⏳ Analyzing with Azure Document Intelligence...")
        poller = document_intelligence_client.begin_analyze_document(
            "prebuilt-invoice",
            body=file_content,
            content_type="application/octet-stream"
        )
        invoices = poller.result()
        print("   ✅ Analysis completed successfully")
        
        # Create PREAP format
        source_info = {
            "file_path": str(file_path),
            "file_name": file_path.name,
            "file_size": len(file_content),
            "document_type": "invoice",
            "analyzed_at": datetime.now(UTC).isoformat()
        }
        
        preap_data = build_preap_from_di(invoices, source_info)
        extracted_data = extract_invoice_fields_to_dict(invoices)
        
        # Combine both for comprehensive output in PREAP format
        comprehensive_output = {
            "preap_metadata": {
                "preap_version": "1.0",
                "preap_id": str(uuid.uuid4()),
                "timestamp": datetime.now(UTC).isoformat(),
                "source": source_info
            },
            "extracted_data": extracted_data,
            "full_analysis": preap_data
        }
        
        return comprehensive_output, None
        
    except Exception as e:
        print(f"   ❌ Error during processing: {e}")
        return None, str(e)

def main():
    # Define the absolute folder paths
    input_folder_path = Path(r"C:\Varshini\Document-Review\backend\Finance_AP\AP Invoice Samples")
    output_folder_path = Path(r"C:\Varshini\Document-Review\backend\preap_output")
    
    print("🚀 Starting Invoice Processing...")
    print(f"📂 Input folder: {input_folder_path}")
    print(f"📂 Output folder: {output_folder_path}")
    
    # Check if input folder exists
    if not input_folder_path.exists():
        print(f"❌ Input folder '{input_folder_path}' not found!")
        print(f"Please check the path and make sure the folder exists.")
        return
    
    # Create output folder if it doesn't exist
    output_folder_path.mkdir(parents=True, exist_ok=True)
    print(f"✅ Output folder created/verified: {output_folder_path}")
    
    # Find all PDF files in the input folder
    pdf_files = list(input_folder_path.glob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ No PDF files found in '{input_folder_path}'!")
        print(f"Please make sure there are PDF files in the folder.")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF files in '{input_folder_path}'")
    
    # Check Azure credentials
    if not endpoint or not key:
        print("❌ Azure credentials not found!")
        print("Please check your DOCUMENTINTELLIGENCE_ENDPOINT and DOCUMENTINTELLIGENCE_API_KEY environment variables")
        return
    
    # Initialize Document Intelligence client
    try:
        document_intelligence_client = DocumentIntelligenceClient(
            endpoint=endpoint, credential=AzureKeyCredential(key)
        )
        print("✅ Azure Document Intelligence client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Azure client: {e}")
        return
    
    # Process each PDF file
    successful_processing = 0
    failed_processing = 0
    processed_files = []
    
    for pdf_file in pdf_files:
        try:
            # Create JSON filename based on PDF filename
            json_filename = f"{pdf_file.stem}.json"
            json_file_path = output_folder_path / json_filename
            
            # Check if JSON already exists in output folder
            if json_file_path.exists():
                print(f"   ⚠️ JSON file already exists, skipping: {json_filename}")
                continue
            
            # Process the invoice
            result, error = process_single_invoice(pdf_file, document_intelligence_client)
            
            if result:
                # Save the result as individual JSON file in preap_output folder
                saved_path = save_preap_to_file(result, json_file_path)
                
                if saved_path:
                    print(f"✅ Successfully processed: {pdf_file.name}")
                    
                    # Print brief summary
                    if result["extracted_data"]["documents"]:
                        doc = result["extracted_data"]["documents"][0]
                        vendor = doc["fields"].get("VendorName", {}).get("value", "N/A")
                        total = doc["fields"].get("InvoiceTotal", {}).get("value", "N/A")
                        currency = doc["fields"].get("InvoiceTotal", {}).get("currency", "")
                        invoice_id = doc["fields"].get("InvoiceId", {}).get("value", "N/A")
                        print(f"   🏢 Vendor: {vendor}")
                        print(f"   🆔 Invoice ID: {invoice_id}")
                        print(f"   💰 Total: {total} {currency}")
                    
                    successful_processing += 1
                    processed_files.append({
                        "pdf": pdf_file.name,
                        "json": json_filename,
                        "vendor": doc["fields"].get("VendorName", {}).get("value", "N/A") if result["extracted_data"]["documents"] else "N/A"
                    })
                else:
                    print(f"❌ Failed to save JSON for: {pdf_file.name}")
                    failed_processing += 1
            else:
                print(f"❌ Failed to process {pdf_file.name}: {error}")
                failed_processing += 1
                
        except Exception as e:
            print(f"❌ Unexpected error processing {pdf_file.name}: {str(e)}")
            failed_processing += 1
        
        print("-" * 50)  # Separator line between files
    
    # Print summary
    print("\n" + "=" * 60)
    print("📋 FINAL PROCESSING SUMMARY:")
    print(f"   ✅ Successful: {successful_processing}")
    print(f"   ❌ Failed: {failed_processing}")
    print(f"   📁 Total PDFs: {len(pdf_files)}")
    print(f"   💾 JSON files created: {successful_processing}")
    print(f"   📍 Input Location: {input_folder_path}")
    print(f"   📍 Output Location: {output_folder_path}")
    
    if successful_processing > 0:
        print(f"\n🎉 Successfully created {successful_processing} JSON files!")
        print("📂 Check the output folder for your JSON files:")
        print(f"   {output_folder_path}")
        
        # Create a summary file
        summary_file = output_folder_path / "processing_summary.json"
        summary_data = {
            "processing_date": datetime.now(UTC).isoformat(),
            "total_pdfs": len(pdf_files),
            "successful_processing": successful_processing,
            "failed_processing": failed_processing,
            "processed_files": processed_files
        }
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n📊 Processing summary saved: {summary_file}")
    else:
        print(f"\n😞 No JSON files were created. Please check the errors above.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()