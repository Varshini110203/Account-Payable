import { Accordion, AccordionItem, TextInput } from "carbon-components-react";
import { useEffect, useState } from "react";

const PayStubInputFields = ({ data, setHoveredKey }) => {
  const extractionData = data?.extraction_json || {};
  const [formData, setFormData] = useState(extractionData);

  useEffect(() => {
    setFormData(extractionData);
  }, [extractionData]);

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
      [field]: value,
    }));
  };

  const handleIncomeChange = (index, field, value) => {
    const updatedIncome = [...(formData.paystubdetails || [])];
    if (!updatedIncome[index]) updatedIncome[index] = {};
    updatedIncome[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      paystubdetails: updatedIncome,
    }));
  };

  const incomeDetails = formData?.paystubdetails || [];

  const flatFields = [
    "Employer name",
    "PayPeriodStartDate",
    "PayPeriodEndDate",
    "Pay Frequency",
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
      {flatFields.map((field) => (
        <div
          key={field}
          id={`json-${field}`}
          onMouseEnter={() => {
            const coords =
              data.extraction_json_with_coordinates?.[field]?.coordinates;
            if (coords == null) return;

            handleMouseEnter(
              field,
              data.extraction_json_with_coordinates?.[field]?.page_num
            );
          }}
          onMouseLeave={handleMouseLeave}
        >
          <TextInput
            id={field.toLowerCase().replace(/\s+/g, "-")}
            type="text"
            labelText={field}
            value={formData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        </div>
      ))}

      <Accordion>
        {incomeDetails.map((income, index) => (
          <AccordionItem
            key={`income-${index}`}
            title={"Income" || income.IncomeName || `Income ${index + 1}`}
          >
            {[
              "IncomeName",
              "TypeName",
              "IncomeType",
              "Rate",
              "Hours",
              "ThisPeriod",
              "YTDEarnings",
            ].map((field) => (
              <div
                key={`${field}-${index}`}
                id={`json-${field}-${index}`}
                onMouseEnter={() => {
                  const coords =
                    data.extraction_json_with_coordinates?.paystubdetails?.[
                      index
                    ]?.[field]?.coordinates;
                  if (coords == null) return;

                  handleMouseEnter(
                    `${field}-${index}`,
                    data.extraction_json_with_coordinates?.paystubdetails?.[
                      index
                    ]?.[field]?.page_num
                  );
                }}
                onMouseLeave={handleMouseLeave}
              >
                <TextInput
                  id={`${field.toLowerCase()}-${index}`}
                  type="text"
                  labelText={field.replace(/([A-Z])/g, " $1").trim()}
                  value={income[field] || ""}
                  onChange={(e) =>
                    handleIncomeChange(index, field, e.target.value)
                  }
                />
              </div>
            ))}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default PayStubInputFields;
