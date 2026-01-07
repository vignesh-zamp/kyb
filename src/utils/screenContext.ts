import { ScreenId, OnboardingData } from "@/hooks/useOnboardingFlow";

interface ScreenContext {
  screenId: ScreenId;
  stepNumber: number;
  stepName: string;
  screenTitle: string;
  screenDescription: string;
  whyNeeded: string;
}

export const SCREEN_CONTEXT: Record<ScreenId, { title: string; description: string; whyNeeded: string }> = {
  "0.1": {
    title: "Welcome",
    description: "Get started with Business Onboarding",
    whyNeeded: "Introduction",
  },
  "1.1": {
    title: "Email Address",
    description: "User is entering their email address",
    whyNeeded: "Used for account communication and OTP verification",
  },
  "1.2": {
    title: "Email OTP Verification",
    description: "User is entering the OTP code sent to their email",
    whyNeeded: "Confirms the user has access to the email address provided",
  },
  "1.3": {
    title: "Mobile Number",
    description: "User is entering their mobile number",
    whyNeeded: "Used for SMS notifications and as a secondary verification method",
  },
  "1.4": {
    title: "Mobile OTP Verification",
    description: "User is entering the OTP code sent to their phone",
    whyNeeded: "Confirms the user has access to the phone number provided",
  },
  "1.4A": {
    title: "Full Name",
    description: "User is entering their full name",
    whyNeeded: "Required to match against Identity Document for verification",
  },
  "1.6": {
    title: "Identity Document Upload",
    description: "User is uploading their SSN Card or Passport",
    whyNeeded: "Required by banking regulations for KYC (Know Your Customer) verification",
  },
  "1.7": {
    title: "Identity Confirmation",
    description: "User is reviewing extracted identity document information",
    whyNeeded: "Ensures the extracted data is accurate before proceeding",
  },
  "2.1": {
    title: "Business Type Selection",
    description: "User is selecting whether their business is incorporated or they are a Freelancer",
    whyNeeded: "Different business types require different documentation and verification steps",
  },
  "2.2": {
    title: "Restricted Industries Check",
    description: "User is confirming they are not in a restricted industry",
    whyNeeded: "There are regulatory restrictions on certain industries due to compliance requirements",
  },
  "2.3": {
    title: "Restricted Industries Selection",
    description: "User is viewing the restricted industries modal",
    whyNeeded: "Ensures the user acknowledges business activity restrictions",
  },
  "3.1": {
    title: "Legal Entity Identifier (LEI) Input",
    description: "User is entering their Legal Entity Identifier (LEI) or uploading the document",
    whyNeeded: "Required to verify the business is legally registered in the US",
  },
  "3.2": {
    title: "Legal Entity Identifier (LEI) Confirmation",
    description: "User is reviewing extracted Legal Entity Identifier (LEI) information",
    whyNeeded: "Ensures the extracted business details are correct",
  },
  "3.3": {
    title: "Freelancer Permit Upload",
    description: "User is uploading their freelancer permit",
    whyNeeded: "Required to verify the freelancer is legally permitted to work in the UAE",
  },
  "3.4": {
    title: "Freelancer Permit Confirmation",
    description: "User is reviewing extracted freelancer permit information",
    whyNeeded: "Ensures the extracted permit details are correct",
  },
  "3.5": {
    title: "Articles of Organization Upload",
    description: "User is uploading their Articles of Organization",
    whyNeeded: "Required for corporations/LLCs to verify shareholder structure and ownership percentages",
  },
  "3.6": {
    title: "Partnership Deed Upload",
    description: "User is uploading their Partnership Deed",
    whyNeeded: "Required for Partnerships to verify partner details and ownership structure",
  },
  "3.7": {
    title: "Shareholders Confirmation",
    description: "User is reviewing extracted shareholder information",
    whyNeeded: "Determines authorization requirements based on whether the applicant is a shareholder",
  },
  "3.8": {
    title: "Articles of Incorporation Confirmation",
    description: "User is reviewing extracted Articles of Incorporation details",
    whyNeeded: "Ensures ownership and share distribution are correctly captured",
  },
  "3.9": {
    title: "Articles of Incorporation Upload",
    description: "User is uploading their Articles of Incorporation",
    whyNeeded: "Required for corporations to verify legal structure and ownership",
  },
  "3.10": {
    title: "Articles of Incorporation Confirmation",
    description: "User is reviewing extracted Articles of Incorporation details",
    whyNeeded: "Ensures corporate ownership data is accurate",
  },
  "3.11": {
    title: "Corporate Bylaws Upload",
    description: "User is uploading their Corporate Bylaws",
    whyNeeded: "Required to identify company officers and signing authority",
  },
  "3.12": {
    title: "Corporate Bylaws Confirmation",
    description: "User is reviewing extracted Bylaws details",
    whyNeeded: "Confirms identified officers and their roles",
  },
  "4.1": {
    title: "Authorization Summary",
    description: "User is viewing their authorization status and requirements",
    whyNeeded: "Summarizes whether additional authorization documents are needed",
  },
  "4.2": {
    title: "Non-Shareholder Notice",
    description: "User is informed they need a Power of Attorney",
    whyNeeded: "Applicants who are not shareholders need POA to open accounts on behalf of the company",
  },
  "4.3": {
    title: "Power of Attorney Upload",
    description: "User is uploading their Power of Attorney document",
    whyNeeded: "Authorizes the applicant to act on behalf of the company shareholders",
  },
  "4.4": {
    title: "POA Confirmation",
    description: "User is reviewing extracted POA information",
    whyNeeded: "Ensures the POA is valid and properly authorizes the applicant",
  },
  "4.5": {
    title: "Bank Mandate Upload",
    description: "User is uploading their Bank Mandate document",
    whyNeeded: "Required for companies with multiple shareholders to specify signing authority",
  },
  "4.6": {
    title: "Proof of Address Upload",
    description: "User is uploading proof of address",
    whyNeeded: "Required by banking regulations for KYC compliance",
  },
  "5.1": {
    title: "Online Presence",
    description: "User is indicating if they have a website or social media",
    whyNeeded: "Helps the bank understand the business operations and verify legitimacy",
  },
  "5.2": {
    title: "Website URL",
    description: "User is entering their business website URL",
    whyNeeded: "Allows the bank to verify the online business presence",
  },
  "5.3": {
    title: "International Operations",
    description: "User is indicating if they operate outside the US",
    whyNeeded: "Affects product recommendations and compliance requirements for international transfers",
  },
  "5.4": {
    title: "Operating Countries",
    description: "User is selecting which countries they operate in",
    whyNeeded: "Required for international transfer setup and sanctions screening",
  },
  "5.5": {
    title: "Physical Presence Abroad",
    description: "User is indicating if they have offices or branches abroad",
    whyNeeded: "Affects the complexity of banking requirements and compliance checks",
  },
  "5.6": {
    title: "US Physical Address",
    description: "User is indicating if they have a physical address in the US",
    whyNeeded: "Required for business correspondence and regulatory compliance",
  },
  "5.7": {
    title: "Business Address Input",
    description: "User is entering their US business address",
    whyNeeded: "Required for account correspondence and business verification",
  },
  "6.1": {
    title: "Annual Revenue",
    description: "User is selecting their expected annual turnover",
    whyNeeded: "Helps determine appropriate banking products and plan recommendations",
  },
  "6.2": {
    title: "Source of Funds",
    description: "User is selecting their main sources of business funds",
    whyNeeded: "Required by AML (Anti-Money Laundering) regulations to understand fund origins",
  },
  "6.3": {
    title: "Monthly Deposits",
    description: "User is selecting expected monthly deposit volume",
    whyNeeded: "Helps set up appropriate transaction limits and monitoring",
  },
  "6.4": {
    title: "Monthly Withdrawals",
    description: "User is selecting expected monthly withdrawal volume",
    whyNeeded: "Helps set up appropriate transaction limits and monitoring",
  },
  "6.5": {
    title: "Cash Deposit Percentage",
    description: "User is indicating what percentage of deposits will be cash",
    whyNeeded: "Required by AML regulations - high cash volumes require additional due diligence",
  },
  "6.6": {
    title: "Cash Withdrawal Percentage",
    description: "User is indicating what percentage of withdrawals will be cash",
    whyNeeded: "Required by AML regulations to understand cash usage patterns",
  },
  "6.7": {
    title: "Product Recommendations",
    description: "User is reviewing and selecting recommended banking products",
    whyNeeded: "Products are recommended based on their business profile to meet their needs",
  },
  "6.8": {
    title: "Plan Recommendation",
    description: "User is reviewing and selecting a banking plan",
    whyNeeded: "Plan is recommended based on business size, structure, and needs",
  },
  "7.1": {
    title: "Application Review",
    description: "User is reviewing all submitted information",
    whyNeeded: "Final review before submission to ensure all information is correct",
  },
  "7.2": {
    title: "Declaration",
    description: "User is reading and accepting the terms and conditions",
    whyNeeded: "Legal requirement to acknowledge terms before account opening",
  },
  "7.3": {
    title: "Success",
    description: "Application successfully submitted",
    whyNeeded: "Confirms submission and provides next steps",
  },
};

const STEP_NAMES: Record<number, string> = {
  1: "Identity Verification",
  2: "Eligibility Check",
  3: "Document Upload",
  4: "Authorization",
  5: "Business Details",
  6: "Financial Profile",
  7: "Review & Submit",
};

export function getScreenContext(screenId: ScreenId): ScreenContext {
  const stepNumber = parseInt(screenId.split(".")[0]);
  const contextInfo = SCREEN_CONTEXT[screenId];

  return {
    screenId,
    stepNumber,
    stepName: STEP_NAMES[stepNumber] || "Unknown Step",
    screenTitle: contextInfo?.title || "Unknown Screen",
    screenDescription: contextInfo?.description || "",
    whyNeeded: contextInfo?.whyNeeded || "",
  };
}

export function buildContextSummary(screenId: ScreenId, data: OnboardingData): string {
  const context = getScreenContext(screenId);
  const relevantData: string[] = [];

  // Add relevant collected data based on what's been filled
  if (data.fullName) relevantData.push(`User name: ${data.fullName}`);
  if (data.businessType) relevantData.push(`Business type: ${data.businessType === "incorporated" ? "Incorporated Business" : "Freelancer"}`);
  if (data.tradeLicense.businessName) relevantData.push(`Business name: ${data.tradeLicense.businessName}`);
  if (data.tradeLicense.legalType) {
    const legalTypes: Record<string, string> = {
      sole_proprietorship: "Sole Proprietorship",
      partnership: "Partnership",
      llc: "LLC",
      corp: "Corporation",
    };
    relevantData.push(`Legal type: ${legalTypes[data.tradeLicense.legalType] || data.tradeLicense.legalType}`);
  }
  if (data.shareholders.length > 0) relevantData.push(`Shareholders: ${data.shareholders.length}`);
  if (data.isShareholderMatch !== undefined) relevantData.push(`Applicant is shareholder: ${data.isShareholderMatch ? "Yes" : "No"}`);
  if (data.hasInternationalOps !== null) relevantData.push(`International operations: ${data.hasInternationalOps ? "Yes" : "No"}`);
  if (data.annualRevenue) relevantData.push(`Expected revenue: ${data.annualRevenue}`);

  return `
CURRENT USER CONTEXT:
- Current Step: Step ${context.stepNumber} - ${context.stepName}
- Current Screen: ${context.screenTitle}
- What they're doing: ${context.screenDescription}
- Why this is needed: ${context.whyNeeded}

USER PROFILE DATA:
${relevantData.length > 0 ? relevantData.map(d => `- ${d}`).join("\n") : "- No data collected yet"}

Use this context to provide personalized, relevant answers. If the user asks "why do I need this?" or similar contextual questions, explain specifically why the current step is required based on their business type and profile.`;
}
