# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# from copy import deepcopy

# def build_preap_from_di(analyze_result):
#     """Build a PREAP (Prebuilt Result Adapter Parser) JSON object from the Document Intelligence result."""

#     if hasattr(analyze_result, "to_dict"):
#         di_result = analyze_result.to_dict()
#     else:
#         di_result = analyze_result

#     preap = {
#         "apiVersion": di_result.get("apiVersion", None),
#         "modelId": di_result.get("modelId", None),
#         "content": di_result.get("content", None),
#         "pages": [],
#         "documents": []
#     }

#     # Pages
#     if "pages" in di_result:
#         for p in di_result["pages"]:
#             page = deepcopy(p)
#             preap["pages"].append(page)

#     # Documents / fields
#     if "documents" in di_result:
#         for d in di_result["documents"]:
#             doc = deepcopy(d)
#             preap["documents"].append(doc)

#     return preap


# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

from copy import deepcopy
import json
from datetime import datetime
import uuid
from pathlib import Path

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
        "timestamp": datetime.utcnow().isoformat() + "Z",
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

def save_preap_to_file(preap_data, filename, output_dir="preap_output"):
    """
    Save PREAP data to JSON file.
    """
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Add .json extension if not present
    if not filename.endswith('.json'):
        filename += '.json'
    
    file_path = output_path / filename
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(preap_data, f, indent=2, ensure_ascii=False, default=str)
    
    return str(file_path)