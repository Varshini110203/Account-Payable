"""
PREAP (Prebuilt Result Adapter Parser) Builder for Azure Document Intelligence
"""

import uuid
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List
from azure.ai.documentintelligence.models import AnalyzeResult

class PreapBuilder:
    """Builds PREAP format from Document Intelligence results"""
    
    def __init__(self):
        self.preap_version = "1.0"
        self._field_mappings = self._get_all_field_mappings()
        self._item_field_mappings = self._get_all_item_field_mappings()
    
    def build_from_di_result(self, analyze_result, source_info: Dict[str, Any]) -> Dict[str, Any]:
        """Build PREAP structure from Document Intelligence result"""
        
        # Convert to dictionary if it's an SDK object
        di_dict = self._convert_to_dict(analyze_result)
        
        return {
            "preap_metadata": {
                "preap_version": self.preap_version,
                "preap_id": str(uuid.uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": source_info
            },
            "extracted_data": self._extract_invoice_data(analyze_result),
            "full_analysis": {
                "metadata": {
                    "apiVersion": di_dict.get("apiVersion"),
                    "modelId": di_dict.get("modelId"),
                    "contentFormat": di_dict.get("contentFormat", "text")
                },
                "content": di_dict.get("content", ""),
                "pages": di_dict.get("pages", []),
                "documents": di_dict.get("documents", [])
            }
        }
    
    def _get_all_field_mappings(self) -> List[tuple]:
        """Get all possible invoice field mappings"""
        return [
            # Vendor Information
            ("VendorName", "value_string"),
            ("VendorAddress", "value_address"),
            ("VendorAddressRecipient", "value_string"),
            ("VendorTaxId", "value_string"),
            ("VendorPhoneNumber", "value_phone_number"),
            ("VendorEmail", "value_string"),
            ("VendorWebsite", "value_string"),
            
            # Customer Information
            ("CustomerName", "value_string"),
            ("CustomerAddress", "value_address"),
            ("CustomerAddressRecipient", "value_string"),
            ("CustomerId", "value_string"),
            ("CustomerTaxId", "value_string"),
            ("CustomerPhoneNumber", "value_phone_number"),
            ("CustomerEmail", "value_string"),
            
            # Invoice Identification
            ("InvoiceId", "value_string"),
            ("InvoiceDate", "value_date"),
            ("InvoiceTotal", "value_currency"),
            ("DueDate", "value_date"),
            ("PurchaseOrder", "value_string"),
            ("SalesOrder", "value_string"),
            ("ServiceOrder", "value_string"),
            ("Contract", "value_string"),
            ("Project", "value_string"),
            
            # Address Information
            ("BillingAddress", "value_address"),
            ("BillingAddressRecipient", "value_string"),
            ("ShippingAddress", "value_address"),
            ("ShippingAddressRecipient", "value_string"),
            ("ServiceAddress", "value_address"),
            ("ServiceAddressRecipient", "value_string"),
            ("RemittanceAddress", "value_address"),
            ("RemittanceAddressRecipient", "value_string"),
            
            # Financial Information
            ("SubTotal", "value_currency"),
            ("TotalTax", "value_currency"),
            ("PreviousUnpaidBalance", "value_currency"),
            ("AmountDue", "value_currency"),
            ("Discount", "value_currency"),
            ("DiscountDate", "value_date"),
            ("TaxDetails", "value_array"),
            ("PaymentTerms", "value_string"),
            ("PaymentMethod", "value_string"),
            
            # Service Period
            ("ServiceStartDate", "value_date"),
            ("ServiceEndDate", "value_date"),
            
            # Bank Information
            ("BankName", "value_string"),
            ("BankBranch", "value_string"),
            ("BankAccountNumber", "value_string"),
            ("BankRoutingNumber", "value_string"),
            ("BankIban", "value_string"),
            ("BankSwift", "value_string"),
            
            # Additional Fields
            ("ReceiptNumber", "value_string"),
            ("ReceiptDate", "value_date"),
            ("Currency", "value_string"),
            ("ExchangeRate", "value_number"),
            ("Note", "value_string"),
            ("ReferenceNumber", "value_string"),
            ("AttentionTo", "value_string"),
            ("CompanyTaxId", "value_string"),
            ("LicenseNumber", "value_string"),
            ("VatId", "value_string")
        ]
    
    def _get_all_item_field_mappings(self) -> List[tuple]:
        """Get all possible invoice item field mappings"""
        return [
            ("Description", "value_string"),
            ("Quantity", "value_number"),
            ("Unit", "value_string"),
            ("UnitPrice", "value_currency"),
            ("ProductCode", "value_string"),
            ("Date", "value_date"),
            ("Tax", "value_string"),
            ("TaxRate", "value_number"),
            ("TaxAmount", "value_currency"),
            ("Amount", "value_currency"),
            ("Discount", "value_currency"),
            ("DiscountRate", "value_number"),
            ("Code", "value_string"),
            ("CommodityCode", "value_string"),
            ("Measure", "value_string"),
            ("BaseAmount", "value_currency"),
            ("Deposit", "value_currency"),
            ("Total", "value_currency")
        ]
    
    def _convert_to_dict(self, obj) -> Dict[str, Any]:
        """Safely convert object to dictionary"""
        return obj.to_dict() if hasattr(obj, 'to_dict') else obj
    
    def _extract_invoice_data(self, invoices: AnalyzeResult) -> Dict[str, Any]:
        """Extract structured invoice data"""
        if not invoices.documents:
            return {"documents": []}
        
        return {
            "documents": [
                self._extract_single_invoice(invoice, idx)
                for idx, invoice in enumerate(invoices.documents)
            ]
        }
    
    def _extract_single_invoice(self, invoice, index: int) -> Dict[str, Any]:
        """Extract data from a single invoice document"""
        invoice_data = {
            "document_number": index + 1,
            "fields": self._extract_fields(invoice.fields),
            "items": self._extract_items(invoice.fields.get("Items")),
            "tables": self._extract_tables(invoice)
        }
        
        # Remove empty sections
        if not invoice_data["items"]:
            invoice_data.pop("items")
        if not invoice_data["tables"]:
            invoice_data.pop("tables")
            
        return invoice_data
    
    def _extract_fields(self, fields) -> Dict[str, Any]:
        """Extract all invoice fields"""
        extracted_fields = {}
        
        for field_name, value_type in self._field_mappings:
            field_obj = fields.get(field_name)
            if field_obj:
                extracted_fields[field_name] = self._extract_field_value(field_obj, value_type)
        
        return extracted_fields
    
    def _extract_field_value(self, field_obj, value_type: str) -> Dict[str, Any]:
        """Extract value from field based on type"""
        field_data = {
            "value": getattr(field_obj, value_type, None),
            "confidence": field_obj.confidence,
            "content": getattr(field_obj, 'content', None),
            "bounding_regions": getattr(field_obj, 'bounding_regions', None),
            "spans": getattr(field_obj, 'spans', None)
        }
        
        # Handle specific value types
        if value_type == "value_currency" and field_obj.value_currency:
            field_data["value"] = field_obj.value_currency.amount
            field_data["currency"] = field_obj.value_currency.currency_symbol
            field_data["currency_code"] = field_obj.value_currency.currency_code
        elif value_type == "value_address" and field_obj.value_address:
            field_data["value"] = field_obj.value_address
        elif value_type == "value_phone_number" and field_obj.value_phone_number:
            field_data["value"] = field_obj.value_phone_number
        elif value_type == "value_array" and field_obj.value_array:
            field_data["value"] = [
                self._extract_field_value(item, "value_object") 
                for item in field_obj.value_array
            ]
        
        # Clean up None values
        field_data = {k: v for k, v in field_data.items() if v is not None}
        
        return field_data
    
    def _extract_items(self, items_field) -> List[Dict[str, Any]]:
        """Extract line items from invoice"""
        if not items_field or not items_field.value_array:
            return []
        
        items = []
        for item_idx, item in enumerate(items_field.value_array):
            item_data = {
                "item_number": item_idx + 1,
                "fields": {}
            }
            
            for field_name, value_type in self._item_field_mappings:
                field_obj = item.value_object.get(field_name)
                if field_obj:
                    item_data["fields"][field_name] = self._extract_field_value(field_obj, value_type)
            
            # Remove empty fields
            if not item_data["fields"]:
                item_data.pop("fields")
            
            items.append(item_data)
        
        return items
    
    def _extract_tables(self, invoice) -> List[Dict[str, Any]]:
        """Extract table data from invoice"""
        tables = []
        
        # Extract from document level tables if available
        if hasattr(invoice, 'tables') and invoice.tables:
            for table_idx, table in enumerate(invoice.tables):
                table_data = {
                    "table_number": table_idx + 1,
                    "row_count": table.row_count,
                    "column_count": table.column_count,
                    "cells": []
                }
                
                for cell in table.cells:
                    cell_data = {
                        "row_index": cell.row_index,
                        "column_index": cell.column_index,
                        "content": cell.content,
                        "bounding_regions": getattr(cell, 'bounding_regions', None),
                        "spans": getattr(cell, 'spans', None)
                    }
                    table_data["cells"].append(cell_data)
                
                tables.append(table_data)
        
        return tables
    
    def save_to_file(self, preap_data: Dict[str, Any], file_path: Path) -> bool:
        """Save PREAP data to JSON file"""
        try:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(preap_data, f, indent=2, ensure_ascii=False, default=str)
            
            return True
        except Exception as e:
            print(f"Error saving file {file_path}: {e}")
            return False
    
    def get_available_fields(self) -> List[str]:
        """Get list of all available field names"""
        return [field[0] for field in self._field_mappings]
    
    def get_available_item_fields(self) -> List[str]:
        """Get list of all available item field names"""
        return [field[0] for field in self._item_field_mappings]