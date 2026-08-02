/** Credit application field catalog + config.
 *  The dealer's builder turns fields on/off and required/optional; the public form
 *  (standalone link + embeddable iframe) renders whatever is enabled. Some fields
 *  reveal conditionally — e.g. previous address/employer appear when time-at is < 2 yrs. */

export type CFieldType = "text" | "email" | "tel" | "date" | "number" | "money" | "ssn" | "select";

export type CField = {
  key: string;
  label: string;
  type: CFieldType;
  options?: string[];
  locked?: boolean;         // core field — always on & required, can't be disabled
  defaultOn?: boolean;      // shown by default in a fresh config
  defaultReq?: boolean;     // required by default
  showIf?: { key: string; lt: number }; // reveal when Number(value) < lt (previous address/job)
  half?: boolean;           // layout hint (narrow field)
};

export type CSection = { id: string; title: string; coapp?: boolean; fields: CField[] };

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export const CATALOG: CSection[] = [
  { id: "applicant", title: "Applicant", fields: [
    { key: "firstName", label: "First name", type: "text", locked: true, half: true },
    { key: "middleName", label: "Middle name", type: "text", defaultOn: false, half: true },
    { key: "lastName", label: "Last name", type: "text", locked: true, half: true },
    { key: "email", label: "Email", type: "email", defaultOn: true, defaultReq: true, half: true },
    { key: "phone", label: "Mobile phone", type: "tel", locked: true, half: true },
    { key: "dob", label: "Date of birth", type: "date", defaultOn: true, defaultReq: true, half: true },
    { key: "ssn", label: "Social Security #", type: "ssn", defaultOn: true, defaultReq: true, half: true },
    { key: "maritalStatus", label: "Marital status", type: "select", options: ["Single", "Married", "Separated", "Divorced", "Widowed"], defaultOn: false, half: true },
    { key: "dependents", label: "Dependents", type: "number", defaultOn: false, half: true },
    { key: "driversLicense", label: "Driver's license #", type: "text", defaultOn: true, half: true },
    { key: "dlState", label: "License state", type: "select", options: STATES, defaultOn: true, half: true },
  ] },
  { id: "address", title: "Current address & residence", fields: [
    { key: "street", label: "Street address", type: "text", locked: true },
    { key: "unit", label: "Apt / unit", type: "text", defaultOn: true, half: true },
    { key: "city", label: "City", type: "text", locked: true, half: true },
    { key: "state", label: "State", type: "select", options: STATES, locked: true, half: true },
    { key: "zip", label: "ZIP", type: "text", locked: true, half: true },
    { key: "residenceType", label: "Housing", type: "select", options: ["Own", "Rent", "Live with family", "Other"], defaultOn: true, defaultReq: true, half: true },
    { key: "housingPayment", label: "Monthly housing payment", type: "money", defaultOn: true, defaultReq: true, half: true },
    { key: "yearsAtAddress", label: "Years at address", type: "number", locked: true, half: true },
    { key: "monthsAtAddress", label: "Add'l months", type: "number", defaultOn: true, half: true },
    // conditional — under 2 years at current address
    { key: "prevStreet", label: "Previous street address", type: "text", defaultOn: true, defaultReq: true, showIf: { key: "yearsAtAddress", lt: 2 } },
    { key: "prevCity", label: "Previous city", type: "text", defaultOn: true, showIf: { key: "yearsAtAddress", lt: 2 }, half: true },
    { key: "prevState", label: "Previous state", type: "select", options: STATES, defaultOn: true, showIf: { key: "yearsAtAddress", lt: 2 }, half: true },
    { key: "prevYears", label: "Years at previous", type: "number", defaultOn: true, showIf: { key: "yearsAtAddress", lt: 2 }, half: true },
  ] },
  { id: "employment", title: "Employment & income", fields: [
    { key: "employmentStatus", label: "Employment status", type: "select", options: ["Employed", "Self-employed", "Retired", "Active Military", "Student", "Unemployed"], defaultOn: true, defaultReq: true, half: true },
    { key: "employerName", label: "Employer", type: "text", defaultOn: true, defaultReq: true, half: true },
    { key: "jobTitle", label: "Job title / occupation", type: "text", defaultOn: true, half: true },
    { key: "employerPhone", label: "Employer phone", type: "tel", defaultOn: true, half: true },
    { key: "grossMonthlyIncome", label: "Gross monthly income", type: "money", locked: true, half: true },
    { key: "yearsAtJob", label: "Years employed", type: "number", locked: true, half: true },
    { key: "monthsAtJob", label: "Add'l months", type: "number", defaultOn: true, half: true },
    // conditional — under 2 years at current job
    { key: "prevEmployerName", label: "Previous employer", type: "text", defaultOn: true, defaultReq: true, showIf: { key: "yearsAtJob", lt: 2 }, half: true },
    { key: "prevJobTitle", label: "Previous job title", type: "text", defaultOn: true, showIf: { key: "yearsAtJob", lt: 2 }, half: true },
    { key: "prevYearsAtJob", label: "Years at previous", type: "number", defaultOn: true, showIf: { key: "yearsAtJob", lt: 2 }, half: true },
  ] },
  { id: "otherIncome", title: "Additional income (optional)", fields: [
    { key: "otherIncomeSource", label: "Source", type: "text", defaultOn: false, half: true },
    { key: "otherIncomeAmount", label: "Monthly amount", type: "money", defaultOn: false, half: true },
  ] },
  { id: "coapplicant", title: "Co-applicant", coapp: true, fields: [
    { key: "coFirstName", label: "First name", type: "text", defaultOn: true, defaultReq: true, half: true },
    { key: "coLastName", label: "Last name", type: "text", defaultOn: true, defaultReq: true, half: true },
    { key: "coRelationship", label: "Relationship", type: "select", options: ["Spouse", "Partner", "Parent", "Sibling", "Other"], defaultOn: true, half: true },
    { key: "coEmail", label: "Email", type: "email", defaultOn: true, half: true },
    { key: "coPhone", label: "Phone", type: "tel", defaultOn: true, defaultReq: true, half: true },
    { key: "coDob", label: "Date of birth", type: "date", defaultOn: true, half: true },
    { key: "coSsn", label: "Social Security #", type: "ssn", defaultOn: true, half: true },
    { key: "coEmployerName", label: "Employer", type: "text", defaultOn: true, half: true },
    { key: "coGrossMonthlyIncome", label: "Gross monthly income", type: "money", defaultOn: true, defaultReq: true, half: true },
  ] },
];

export const DEFAULT_CONSENT =
  "By submitting this application I certify that the information provided is true and complete. I authorize the dealership and its finance sources to obtain my credit report and verify the information in this application for the purpose of evaluating my creditworthiness for a vehicle purchase or lease.";
export const DEFAULT_DISCLAIMER =
  "This is a credit application, not an offer or guarantee of financing. Submitting this application does not obligate you to purchase. Your information is transmitted securely and shared only with lenders for the purpose of this application.";

export type FieldConf = { enabled: boolean; required: boolean };
export type CreditConfig = { fields: Record<string, FieldConf>; coApplicant: boolean };

/** A fresh config from the catalog defaults. */
export function defaultConfig(): CreditConfig {
  const fields: Record<string, FieldConf> = {};
  for (const s of CATALOG) for (const f of s.fields) {
    fields[f.key] = { enabled: f.locked ? true : !!f.defaultOn, required: f.locked ? true : !!f.defaultReq };
  }
  return { fields, coApplicant: false };
}

export const catalogField = (key: string): CField | undefined => CATALOG.flatMap((s) => s.fields).find((f) => f.key === key);
export const fieldConf = (cfg: CreditConfig, f: CField): FieldConf =>
  f.locked ? { enabled: true, required: true } : cfg.fields?.[f.key] ?? { enabled: false, required: false };
