import { useState, useCallback } from "react";

export type ScreenId =
  | "0.1"
  | "1.1" | "1.2" | "1.3" | "1.4" | "1.4A" | "1.6" | "1.7"
  | "2.1" | "2.2" | "2.3"
  | "3.1" | "3.2" | "3.3" | "3.4" | "3.5" | "3.6" | "3.7" | "3.8" | "3.9" | "3.10" | "3.11" | "3.12"
  | "4.1" | "4.2" | "4.3" | "4.4" | "4.5" | "4.6"
  | "5.1" | "5.2" | "5.3" | "5.4" | "5.5" | "5.6" | "5.7"
  | "6.1" | "6.2" | "6.3" | "6.4" | "6.5" | "6.6" | "6.7" | "6.8"
  | "7.1" | "7.2" | "7.3";

export interface OnboardingData {
  // Step 1: Identity
  fullName: string;
  email: string;
  phone: string;
  businessType: "incorporated" | "freelancer" | null; // Added back for flow logic
  identityDocument: {
    file?: File;
    fullName: string;
    idNumber: string;
    nationality: string;
    dateOfBirth: string;
    expiryDate: string;
    documentType: "ssn" | "passport" | null;
  };

  // Step 2: Business Verification
  // Re-using tradeLicense object for LEI data
  tradeLicense: {
    file?: File;
    businessName: string;
    licenseNumber: string;
    issuingAuthority: string;
    legalType: "sole_proprietorship" | "partnership" | "llc" | "corp" | null;
    activities: string; // Used for legal form description
    expiryDate: string;
    registeredAt?: string;
  };

  restrictedIndustryConfirmed: boolean;

  // Step 3: Documents
  // Specific data containers for new flow
  dba?: File;
  articlesOfOrganization?: File;
  operatingAgreement?: File;
  partnershipAgreement?: File;
  articlesOfIncorporation?: File;
  bylaws?: File;

  shareholders: Array<{
    name: string;
    nationality: string;
    ownership: string;
    role?: string; // New field for officer title
  }>;

  // Step 4: Authorization
  isShareholderMatch: boolean;
  requiresPOA: boolean;
  requiresResolution: boolean; // Replaced requiresBankMandate for logic, but maybe similar purpose
  requiresBankMandate: boolean; // Keeping for compatibility or specific bank mandate doc
  poa: {
    file?: File;
    grantedBy: string;
    grantedTo: string;
    scope: string;
    dateIssued: string;
    expiryDate: string;
    notarized: boolean;
  };
  resolution?: File; // For Corporate/LLC/Partnership Resolution
  proofOfAddress?: File;

  // Temporary/Legacy fields for compatibility
  extractedWebsiteData?: any;
  extractedLEIData?: any;
  leiCode?: string;
  freelancerPermit?: any;
  websiteVideoPath?: string;
  leiVideoPath?: string;

  // Step 5: Operations
  hasOnlinePresence: boolean | null;
  websiteUrl: string;
  hasInternationalOps: boolean | null;
  operatingCountries: string[];
  hasPhysicalPresenceAbroad: boolean | null;
  hasPhysicalAddress: boolean | null; // Renamed from hasPhysicalAddressUS
  businessAddress: string;

  // Step 6: Financial Profile
  annualRevenue: string; // Renamed from annualTurnover
  sourcesOfFunds: string[];
  monthlyDeposits: string;
  monthlyWithdrawals: string;
  cashDepositPercentage: number;
  cashWithdrawalPercentage: number;

  // Step 7: Final
  selectedProducts: string[];
  selectedPlan: "fundamentals" | "360" | "essential" | "grow" | null; // Updated plan names
}

const initialData: OnboardingData = {
  fullName: "",
  email: "",
  phone: "",
  businessType: null,
  identityDocument: {
    fullName: "",
    idNumber: "",
    nationality: "",
    dateOfBirth: "",
    expiryDate: "",
    documentType: null,
  },
  tradeLicense: {
    businessName: "",
    licenseNumber: "",
    issuingAuthority: "",
    legalType: null,
    activities: "",
    expiryDate: "",
    registeredAt: "",
  },
  restrictedIndustryConfirmed: false,
  dba: undefined,
  articlesOfOrganization: undefined,
  operatingAgreement: undefined,
  partnershipAgreement: undefined,
  articlesOfIncorporation: undefined,
  bylaws: undefined,
  shareholders: [],
  isShareholderMatch: true,
  requiresPOA: false,
  requiresResolution: false,
  requiresBankMandate: false,
  poa: {
    grantedBy: "",
    grantedTo: "",
    scope: "",
    dateIssued: "",
    expiryDate: "",
    notarized: false,
  },
  resolution: undefined,
  proofOfAddress: undefined,
  hasOnlinePresence: null,
  websiteUrl: "",
  hasInternationalOps: null,
  operatingCountries: [],
  hasPhysicalPresenceAbroad: null,
  hasPhysicalAddress: null,
  businessAddress: "",
  annualRevenue: "",
  sourcesOfFunds: [],
  monthlyDeposits: "",
  monthlyWithdrawals: "",
  cashDepositPercentage: 0,
  cashWithdrawalPercentage: 0,
  selectedProducts: [],
  selectedPlan: null,
};

// Dummy extracted data for demo
export const DUMMY_IDENTITY_DOCUMENT = {
  fullName: "John Quincy Adams",
  idNumber: "XXX-XX-XXXX",
  nationality: "United States",
  dateOfBirth: "11/07/1767",
  expiryDate: "14/03/2030",
  documentType: "ssn" as const,
};

export const DUMMY_TRADE_LICENSE = {
  businessName: "Al Rashid Trading LLC",
  licenseNumber: "TL-2024-123456",
  issuingAuthority: "Dubai Economic Department",
  legalType: "llc" as const,
  activities: "General Trading, Import & Export",
  expiryDate: "31/12/2025",
};

export const DUMMY_TRADE_LICENSE_SOLE = {
  businessName: "Ahmed Rashid Electronics",
  licenseNumber: "456",
  issuingAuthority: "Dubai Economic Department",
  legalType: "sole_proprietorship" as const,
  activities: "Electronics Retail & Repair",
  expiryDate: "31/12/2025",
};

export const DUMMY_FREELANCER_PERMIT = {
  fullName: "Ahmed Mohammed Al Rashid",
  permitNumber: "FP-2024-789012",
  issuingAuthority: "Dubai Creative Clusters Authority",
  activity: "IT Consulting Services",
  expiryDate: "31/12/2025",
};

export const DUMMY_SHAREHOLDERS = [
  { name: "Ahmed Mohammed Al Rashid", nationality: "US", ownership: "60%" },
  { name: "Fatima Hassan Al Maktoum", nationality: "US", ownership: "40%" },
];

export const DUMMY_POA = {
  grantedBy: "Ahmed Mohammed Al Rashid",
  grantedTo: "John Smith",
  scope: "Full Banking Authority",
  dateIssued: "01/01/2024",
  expiryDate: "31/12/2025",
  notarized: true,
};

export function getStepFromScreen(screenId: ScreenId): number {
  const prefix = screenId.split(".")[0];
  return parseInt(prefix);
}

export function useOnboardingFlow() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("0.1");
  const [data, setData] = useState<OnboardingData>(initialData);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>([]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const getNextScreenWithData = useCallback((current: ScreenId, currentData: OnboardingData): ScreenId => {
    switch (current) {
      // Step 1: Account Setup
      case "0.1": return "1.1";
      case "1.1": return "1.2"; // Email
      case "1.2": return "1.3"; // Email OTP
      case "1.3": return "1.4"; // Phone
      case "1.4": return "1.4A"; // Phone OTP -> Name
      case "1.4A": return "1.6"; // Name -> ID Upload
      case "1.6": return "1.7"; // ID Upload -> ID Confirm
      case "1.7": return "2.1"; // ID Confirm -> LEI Input

      // Step 2: Business Verification
      case "2.1": return "2.2"; // LEI Input -> LEI Confirm
      case "2.2": return "2.3"; // LEI Confirm -> Restricted Industries
      case "2.3": {
        // Branching based on derived Entity Type
        const type = currentData.tradeLicense.legalType;
        if (type === "sole_proprietorship") return "3.1";
        if (type === "llc") return "3.3";
        if (type === "partnership") return "3.7";
        if (type === "corp") return "3.9";
        return "3.1"; // Fallback
      }

      // Step 3: Entity Docs
      // Sole Prop
      case "3.1": return "3.2"; // DBA Upload -> Confirm
      case "3.2": return currentData.isShareholderMatch ? "4.1" : "4.2";

      // LLC
      case "3.3": return "3.4"; // Articles Org -> Confirm
      case "3.4": return "3.5";
      case "3.5": return "3.6"; // Operating Agreement -> Confirm
      case "3.6": return currentData.isShareholderMatch ? "4.1" : "4.2";

      // Partnership
      case "3.7": return "3.8"; // Partnership Agreement -> Confirm
      case "3.8": return currentData.isShareholderMatch ? "4.1" : "4.2";

      // Corp
      case "3.9": return "3.10"; // Articles Inc -> Confirm
      case "3.10": return "3.11";
      case "3.11": return "3.12"; // Bylaws -> Confirm
      case "3.12": return currentData.isShareholderMatch ? "4.1" : "4.2";

      // Step 4: Authorization
      case "4.1": // Summary (Owner/Shareholder)
        return currentData.requiresResolution ? "4.5" : "4.6";
      case "4.2": return "4.3"; // Summary (Non-Owner) -> POA
      case "4.3": return "4.4"; // POA Upload -> Confirm
      case "4.4":
        return currentData.requiresResolution ? "4.5" : "4.6";
      case "4.5": return "4.6"; // Resolution -> Proof of Address
      case "4.6": return "5.1"; // PoA -> Online Presence

      // Step 5: Operations
      case "5.1": return currentData.hasOnlinePresence ? "5.2" : "5.3";
      case "5.2": return "5.3";
      case "5.3": return currentData.hasInternationalOps ? "5.4" : "5.6";
      case "5.4": return "5.5";
      case "5.5": return "5.6";
      case "5.6": return "6.1";
      case "5.7": return "6.1";

      // Step 6: Financials
      case "6.1": return "6.2";
      case "6.2": return "6.3";
      case "6.3": return "6.4";
      case "6.4": return "6.5";
      case "6.5": return "6.6";
      case "6.6": return "6.7";
      case "6.7": return "6.8";
      case "6.8": return "7.1";

      // Step 7: Final
      case "7.1": return "7.2";
      case "7.2": return "7.3";

      default: return current;
    }
  }, []);

  const goToNextScreen = useCallback((overrideData?: Partial<OnboardingData>) => {
    const mergedData = overrideData ? { ...data, ...overrideData } : data;
    const nextScreen = getNextScreenWithData(currentScreen, mergedData);
    const currentStep = getStepFromScreen(currentScreen);
    const nextStep = getStepFromScreen(nextScreen);

    // Track history for back navigation
    setScreenHistory(prev => [...prev, currentScreen]);

    if (nextStep > currentStep && !completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    setCurrentScreen(nextScreen);
  }, [currentScreen, data, completedSteps, getNextScreenWithData]);

  const goToPreviousScreen = useCallback(() => {
    if (screenHistory.length === 0) return false;
    const previousScreen = screenHistory[screenHistory.length - 1];
    setScreenHistory(prev => prev.slice(0, -1));
    setCurrentScreen(previousScreen);
    return true;
  }, [screenHistory]);

  const canGoBack = screenHistory.length > 0;

  const currentStep = getStepFromScreen(currentScreen);

  return {
    currentScreen,
    currentStep,
    data,
    updateData,
    goToNextScreen,
    goToPreviousScreen,
    canGoBack,
    completedSteps,
    setCurrentScreen,
  };
}
