import json

def extract_w2_data(json_data):
    w2_data = []
    years = []
    wages = []
    employer_name = ""

    
    summary_items = json_data.get("Summary", [])
    for item in summary_items:
        if item.get("SkillName") == "W2":
            labels = item.get("Labels", [])
            for label in labels:
                label_name = label.get("LabelName", "").strip().lower()

                # Grab Year values
                if "year" in label_name:
                    years = [val["Value"] for val in label.get("Values", [])]

                # Grab Wages values
                elif "wages tips other comp" in label_name:
                    wages = [val["Value"] for val in label.get("Values", [])]

                # Grab Employer Name
                elif "employer name" in label_name:
                    if label.get("Values"):
                        employer_name = label["Values"][0]["Value"]

    
    for i in range(max(len(years), len(wages))):
        year = years[i] if i < len(years) else None
        wage = wages[i] if i < len(wages) else None
        if year and wage:
            w2_data.append({
                "year": year,
                "wages": wage
            })

   
    result = {
        "status": "Completed",
        "doc_type": "W2",
        "doc_type_confidence_score": 0.999928594,
        "doc_type_review_needed": False,
        "review_needed_data": {
            "confidence_top": 0.988739312
        },
        "human_review_needed": {
            "is_human_review_needed_pre_matching": True,
            "is_human_review_needed": True
        },
        "extraction_json": {
            "doc_type": "W2",
            "Employer Name": employer_name,
            "w2": w2_data
        },
    }

    return result



with open("ic_3188332_w2.json", "r") as f:
    input_json = json.load(f)

final_output = extract_w2_data(input_json)

with open("final_structured_w2.json", "w") as f:
    json.dump(final_output, f, indent=2)

print("Json saved!!")
