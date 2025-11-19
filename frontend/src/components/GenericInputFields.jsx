import { Accordion, AccordionItem, TextInput } from "carbon-components-react";
import { useEffect, useState } from "react";

const GenericInputFields = ({ data, setHoveredKey }) => {
  const extractionData = data?.extracted_data?.documents?.[0] || {};
  const [formData, setFormData] = useState(extractionData);

  useEffect(() => {
    setFormData(extractionData);
  }, [extractionData]);

  const getPageNumberFromField = (field) => {
    if (!field?.bounding_regions?.[0]) return 1;
    
    const boundingRegion = field.bounding_regions[0];
    if (typeof boundingRegion === 'string') {
      const pageMatch = boundingRegion.match(/pageNumber':\s*(\d+)/);
      return pageMatch ? parseInt(pageMatch[1]) : 1;
    }
    return boundingRegion.pageNumber || 1;
  };

  const handleMouseEnter = (key, pageNum) => {
    if (key && pageNum != null) {
      setHoveredKey({ key, pageNum });
    }
  };

  const handleMouseLeave = () => {
    setHoveredKey({ key: null, pageNum: null });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields?.[field],
          content: value
        }
      }
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...(formData.items || [])];
    if (!updatedItems[index]) updatedItems[index] = { fields: {} };
    
    updatedItems[index].fields[field] = {
      ...updatedItems[index].fields?.[field],
      content: value
    };

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const fields = formData?.fields || {};
  const items = formData?.items || [];

  // Define which fields to display
  const displayFields = [
    "VendorName",
    "VendorAddress", 
    "VendorPhoneNumber",
    "CustomerName",
    "CustomerId",
    "InvoiceId",
    "InvoiceDate",
    "InvoiceTotal",
    "DueDate"
  ];

  return (
    <div
      style={{
        padding: "10px 20px",
        marginTop: "1%",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        height: "85dvh",
        overflowY: "auto",
        
      }}
    >
      {/* Document Information Fields */}
      {displayFields.map((field) => {
        const fieldData = fields[field];
        const pageNum = getPageNumberFromField(fieldData);
        
        return (
          <div
  key={field}
  id={`json-${field}`}
  onMouseEnter={() => handleMouseEnter(field, pageNum)}
  onMouseLeave={handleMouseLeave}
  style={{
    backgroundColor: 'transparent',
    padding: '5px',
    borderRadius: '4px'
  }}
>
  <TextInput
    id={field.toLowerCase().replace(/\s+/g, "-")}
    type="text"
    labelText={field.replace(/([A-Z])/g, " $1").trim()}
    value={fieldData?.content || fieldData?.value || " "}
    onChange={(e) => handleInputChange(field, e.target.value)}
    disabled={false}                   // ALWAYS allow input
    helperText={fieldData ? `Page ${pageNum}` : ''}
  />
</div>

        );
      })}

      {/* Line Items */}
      <Accordion>
        {items.map((item, index) => (
          <AccordionItem
            key={`item-${index}`}
            title={item.fields?.Description?.content || `Item ${index + 1}`}
          >
            {["Description", "Amount"].map((field) => {
              const fieldData = item.fields?.[field];
              const pageNum = getPageNumberFromField(fieldData);
              
              return (
                <div
                  key={`${field}-${index}`}
                  id={`json-${field}-${index}`}
                  onMouseEnter={() => handleMouseEnter(`${field}-${index}`, pageNum)}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    backgroundColor: fieldData ? 'transparent' : '#f5f5f5',
                    padding: '5px',
                    borderRadius: '4px'
                  }}
                >
                  <TextInput
                    id={`${field.toLowerCase()}-${index}`}
                    type="text"
                    labelText={field.replace(/([A-Z])/g, " $1").trim()}
                    value={fieldData?.content || fieldData?.value || ""}
                    onChange={(e) => handleItemChange(index, field, e.target.value)}
                    disabled={false}
                   helperText={fieldData ? `Page ${pageNum}` : ''}
                  />
                </div>
              );
            })}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default GenericInputFields;