import { createContext, useState, useEffect } from "react";
import sampleJSON from "../data/sample.json";
import sampleJSON1 from "../data/14_04_20241_13_08.json";
import sampleJSON2 from "../data/14_04_20241_15_15.json";

// paystub json
import SamplePayStub from "../data/paystub/SamplePaystub.json";
// import SamplePayStub1 from "../data/paystub/14_04_20241_13_08.json";
// import SamplePayStub2 from "../data/paystub/14_04_20241_15_15.json";

// w2
import SampleW2 from "../data/3188332/W2/ic_3188332_w2.json";

// credit report
import SampleCRJSON from "../data/3188332/Credit_Report/ic_3188332_creditReport.json";

// wvoe
import SampleWVOE from "../data/3188332/WVOE/ic_3188332_wvoe.json";


import ONEJson from "../data/1040.json";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [themeStyle, setThemeStyle] = useState({ primary: "#4589ff" }); // Default theme is light
  const [jsonData, setJsonData] = useState(SamplePayStub); // default to Paystub
  const [docType, setDocType] = useState("Bank Statement");
  const DOC_TYPES = [
    "Paystub",
    "W2",
    "Bank Statement",
    "Credit Report",
    "WVOE",
    "1040"
    // "VVOE",
    // "Schedule E",
  ];
  const [selectedDocType, setSelectedDocType] = useState(
    DOC_TYPES[0] || "Paystub"
  );

  // Store different feedback dates based on document type
  const feedbackDates = {
    "Bank Statement": [
      "2025-04-14-13-04",
      "2025-03-28-04-05",
      "2025-02-19-10-11",
    ],
    Paystub: [
      "2025-04-14-13-04",
      //  "2025-03-25-10-01", "2025-02-28-11-30"
    ],
  };

  const loadJson = (data) => {
    const finalJson = {
      "Bank Statement": {
        default: sampleJSON,
        "2025-04-14-13-04": sampleJSON,
        "2025-03-28-04-05": sampleJSON1,
        "2025-02-19-10-11": sampleJSON2,
      },
      Paystub: {
        default: SamplePayStub,
        "2025-04-14-13-04": SamplePayStub,
        // "2025-03-25-10-01": SamplePayStub1,
        // "2025-02-28-11-30": SamplePayStub2,
      },
      W2: {
        default: SampleW2,
      },
    };
    setJsonData(finalJson[selectedDocType]?.[data]);
  };

  useEffect(() => {
    // loadJson("default");
    handleJSONChange();
  }, [selectedDocType]);

  const handleJSONChange = () => {
    switch (selectedDocType) {
      case "Bank Statement":
        setJsonData(sampleJSON);
        break;
      case "Paystub":
        setJsonData(SamplePayStub);
        break;
      case "W2":
        setJsonData(SampleW2);
        break;
      case "Credit Report":
        setJsonData(SampleCRJSON);
        break;
      case "WVOE":
        setJsonData(SampleWVOE);
        break;
      case "1040":
        setJsonData(ONEJson);
        break;
      default:
        setJsonData({});
    }
  };
  return (
    <UserContext.Provider
      value={{
        themeStyle,
        jsonData,
        loadJson,
        docType,
        setDocType,
        selectedDocType,
        setSelectedDocType,
        DOC_TYPES,
        feedbackDates:
          feedbackDates[selectedDocType] || feedbackDates["Paystub"], // Dynamically select dates based on docType
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
