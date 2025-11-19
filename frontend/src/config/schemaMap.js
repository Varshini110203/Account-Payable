export const schemaMap = {
  "Bank Statement": {
    flatFields: [
      "Name of Institution",

      "Account Holder",

      "Account Number",

      "beginning date",

      "ending date",
    ],

    sectionKey: "transactions",

    sectionTitle: "Transaction",

    sectionFields: ["Credit_Debit", "Amount", "Account", "Description"],

    sectionTitleField: "Description", // NEW! You can customize here
  },

  Paystub: {
    flatFields: [
      "Employer name",

      "PayPeriodStartDate",

      "PayPeriodEndDate",

      "Pay Frequency",
    ],

    sectionKey: "paystubdetails",

    sectionTitle: "Income",

    sectionFields: [
      "IncomeName",

      "TypeName",

      "IncomeType",

      "Rate",

      "Hours",

      "ThisPeriod",

      "YTDEarnings",
    ],

    sectionTitleField: "TypeName", // NEW! Dynamic title from TypeName
  },

  W2: {
    flatFields: ["Employer Name"],

    sectionKey: "W2",

    sectionTitle: "W2 Detail",

    sectionFields: ["year", "wages"],

    sectionTitleField: "year", // NEW!
  },

  "Credit Report": {
    flatFields: ["Vendor Name"],

    sectionKey: "libilities",

    sectionTitle: "Liabilities", // corrected typo "Libilities"

    sectionFields: [
      "creditor_name",

      "account_number",

      "liability_type",

      "mon payment",
    ],

    sectionTitleField: "creditor_name", // NEW!
  },

  WVOE: {
    flatFields: ["Rate Of Pay", "Pay Frequency", "Hours"],

    sectionKey: "years",

    sectionTitle: "Years",

    sectionFields: [
      "Year",

      "Base Salary",

      "Overtime",

      "Commissions",

      "Bonus",

      "Others",

      "Total",
    ],

    sectionTitleField: "Year", // NEW!
  },

  1040: {
    flatFields: ["First Name", "Last Name", "SSN", "year", "Schedule C Profit or Loss"],

    // sectionKey: "W2",

    // sectionTitle: "W2 Detail",

    // sectionFields: ["year", "wages"],

    // sectionTitleField: "year", // NEW!
  },
};
