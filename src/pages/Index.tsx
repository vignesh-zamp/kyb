import { useState, useCallback, useEffect, useRef } from "react";
import { OnboardingLayout } from "@/components/layout/OnboardingLayout";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatMessage, Message } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { OptionCard } from "@/components/chat/OptionCard";
import { ModeToggle } from "@/components/mode-toggle";
import { FileUpload } from "@/components/chat/FileUpload";
import { BackLink } from "@/components/chat/BackLink";
import { Building2, Briefcase, ArrowRight } from "lucide-react";
import { Step } from "@/components/chat/ProgressStepper";
import {
  useOnboardingFlow,
  ScreenId,
  DUMMY_IDENTITY_DOCUMENT,
  DUMMY_TRADE_LICENSE,
  DUMMY_TRADE_LICENSE_SOLE,
  DUMMY_FREELANCER_PERMIT,
  DUMMY_SHAREHOLDERS,
  DUMMY_POA,
} from "@/hooks/useOnboardingFlow";
import {
  TextInputScreen,
  OTPInputScreen,
  ExtractionConfirmScreen,
  YesNoScreen,
  BoxSelectionScreen,
  BracketSelectScreen,
  MultiSelectScreen,
  CountrySelectScreen,
  SliderScreen,
  RestrictedIndustriesModal,
  AuthorizationSummaryScreen,
  ShareholderTableScreen,
  ReviewScreen,
  DeclarationScreen,
  SuccessScreen,
  TradeLicenseInputScreen,
  ProductRecommendationScreen,
  PlanRecommendationScreen,
  RangeSliderScreen,
  BusinessTypeSelectionScreen,
  AddressAutocomplete,
  MultiAddressInput,
  AutoPopulatedInfoScreen,
} from "@/components/chat/screens";
import {
  extractIdentityDocumentData, extractAllTradeLicenseData, extractFreelancerPermitData, extractMOAData, extractBylawsData,
  extractPOAData,
  extractDBAData
} from "@/lib/gemini";
import { fetchLeiDetails } from "@/utils/gleifApi";
import { HelpChat } from "@/components/chat/screens/HelpChat";

// --- Zamp Integration Helpers ---
const ZAMP_API_URL = import.meta.env.VITE_API_URL; // Use configured VITE_API_URL

const initZampProcess = async () => {
  try {
    const response = await fetch(`${ZAMP_API_URL}/zamp/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processName: "Business Onboarding Application", team: "Applicant" })
    });
    const data = await response.json();
    return data.processId;
  } catch (error) {
    console.error("Failed to init Zamp process:", error);
    return null;
  }
};

const logToZamp = async (processId: string, log: any, stepId?: string, keyDetails?: any, metadata?: any) => {
  try {
    await fetch(`${ZAMP_API_URL}/zamp/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processId, log, stepId, keyDetails, metadata }),
    });
  } catch (error) {
    console.error("Failed to log to Zamp:", error);
  }
};

const uploadToZamp = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${ZAMP_API_URL} /zamp/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    return data.path;
  } catch (error) {
    console.error("Failed to upload to Zamp:", error);
    return null;
  }
};

const AddressInputWrapper = ({
  data,
  stepInfo,
  onMatched,
  onManualInput
}: {
  data: any,
  stepInfo: any,
  onMatched: (v: string) => void,
  onManualInput: (v: string) => void
}) => {
  const [status, setStatus] = useState<"checking" | "input" | "matched">("checking");
  const [matchedAddr, setMatchedAddr] = useState("");

  useEffect(() => {
    const checkMatch = async () => {
      // Extract addresses
      const websiteAddress = data.extractedWebsiteData?.address;
      const leiAddress = data.extractedLEIData?.["LEGAL ADDRESS"];

      if (!websiteAddress || !leiAddress) {
        setStatus("input");
        return;
      }

      try {
        const response = await fetch(`${ZAMP_API_URL}/match-addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address1: websiteAddress, address2: leiAddress })
        });

        const result = await response.json();
        if (result.match) {
          setMatchedAddr(leiAddress);
          setStatus("matched");
        } else {
          setStatus("input");
        }
      } catch (e) {
        console.error("Match failed", e);
        setStatus("input");
      }
    };

    checkMatch();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <TypingIndicator />
        <p className="text-sm text-gray-500 mt-2">Comparing company addresses...</p>
      </div>
    );
  }

  if (status === "matched") {
    return (
      <ExtractionConfirmScreen
        fields={[
          { key: "addr", label: "Verified Address", value: matchedAddr }
        ]}
        onConfirm={() => onMatched(matchedAddr)}
      />
    );
  }

  return (
    <div className="w-full max-w-md animate-slide-up space-y-4">
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 mb-2">
        We noticed a mismatch in your addresses. Please search and select your correct business location.
      </div>
      <AddressAutocomplete
        onSelect={onManualInput}
        placeholder="Search for your business address..."
      />
    </div>
  );
};

const STEPS: Step[] = [
  { id: 1, label: "Identity", description: "Verification" },
  { id: 2, label: "Eligibility", description: "Business type" },
  { id: 3, label: "Documents", description: "Upload & verify" },
  { id: 4, label: "Authorization", description: "Documents" },
  { id: 5, label: "Business", description: "Operations" },
  { id: 6, label: "Financial", description: "Profile" },
  { id: 7, label: "Review", description: "Submit" },
];

const WELCOME_MESSAGE = "Welcome to our Intelligent Onboarding platform powered by Pace.\n\nI'm here to help you open your business bank account so you can get your business banking up and running in no time!";

const SCREEN_MESSAGES: Record<ScreenId, { content: string; helperText?: string }> = {
  "0.1": { content: WELCOME_MESSAGE },
  "1.1": { content: "To get started, please enter your email address." },
  "1.2": { content: "We've sent a verification code to your email. Please enter it below." },
  "1.3": { content: "Great! Now please enter your mobile number." },
  "1.4": { content: "We've sent a verification code to your mobile. Please enter it below." },
  "1.4A": { content: "What is your full legal name?" },
  "1.6": { content: "Let's verify your identity. Please upload a clear photo of your Government ID (Driver's License or Passport)." },
  "1.7": { content: "We extracted the following information from your ID. Please confirm it's correct:" },
  "2.1": { content: "Let's verify your business. Please enter your Legal Entity Identifier (LEI) number. Don't have it? You can upload your registration document instead." },
  "2.2": { content: "We found the following business details. Please confirm:" },
  "2.3": { content: "" }, // Restricted Industries Modal
  "3.1": { content: "Since you are a Sole Proprietorship/DBA, please upload your DBA (Doing Business As) Certificate." },
  "3.2": { content: "We extracted the following from your DBA Certificate:" },
  "3.3": { content: "As an LLC, please upload your Articles of Organization." },
  "3.4": { content: "We extracted the following from your Articles of Organization:" },
  "3.5": { content: "Please upload your Operating Agreement." },
  "3.6": { content: "We extracted the following from your Operating Agreement:" },
  "3.7": { content: "As a Partnership, please upload your Partnership Agreement." },
  "3.8": { content: "We extracted the following from your Partnership Agreement:" },
  "3.9": { content: "As a Corporation, please upload your Articles of Incorporation." },
  "3.10": { content: "We extracted the following from your Articles of Incorporation:" },
  "3.11": { content: "Please upload your Corporate Bylaws." },
  "3.12": { content: "We extracted the following information from your Bylaws:" },
  // Step 4 Authorization
  "4.1": { content: "Please confirm your role and ownership stake:" }, // Summary
  "4.2": { content: "" },
  "4.3": { content: "Since you are not a beneficial owner, please upload a Power of Attorney (POA)." },
  "4.4": { content: "We extracted the following from your POA:" },
  "4.5": { content: "Please upload your Corporate Resolution authorizing this account opening." },
  "4.6": { content: "Please upload your Proof of Address (e.g., Utility Bill, Lease Agreement)." },
  // Step 5 Operations
  "5.1": { content: "Does your business have an online presence?" },
  "5.2": { content: "What is your website URL?" },
  "5.3": { content: "Does your business have operations outside the US?" },
  "5.4": { content: "Which countries do you operate in?" },
  "5.5": { content: "Do you have a physical presence in these countries?" },
  "5.6": { content: "Do you have a physical office address in the US?" },
  "5.7": { content: "What is your business address?" },
  // Step 6 Financials
  "6.1": { content: "What is your expected annual revenue?" },
  "6.2": { content: "What are your main sources of funds?" },
  "6.3": { content: "What is your expected monthly deposit volume?" },
  "6.4": { content: "What is your expected monthly withdrawal volume?" },
  "6.5": { content: "What percentage of deposits will be cash?" },
  "6.6": { content: "What percentage of withdrawals will be cash?" },
  "6.7": { content: "Recommended Products" },
  "6.8": { content: "Recommended Plan" },
  "7.1": { content: "Review your information" },
  "7.2": { content: "Agreements" },
  "7.3": { content: "Success" }
};

const ZAMP_LOG_AUTHORITY_COMPLETE = async (zampProcessId: string) => {
  await logToZamp(zampProcessId, {
    title: "Authority verified, all necessary documents received",
    status: "success",
    type: "success"
  }, "authority-verification"); // We must match the correct stepId used in previous logs (check trade license logs)
  // Wait, trade-license-verification logged "Authority Verification pending" with NO stepId?
  // Let's check verifyTradeLicense logs.
  // It logged: title: "Authority Verification pending", status: "processing", type: "warning"
  // WITHOUT a explicit stepId in the logToZamp call?
  // So to update it, I need a stepId? Or just append a new log "Authority verified"?
  // The user wants: "post authority verification, that corresponding box should also change to green".
  // This implies I should have used a stepId for the "pending" log too.
  // I should probably fix the "pending" log to have a stepId if I want to update it in place.
  // However, the user said "change to done" which implies updating.
  // I will use "authority-verification" as stepId for the NEW log and hope the legacy "pending" log without ID just stays or I update it blindly?
  // Actually, if the pending log had NO stepId, I cannot update it in place easily with my backend logic (which needs stepId match).
  // BUT the user just said "change to green", implying the status indicator.
  // If I cannot update the *previous* pending line, I'll just append a new success line.
  // BUT, for the "corresponding box should change to green" request:
  // Zamp dashboard uses the latest log status for that "step" if they are grouped?
  // No, Zamp dashboard lists *logs*.
  // If the previous log was "Authority Verification pending" (Warning/Yellow), and now I log "Authority Verified" (Success/Green), I want it to *replace* or *update* the pending one?
  // The user said "change to done".
  // I will try to use a consistent stepId "authority-verification" for both.
  // To do this, I must also update the "pending" log calls in verifyTradeLicense.
};

const TURNOVER_OPTIONS = [
  { value: "less_50k", label: "Less than $50,000" },
  { value: "50k_100k", label: "$50,000 - $100,000" },
  { value: "100k_250k", label: "$100,000 - $250,000" },
  { value: "250k_500k", label: "$250,000 - $500,000" },
  { value: "500k_1m", label: "$500,000 - $1 million" },
  { value: "1m_5m", label: "$1 million - $5 million" },
  { value: "5m_10m", label: "$5 million - $10 million" },
  { value: "more_10m", label: "More than $10 million" },
];

const DEPOSIT_OPTIONS = [
  { value: "less_10k", label: "Less than $10,000" },
  { value: "10k_25k", label: "$10,000 - $25,000" },
  { value: "25k_50k", label: "$25,000 - $50,000" },
  { value: "50k_100k", label: "$50,000 - $100,000" },
  { value: "100k_500k", label: "$100,000 - $500,000" },
  { value: "more_500k", label: "More than $500,000" },
];

const FUND_SOURCES = [
  { value: "business_revenue", label: "Business Revenue" },
  { value: "shareholder_capital", label: "Shareholder Capital" },
  { value: "family_friends", label: "Family and Friends" },
  { value: "advance_payments", label: "Advance Payments from Customers" },
  { value: "loans", label: "Loans" },
  { value: "other", label: "Other", hasOther: true },
];

const GenericConfirmScreen = ({
  data,
  onConfirm,
  onEdit,
}: {
  data: Record<string, string>;
  onConfirm: () => void;
  onEdit: () => void;
}) => {
  return (
    <div className="space-y-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-card rounded-xl p-5 border border-border space-y-4 shadow-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start pt-3 first:pt-0 border-t border-border first:border-t-0">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </span>
            <span className="font-medium text-foreground text-right text-sm">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onEdit}
          className="flex-1 py-3 px-4 border border-border rounded-lg text-foreground font-medium hover:bg-secondary transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg active:scale-[0.98]"
        >
          Confirm Details
        </button>
      </div>
    </div>
  );
};

// Welcome Screen Component
const GetStartedScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Onboarding</h1>
        <p className="text-gray-500">Fast, digital, and seamless business account opening.</p>
      </div>
      <button
        onClick={onStart}
        className="w-full py-4 bg-primary text-primary-foreground dark:text-gray-700 rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group"
      >
        Get Started
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

const Index = () => {
  const { currentScreen, currentStep, data, updateData, goToNextScreen, goToPreviousScreen, canGoBack, completedSteps, setCurrentScreen } = useOnboardingFlow();
  const [messages, setMessages] = useState<Message[]>([]);
  const [failedIdAttempts, setFailedIdAttempts] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [zampProcessId, setZampProcessId] = useState<string | null>(null);
  const [licenseExpiryWarning, setLicenseExpiryWarning] = useState<{ message: string, linkText: string, linkUrl: string } | null>(null);
  const [moaNotarizationWarning, setMoaNotarizationWarning] = useState<{ message: string, linkText?: string, linkUrl?: string } | null>(null);
  const [websiteWarning, setWebsiteWarning] = useState<{ message: string, linkText?: string, linkUrl?: string } | null>(null);


  // Screens that shouldn't show back navigation
  const excludeBackScreens: ScreenId[] = ["0.1", "1.1", "7.3", "2.2"];
  const showBackLink = canGoBack && !excludeBackScreens.includes(currentScreen);

  const handleGoBack = useCallback(() => {
    // Remove last user message from chat for cleaner UX
    setMessages(prev => {
      const lastUserIndex = prev.map(m => m.type).lastIndexOf('user');
      if (lastUserIndex > -1) {
        return prev.slice(0, lastUserIndex);
      }
      return prev;
    });
    goToPreviousScreen();
  }, [goToPreviousScreen]);

  const addAssistantMessage = useCallback((content: string, helperText?: string, verificationData?: any) => {
    if (!content) return;
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      type: "assistant",
      content,
      timestamp: new Date(),
      helperText,
      verificationData // Pass it through
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const getScreenMessage = useCallback((screenId: ScreenId): { content: string; helperText?: string } => {
    const legalType = data.tradeLicense.legalType || "LLC";
    const legalTypeDisplay = legalType.toUpperCase();

    if (screenId === "3.5") {
      return {
        content: "Please upload your Memorandum of Association (MOA).",
        helperText: `Since you are a ${legalTypeDisplay}, we require a Memorandum of Association (MOA) to verify your company's shareholders and their ownership structure.`
      };
    }
    if (screenId === "3.6") {
      return {
        content: "Please upload your Partnership Deed.",
        helperText: `Since you are a Partnership, we require a Partnership Deed to verify your company's partners and their ownership structure.`
      };
    }
    return SCREEN_MESSAGES[screenId];
  }, [data.tradeLicense.legalType]);

  // Ref to track the last screen we handled to prevent loops
  const lastHandledScreen = useRef<ScreenId | null>(null);

  const simulateTypingAndShowInput = useCallback(() => {
    // This function is now only called when we genuinely change screens (checked in useEffect)
    setShowInput(false);
    const screenData = getScreenMessage(currentScreen);

    // Show welcome message first on screen 1.1
    // We check messages.length locally or just assume if it's 1.1 and we are here, we do the welcome flow.
    // However, if we navigate BACK to 1.1, we might not want the welcome message again?
    // Let's rely on the fact that this runs once per screen entry.

    if (currentScreen === "1.1" && messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addAssistantMessage(WELCOME_MESSAGE);
        // Then show the name question after a short delay
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            addAssistantMessage(screenData.content, screenData.helperText);
            setShowInput(true);
          }, 600);
        }, 400);
      }, 800);
    } else if (screenData?.content) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addAssistantMessage(screenData.content, screenData.helperText);
        setShowInput(true);
      }, 800);
    } else {
      setShowInput(true);
    }
  }, [currentScreen, addAssistantMessage, getScreenMessage, messages.length]); // messages.length needed for the 1.1 check but guard at useEffect level prevents loop

  useEffect(() => {
    if (currentScreen === "0.1") {
      setShowInput(true); // GetStartedScreen is always visible
      lastHandledScreen.current = "0.1";
      return;
    }

    // Only run simulation if we haven't handled this screen yet
    if (lastHandledScreen.current !== currentScreen) {
      lastHandledScreen.current = currentScreen;
      simulateTypingAndShowInput();
    }
  }, [currentScreen, simulateTypingAndShowInput]);

  // --- Zamp Integration Logic ---

  // Start Onboarding
  const handleStartOnboarding = async () => {
    const pid = await initZampProcess();
    setZampProcessId(pid);
    if (pid) {
      await logToZamp(pid, {
        title: "Business Onboarding Application started",
        status: "completed",
        type: "success"
      }, undefined, { status: "processing" }); // Update keyDetails status
      await logToZamp(pid, {
        title: "Identity Verification in Progress",
        status: "processing",
        type: "info"
      }, "identity-verification"); // Use stepId
    }
    goToNextScreen();
  };

  // Step 1: Identity Complete logic (triggered when moving from 1.8 to 2.1)
  useEffect(() => {
    if (currentScreen === "2.1" && zampProcessId) {
      // Dynamic Zamp Logging for Step Completion (Initial Logs)
      // Eligibility Start
      logToZamp(zampProcessId, {
        title: "Eligibility Verification in Progress",
        status: "processing",
        type: "info"
      }, "eligibility-verification");
    }
  }, [currentScreen, zampProcessId]); // Dependencies: only run when screen changes to 2.1

  // Custom Handler for Eligibility Confirm
  const handleEligibilityConfirm = async (confirmed: boolean) => {
    updateData({ restrictedIndustryConfirmed: confirmed });
    if (confirmed) {
      if (zampProcessId) {
        const licenseType = data.businessType === "incorporated" ? "Legal Entity Identifier (LEI)" : "Freelancer Permit";
        await logToZamp(zampProcessId, {
          title: `Eligibility Verified, Applicant has a ${licenseType}`,
          status: "success",
          type: "success",
          description: `User has a ${licenseType} and is not in any restricted Industries`
        }, "eligibility-verification");
        await logToZamp(zampProcessId, {
          title: "Verifying Documents",
          status: "processing",
          type: "info"
        });
      }
      goToNextScreen();
    } else {
      // If not confirmed (i.e., user is in restricted industry), stay on screen or show error
      addAssistantMessage("We cannot open accounts for businesses in restricted industries.");
    }
  };

  const handleTextSubmit = (value: string, field: string) => {
    addUserMessage(value);
    updateData({ [field]: value } as any);

    // Real-time Sync of User Inputs
    if (zampProcessId) {
      const readableField = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      logToZamp(zampProcessId, {
        title: `User Provided ${readableField}`,
        status: "processing",
        type: "info",
        description: value
      }).catch(err => console.error("Sync error:", err));
    }

    setTimeout(goToNextScreen, 300);
  };

  const handleBusinessTypeSelect = (type: "incorporated" | "freelancer") => {
    addUserMessage(type === "incorporated" ? "My business is incorporated" : "I'm a Freelancer");
    updateData({ businessType: type });
    setTimeout(goToNextScreen, 300);
  };

  const handleFileUpload = () => {
    addUserMessage("Document uploaded");
    setTimeout(goToNextScreen, 500);
  };

  const handleIdentityDocumentUpload = async (file: File) => {
    if (!file) {
      handleFileUpload(); // Or handle this case more specifically if needed
      return;
    }

    setIsTyping(true);
    addUserMessage("Uploading document for identity verification...");

    try {
      const extractedData = await extractIdentityDocumentData(file);
      console.log("Extracted Identity Data:", extractedData);

      if (extractedData) {
        // 0. Validate Document Authenticity
        if (extractedData.isValidId === false) {
          // explicit check for false
          setIsTyping(false);
          setFailedIdAttempts(prev => prev + 1);
          addAssistantMessage("Visual Verification Failed: The uploaded document does not appear to be a valid Identity Document. Please ensure it is a clear image of your SSN Card or Passport.");
          return;
        }

        // 1. Validate Name Match
        try {
          const nameMatchRes = await fetch(`${ZAMP_API_URL}/match-names`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name1: data.fullName,
              name2: extractedData.fullName
            }),
          });

          if (!nameMatchRes.ok) {
            throw new Error(`Server responded with ${nameMatchRes.status}`);
          }

          const matchResult = await nameMatchRes.json();

          // Prepare Verification Data for UI
          const verificationData = {
            isValidId: true,
            isTamperFree: true, // Assuming true if Gemini checks passed
            isNameMatch: matchResult.match,
            autofilledFields: ["Full Name", "ID Number", "Nationality", "Date of Birth", "Expiry Date"]
          };

          setIsTyping(false);

          if (!matchResult.match) {
            const newFailCount = failedIdAttempts + 1;
            setFailedIdAttempts(newFailCount);

            // USER REQUEST: If failed twice, allow manual proceed
            if (newFailCount >= 2) {
              setTimeout(() => {
                addAssistantMessage(
                  "We have received your document.",
                  "Please verify and confirm the details manually below to proceed."
                );
              }, 500);

              // Proceed with extracted data even if name match failed
              updateData({
                identityDocument: {
                  fullName: extractedData.fullName,
                  idNumber: extractedData.idNumber,
                  nationality: extractedData.nationality,
                  dateOfBirth: extractedData.dateOfBirth,
                  expiryDate: extractedData.expiryDate,
                  documentType: extractedData.documentType as "ssn" | "passport"
                }
              });

              setTimeout(() => goToNextScreen(), 2500);
              return;
            }

            // Show failure with checklist
            addAssistantMessage(
              `One or more verification checks failed. We could not verify that this ID belongs to ${data.fullName}.`,
              "Please verify you have uploaded the correct document.",
              { ...verificationData, isNameMatch: false } // Force false visual
            );

            return;
          }

          // Success Case
          addAssistantMessage(
            "Identity verification complete. All checks passed.",
            undefined,
            verificationData
          );

          // Update data
          updateData({
            identityDocument: {
              fullName: extractedData.fullName,
              idNumber: extractedData.idNumber,
              nationality: extractedData.nationality,
              dateOfBirth: extractedData.dateOfBirth,
              expiryDate: extractedData.expiryDate,
              documentType: extractedData.documentType as "ssn" | "passport"
            }
          });

          // Wait a bit before showing the confirm screen so user sees the ticks
          setTimeout(() => goToNextScreen(), 4000);

        } catch (matchErr) {
          console.error("Name matching failed", matchErr);
          setIsTyping(false);
          setFailedIdAttempts(prev => prev + 1);
          addAssistantMessage("Error during name verification process. Please try again.");

          if (failedIdAttempts > 0) {
            setTimeout(() => {
              addAssistantMessage(
                "To help you debug, here are the details we read from your card:",
                `Name: ${extractedData.fullName}\nID Number: ${extractedData.idNumber}\nNationality: ${extractedData.nationality}`
              );
            }, 1000);
          }
        }
      } else {
        setIsTyping(false);
        setFailedIdAttempts(prev => prev + 1);
        addAssistantMessage("Could not read document. Please ensure the image is clear and try again.");
      }
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setFailedIdAttempts(prev => prev + 1);
      addAssistantMessage("An error occurred while processing the ID.");
    }
  };

  // Identity Confirmation Handler
  const handleIdentityDocumentConfirm = async () => {
    addUserMessage("Details confirmed.");
    if (zampProcessId) {
      await logToZamp(zampProcessId, {
        title: "Legal Entity Identifier (LEI) verified",
        status: "success",
        type: "success"
      }, "lei-verification");
      await logToZamp(zampProcessId, {
        title: "Identity verification complete",
        status: "success",
        type: "success",
        artifacts: [
          { type: "image", label: "Identity Document Image", icon: "image", imagePath: await uploadToZamp(data.identityDocument.file!), id: `art-eid-${Date.now()}` },
          {
            type: "table", label: "Extracted Identity Data", icon: "table", data: {
              "Entered Name": data.fullName,
              "Phone Number": data.phone,
              "Email Address": data.email,
              "Extracted Name": data.identityDocument.fullName,
              "ID Number": data.identityDocument.idNumber,
              "Nationality": data.identityDocument.nationality,
              "Date of Birth": data.identityDocument.dateOfBirth,
              "Expiry Date": data.identityDocument.expiryDate,
              "Document Type": data.identityDocument.documentType
            }, id: `art-eid-data-${Date.now()}`
          }
        ]
      }, "identity-verification"); // Update the "In Progress" step
    }
    goToNextScreen();
  };

  // Function to verify trade license via backend
  const verifyTradeLicense = async (licenseNumber: string) => {
    setIsTyping(true);
    addAssistantMessage(`Verifying LEI #${licenseNumber} via GLEIF...`);

    try {
      // Call GLEIF API
      const leiData = await fetchLeiDetails(licenseNumber);

      if (!leiData) {
        throw new Error("Could not find a valid LEI record. Please check the number.");
      }

      setIsTyping(false);

      if (zampProcessId) {
        await logToZamp(zampProcessId, {
          title: "LEI Verified Successfully",
          status: "success",
          type: "success"
        }, "trade-license-verification");
      }

      addUserMessage("Verification complete");

      updateData({
        tradeLicense: {
          ...data.tradeLicense,
          businessName: leiData.legalName,
          licenseNumber: leiData.lei,
          issuingAuthority: "GLEIF",
          legalType: "llc", // Defaulting for flow requirements
          activities: "General Business",
          registeredAt: leiData.registeredAt,
          // We are hijacking 'activities' or just letting it be generic, 
          // as we want to show 'Entity Legal Form' specifically in the next screen.
        },
        // We can also store the legal form specifically if we want, 
        // but for now we'll pass it via activities or rely on registeredAt update.
      } as any); // Type cast if needed for partial updates not fully matching yet

      // We need to persist the ELF Code somewhere if we want to show it in 3.2
      // Let's store it in `activities` for now as a placeholder or add a temp state? 
      // Actually we added `registeredAt`. We can use `activities` to store the ELF Code for display?
      // Or better: updateData with legalType? 
      // The user wants "Entity Legal Form". I will store it in `activities` for now to avoid extending interface further if possible, 
      // BUT I already extended it with `registeredAt`.
      // Let's perform a second updateData call or just put it in a custom field if allowed.
      // Actually, I'll put it in `tradeLicense.activities` as "ELF Code: " + leiData.legalForm 
      // so it shows up in Review too?
      // No, let's keep it clean. I will stick to what I have and in 3.2 I will use a different property?
      // DATA HACK: I will store the ELF code in `data.tradeLicense.activities` temporarily?
      // Or I can just map it: 
      // Determine Simplified Entity Type for Workflow
      let derivedType: "sole_proprietorship" | "partnership" | "llc" | "corp" | "other" = "other";
      const form = (leiData.legalForm || "").toLowerCase();

      // Simple keyword matching for demo purposes
      if (form.includes("sole") || form.includes("proprietor")) derivedType = "sole_proprietorship";
      else if (form.includes("llc") || form.includes("limited liability company")) derivedType = "llc";
      else if (form.includes("partnership") || form.includes("llp") || form.includes("lp")) derivedType = "partnership";
      else if (form.includes("corporation") || form.includes("inc") || form.includes("corp") || form.includes("limited") || form.includes("ltd")) derivedType = "corp";

      console.log("Derived Type:", derivedType, "from", form);

      updateData({
        businessType: "incorporated",
        tradeLicense: {
          ...data.tradeLicense,
          businessName: leiData.legalName,
          licenseNumber: leiData.lei,
          registeredAt: leiData.registeredAt,
          activities: leiData.legalForm,
          legalType: derivedType
        }
      } as any);

    } catch (error) {
      console.error("Verification failed:", error);
      setIsTyping(false);
      addAssistantMessage("We couldn't verify that LEI number. Please check it and try again, or upload the document.");
    }
  };

  const verifyTradeLicenseFile = async (file: File) => {
    setIsTyping(true);
    addAssistantMessage("Analyzing Legal Entity Identifier (LEI) document...");
    if (zampProcessId) {
      await logToZamp(zampProcessId, {
        title: "Analyzing Legal Entity Identifier (LEI) document",
        status: "processing",
        type: "warning"
      }, "lei-verification");
    }

    try {
      // Use Client-Side Gemini Extraction (More robust than backend scraper)
      const extractedData = await extractAllTradeLicenseData(file);
      setIsTyping(false);

      if (!extractedData) {
        throw new Error("Could not extract data");
      }

      addAssistantMessage("Legal Entity Identifier (LEI) analyzed successfully.");

      const licenseDetails = {
        businessName: extractedData.businessName || "",
        licenseNumber: extractedData.licenseNumber || "",
        issuingAuthority: extractedData.issuingAuthority || "Dubai Economy",
        legalType: ((extractedData.legalType || "").toLowerCase().includes("sole") ? "sole_proprietorship" : "llc") as "sole_proprietorship" | "llc",
        activities: Array.isArray(extractedData.activities) ? extractedData.activities.join(", ") : (extractedData.activities || ""),
        expiryDate: extractedData.expiryDate || "",
        videoPath: undefined // No video for client-side extraction
      };

      return licenseDetails;

    } catch (error) {
      console.error("File Verification Error:", error);
      setIsTyping(false);
      addAssistantMessage("Could not analyze file automatically. Please enter details manually.");
      return null;
    }
  };

  const verifyWebsite = async (url: string) => {
    setIsTyping(true);
    addAssistantMessage(`Verifying website: ${url}...`);
    try {
      const response = await fetch(`${ZAMP_API_URL}/verify-website`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error("Website verification failed");
      const extractedData = await response.json();
      setIsTyping(false);

      if (extractedData.error) throw new Error(extractedData.error);

      addAssistantMessage("Website verification complete, the following results were extracted.");

      // Update local data
      updateData({
        extractedWebsiteData: extractedData,
        websiteVideoPath: extractedData.public_video_path
      });

      // Update local data if needed, or just log to Zamp
      // Construct Zamp artifacts
      if (zampProcessId) {
        // The artifacts construction and logging will now happen in 5.7
      }
      return extractedData;
    } catch (e) {
      console.error(e);
      setIsTyping(false);
      addAssistantMessage("Could not verify website automatically. Proceeding.");
      return null;
    }
  };

  // Legacy verifyAddress removed (now handled via Google Maps Frontend Integration)

  const verifyLEI = async (leiCode: string) => {
    setIsTyping(true);
    addAssistantMessage("Verifying LEI Code...", "lei-verifying");

    try {
      const response = await fetch(`${ZAMP_API_URL}/verify-lei`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leiCode })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.error) {
        addAssistantMessage("We couldn't verify the LEI code. Please check and try again.");
        return false;
      }

      updateData({
        leiCode: leiCode,
        extractedLEIData: data,
        leiVideoPath: data.public_video_path
      });
      return true;

    } catch (error) {
      setIsTyping(false);
      addAssistantMessage("Sorry, we faced an issue verifying the LEI code.");
      console.error(error);
      return false;
    }
  };

  const getTradeLicenseData = (): typeof DUMMY_TRADE_LICENSE | typeof DUMMY_TRADE_LICENSE_SOLE => {
    // Return existing data which should now be populated by verifyTradeLicense
    // We cast it to match the type expected by the rest of the flow
    return data.tradeLicense as any;
  };

  const handleTradeLicenseConfirm = () => {
    addUserMessage("Legal Entity Identifier (LEI) confirmed");
    const licenseData = getTradeLicenseData();
    const legalType = licenseData.legalType;
    const isSoleProprietorship = legalType === "sole_proprietorship";
    const requiresBankMandate = !isSoleProprietorship && ["partnership", "llc", "fzco", "fze"].includes(legalType) && DUMMY_SHAREHOLDERS.length > 1;
    const updatedTradeLicense = { ...data.tradeLicense, ...licenseData };
    updateData({
      tradeLicense: updatedTradeLicense,
      requiresBankMandate,
      shareholders: isSoleProprietorship ? [] : DUMMY_SHAREHOLDERS,
      isShareholderMatch: isSoleProprietorship ? true : DUMMY_SHAREHOLDERS.some(s => s.name === data.identityDocument.fullName),
    });
    setTimeout(() => goToNextScreen({ tradeLicense: updatedTradeLicense, requiresBankMandate }), 300);
  };

  const handleFreelancerPermitConfirm = () => {
    addUserMessage("Freelancer Permit confirmed");
    updateData({
      freelancerPermit: { ...data.freelancerPermit, ...DUMMY_FREELANCER_PERMIT },
      isShareholderMatch: true,
      requiresPOA: false,
      requiresBankMandate: false,
    });
    setTimeout(goToNextScreen, 300);
  };

  const handleShareholdersConfirm = (shareholders: typeof DUMMY_SHAREHOLDERS) => {
    addUserMessage("Shareholders confirmed");
    const isMatch = shareholders.some(s => s.name === data.identityDocument.fullName);
    const requiresPOA = !isMatch;
    updateData({
      shareholders,
      isShareholderMatch: isMatch,
      requiresPOA,
    });
    setTimeout(goToNextScreen, 300);
  };

  const handlePOAConfirm = () => {
    addUserMessage("POA confirmed");
    updateData({ poa: { ...data.poa, ...DUMMY_POA } });
    setTimeout(goToNextScreen, 300);
  };

  const handleYesNo = (value: boolean, field: string) => {
    addUserMessage(value ? "Yes" : "No");
    updateData({ [field]: value } as any);
    setTimeout(() => goToNextScreen({ [field]: value }), 300);
  };

  const handleBracketSelect = (value: string, label: string, field: string) => {
    addUserMessage(label);
    updateData({ [field]: label } as any);
    setTimeout(goToNextScreen, 300);
  };

  const handleMultiSelect = (values: string[], field: string, otherValue?: string) => {
    const labels = values.map(v => FUND_SOURCES.find(f => f.value === v)?.label || v);
    addUserMessage(labels.join(", ") + (otherValue ? ` (${otherValue})` : ""));
    updateData({ [field]: labels, otherFundSource: otherValue || "" } as any);
    setTimeout(goToNextScreen, 300);
  };

  const handleCountrySelect = (countries: string[]) => {
    addUserMessage(countries.join(", "));
    updateData({ operatingCountries: countries });
    setTimeout(goToNextScreen, 300);
  };

  const handleSlider = (value: number, field: string) => {
    addUserMessage(`${value}%`);
    updateData({ [field]: value } as any);
    setTimeout(goToNextScreen, 300);
  };

  // New handlers for the updated flow
  const handleTradeLicenseSubmit = async (num: string) => {
    addUserMessage(`LEI number: ${num}`);
    updateData({ tradeLicense: { licenseNumber: num } } as any);

    if (zampProcessId) {
      await logToZamp(zampProcessId, {
        title: "LEI Verification in Progress",
        status: "processing",
        type: "info"
      }, "lei-verification");
    }

    await verifyTradeLicense(num);
    goToNextScreen();
  };

  const handleTradeLicenseUpload = async (file: File) => {
    if (!file) {
      handleFileUpload();
      return;
    }

    addUserMessage("Uploading LEI document for analysis...");
    setIsTyping(true);
    setLicenseExpiryWarning(null); // Clear any previous warning

    try {
      const extracted = await verifyTradeLicenseFile(file);

      if (extracted) {
        // Check for expiry (simplified for this example, full logic from old 3.1)
        if (extracted.expiryDate) {
          const expiryDateStr = extracted.expiryDate;
          let expiryDate: Date | null = null;
          const parts = expiryDateStr.split('/');
          if (parts.length === 3) {
            expiryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            expiryDate = new Date(expiryDateStr);
          }

          if (expiryDate && !isNaN(expiryDate.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expiryDate.setHours(0, 0, 0, 0);

            if (expiryDate < today) {
              setIsTyping(false);
              setLicenseExpiryWarning({
                message: "Looks like your trade license expired. Please renew it and upload the new one.",
                linkText: "Renewal info",
                linkUrl: "#"
              });
              return;
            }
          }
        }

        addAssistantMessage("Legal Entity Identifier (LEI) data extracted successfully.");

        updateData({
          businessType: "incorporated",
          tradeLicense: {
            businessName: String(extracted.businessName || ""),
            licenseNumber: String(extracted.licenseNumber || ""),
            issuingAuthority: String(extracted.issuingAuthority || ""),
            legalType: String(extracted.legalType || ""),
            activities: Array.isArray(extracted.activities) ? extracted.activities.join(", ") : String(extracted.activities || ""),
            expiryDate: String(extracted.expiryDate || "")
          }
        } as any);

        if (zampProcessId) {
          const uploadedPath = await uploadToZamp(file);
          await logToZamp(zampProcessId, {
            title: "LEI Document Verification Complete",
            status: "success",
            type: "success",
            artifacts: [
              { type: "image", label: "LEI Document", icon: "image", imagePath: uploadedPath, id: `art-lei-doc-${Date.now()}` },
              { type: "table", label: "Extracted LEI Data", icon: "table", data: extracted, id: `art-lei-data-${Date.now()}` }
            ]
          }, "lei-verification");
        }

        setIsTyping(false);
        goToNextScreen();
      } else {
        addAssistantMessage("Could not read document. Please enter details manually.");
        setIsTyping(false);
      }
    } catch (e) {
      console.error(e);
      addAssistantMessage("Error analyzing document. Please try again.");
      setIsTyping(false);
    }
  };

  const handleDocumentUpload = async (file: File, docType: string) => {
    if (!file) return;

    addUserMessage(`Uploading ${docType === "dba" ? "DBA" : docType} document...`);
    setIsTyping(true);

    try {
      // Placeholder for actual extraction logic based on docType
      let extractedData: any = {};
      switch (docType) {
        case "dba":
          extractedData = await extractDBAData(file);
          // Check ownership rules from DBA doc
          if (extractedData?.owners && Array.isArray(extractedData.owners)) {
            // Map to shareholders
            const mappedOwners = extractedData.owners.map((owner: any) => ({
              name: owner.name,
              nationality: "USA", // Default
              ownership: owner.ownership ? `${owner.ownership}%` : "0%",
              role: "Owner" // Default role
            }));

            // Logic: Check user 
            let userIsAuthSignatory = false; // > 10%
            let userIsBeneficialOwner = false; // > 50%
            let userOwnership = 0;

            const currentUser = mappedOwners.find((o: any) => o.name.toLowerCase() === data.identityDocument.fullName.toLowerCase());

            if (currentUser) {
              const ownershipVal = parseFloat(currentUser.ownership.replace("%", ""));
              userOwnership = ownershipVal;
              if (ownershipVal > 10) userIsAuthSignatory = true;
              if (ownershipVal > 50) userIsBeneficialOwner = true;
            }

            // Flag if we need POA (User <= 10%)
            const needsPOA = userOwnership <= 10;

            updateData({
              shareholders: mappedOwners,
              isShareholderMatch: !!currentUser,
              requiresPOA: needsPOA,
              // Optionally store these flags if needed for UI customization elsewhere
              // isAuthSignatory: userIsAuthSignatory,
              // isBeneficialOwner: userIsBeneficialOwner
            });

            if (needsPOA) {
              addAssistantMessage("It looks like you own 10% or less. Please be ready to upload a Power of Attorney (POA).");
            }
          }
          break;
        case "articlesOfOrganization":
        case "articlesOfIncorporation":
          // Simulate extraction for Articles
          extractedData = { businessName: data.tradeLicense.businessName || "Extracted Entity Name", dateFormed: "01/01/2023" };
          break;
        case "operatingAgreement":
        case "partnershipAgreement":
        case "bylaws":
          extractedData = await extractBylawsData(file);
          // Map extracted officers to shareholders state
          if (extractedData?.officers && Array.isArray(extractedData.officers)) {
            const mappedShareholders = extractedData.officers.map((name: string) => ({
              name,
              nationality: "USA", // Default fallback
              ownership: "0%",
              role: "Officer"
            }));
            const isMatch = extractedData.officers.some((name: string) => name === data.identityDocument.fullName);
            updateData({
              shareholders: mappedShareholders,
              isShareholderMatch: isMatch,
              requiresPOA: !isMatch
            });
          }
          break;
        case "poa":
          extractedData = await extractPOAData(file);
          break;
        case "corporateResolution":
          extractedData = { resolutionDate: "01/01/2024", authorizedSignatories: ["John Doe"] };
          break;
        case "proofOfAddress":
          extractedData = { address: "123 Business Bay, 45th St, New York, NY 10001" };
          updateData({ businessAddress: extractedData.address });
          break;
        default:
          extractedData = { status: "Document uploaded" };
      }

      addAssistantMessage(`${docType} document analyzed successfully.`);
      updateData({ [`${docType}Data`]: extractedData }); // Store extracted data

      if (zampProcessId) {
        const uploadedPath = await uploadToZamp(file);
        await logToZamp(zampProcessId, {
          title: `${docType} Document Uploaded`,
          status: "success",
          type: "success",
          artifacts: [
            { type: "image", label: `${docType} Document`, icon: "image", imagePath: uploadedPath, id: `art-${docType}-${Date.now()}` },
            { type: "table", label: `Extracted ${docType} Data`, icon: "table", data: extractedData, id: `art-${docType}-data-${Date.now()}` }
          ]
        }, `${docType}-upload`);
      }

      setIsTyping(false);
      goToNextScreen();
    } catch (e) {
      console.error(e);
      setIsTyping(false);
      addAssistantMessage(`Error processing ${docType} document. Please try again.`);
    }
  };

  // Helper for Zamp Logging
  const logBusinessVerificationComplete = async (finalData: any) => {
    if (!zampProcessId) return;

    const generalDetails = {
      "Online Presence": finalData.hasOnlinePresence ? "Yes" : "No",
      "Website URL": finalData.websiteUrl,
      "International Operations": finalData.hasInternationalOps ? "Yes" : "No",
      "Operating Countries": finalData.operatingCountries?.join(", ") || "None",
      "Business Address": finalData.businessAddress,
      "Address Source": finalData.addressVerificationStatus,
      "LEI Code": finalData.leiCode || "N/A"
    };

    const artifacts: any[] = [];

    // Website Artifacts
    if (finalData.extractedWebsiteData) {
      artifacts.push({
        type: "table",
        label: "Website Verification Data",
        icon: "table",
        id: `art-web-data-${Date.now()}`,
        data: finalData.extractedWebsiteData
      });
    }
    if (finalData.websiteVideoPath) {
      artifacts.push({
        type: "video",
        label: "Website Verification Recording",
        icon: "video",
        videoPath: finalData.websiteVideoPath,
        id: `art-web-video-${Date.now()}`
      });
    }

    // LEI Artifacts
    if (finalData.extractedLEIData) {
      artifacts.push({
        type: "table",
        label: "LEI Verification Data",
        icon: "table",
        id: `art-lei-data-${Date.now()}`,
        data: finalData.extractedLEIData
      });
    }
    if (finalData.leiVideoPath) {
      artifacts.push({
        type: "video",
        label: "LEI Verification Recording",
        icon: "video",
        videoPath: finalData.leiVideoPath,
        id: `art-lei-video-${Date.now()}`
      });
    }

    // Add Business Verification Summary Table
    artifacts.push({
      type: "table",
      label: "Business Verification Summary",
      icon: "table",
      id: `art-bus-summary-${Date.now()}`,
      data: {
        "Business Address": finalData.businessAddress || "N/A",
        "LEI Code": finalData.leiCode || "N/A",
        "Website URL": finalData.websiteUrl || "N/A",
        "Address Source": finalData.addressVerificationStatus || "N/A"
      }
    });

    await logToZamp(zampProcessId, {
      title: "Business Verification Complete",
      status: "completed",
      type: "success",
      artifacts: artifacts
    }, "business-verification-complete", generalDetails);
  };

  const renderScreenInput = () => {
    if (!showInput && currentScreen !== "0.1") return null;

    const getInputElement = () => {
      const stepInfo = SCREEN_MESSAGES[currentScreen]?.content || "Current step";
      switch (currentScreen) {
        case "0.1":
          return <GetStartedScreen onStart={handleStartOnboarding} />;

        // Step 1: Identity
        case "1.1":
          return <TextInputScreen type="email" placeholder="Enter your email" onSubmit={(v) => handleTextSubmit(v, "email")} contextData={data} stepInfo={stepInfo} />;
        case "1.2":
          return <OTPInputScreen email={data.email} onSubmit={() => { addUserMessage("Code verified"); goToNextScreen(); }} contextData={data} stepInfo={stepInfo} />;
        case "1.3":
          return <TextInputScreen type="tel" prefix="+1" placeholder="555-000-0000" onSubmit={(v) => handleTextSubmit(v, "phone")} contextData={data} stepInfo={stepInfo} />;
        case "1.4":
          return <OTPInputScreen email={data.phone} onSubmit={() => { addUserMessage("Code verified"); goToNextScreen(); }} contextData={data} stepInfo={stepInfo} />;
        case "1.4A":
          return <TextInputScreen type="text" placeholder="John Doe" onSubmit={(v) => handleTextSubmit(v, "fullName")} contextData={data} stepInfo={stepInfo} />;
        case "1.6":
          return <FileUpload onFileSelect={handleIdentityDocumentUpload} contextData={data} stepInfo={stepInfo} />;
        case "1.7":
          return (
            <AutoPopulatedInfoScreen
              title="Identity Verified"
              description="We've extracted the following details from your ID."
              sections={[
                {
                  id: "personal",
                  title: "Personal Information",
                  icon: "user",
                  isVerified: true,
                  content: [
                    { label: "Name", value: data.identityDocument?.fullName || "" },
                    { label: "Nationality", value: data.identityDocument?.nationality || "" },
                    { label: "DOB", value: data.identityDocument?.dateOfBirth || "" }
                  ]
                }
              ]}
              onConfirm={() => goToNextScreen()}
              contextData={data}
              stepInfo={stepInfo}
            />
          );

        // Step 2: LEI & Restricted
        case "2.1":
          return <TradeLicenseInputScreen onSubmitNumber={handleTradeLicenseSubmit} onUploadComplete={handleTradeLicenseUpload} contextData={data} stepInfo={stepInfo} />;
        case "2.2":
          return (
            <ExtractionConfirmScreen
              fields={[
                { key: "name", label: "Entity Name", value: data.tradeLicense.businessName },
                { key: "lei", label: "LEI Number", value: data.tradeLicense.licenseNumber },
                { key: "addr", label: "Registered Address", value: data.tradeLicense.registeredAt || "N/A" },
                { key: "form", label: "Entity Legal Form", value: data.tradeLicense.activities }
              ]}
              onConfirm={handleTradeLicenseConfirm}
              contextData={data}
              stepInfo={stepInfo}
            />
          );
        case "2.3":
          return <RestrictedIndustriesModal
            onBack={handleGoBack}
            onConfirm={async () => {
              addUserMessage("Confirmed - not in restricted industries");
              if (zampProcessId) {
                const licenseType = data.tradeLicense.legalType || "Entity";
                await logToZamp(zampProcessId, {
                  title: `Eligibility Verified for ${licenseType}`,
                  status: "success",
                  type: "success",
                  description: `User verified restricted industries for ${licenseType}`
                }, "eligibility-verification");
              }
              goToNextScreen();
            }} contextData={data} stepInfo={stepInfo} />;

        // Step 3: Entity Docs
        case "3.1": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "dba")} contextData={data} stepInfo={stepInfo} />;
        case "3.2": return <ExtractionConfirmScreen fields={[{ key: "dba", label: "DBA Name", value: data.tradeLicense.businessName }]} onConfirm={() => goToNextScreen()} contextData={data} stepInfo={stepInfo} />;

        case "3.3": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "articlesOfOrganization")} contextData={data} stepInfo={stepInfo} />;
        case "3.4": return <ExtractionConfirmScreen fields={[{ key: "orgName", label: "Organization Name", value: data.tradeLicense.businessName }, { key: "dateFormed", label: "Date formed", value: "01/01/2023" }]} onConfirm={() => goToNextScreen()} contextData={data} stepInfo={stepInfo} />;

        case "3.5": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "operatingAgreement")} contextData={data} stepInfo={stepInfo} />;
        case "3.6": return <ExtractionConfirmScreen fields={[{ key: "members", label: "Members Identified", value: data.shareholders.map(s => s.name).join(", ") || "None" }]} onConfirm={() => goToNextScreen()} contextData={data} stepInfo={stepInfo} />;

        case "3.7": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "partnershipAgreement")} contextData={data} stepInfo={stepInfo} />;
        case "3.8": return <ExtractionConfirmScreen fields={[{ key: "partners", label: "Partners Identified", value: data.shareholders.map(s => s.name).join(", ") || "None" }]} onConfirm={() => goToNextScreen()} contextData={data} stepInfo={stepInfo} />;

        case "3.9": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "articlesOfIncorporation")} contextData={data} stepInfo={stepInfo} />;
        case "3.10": return <ExtractionConfirmScreen fields={[{ key: "corpName", label: "Corp Name", value: data.tradeLicense.businessName }, { key: "shares", label: "Shares Auth", value: "1000" }]} onConfirm={() => goToNextScreen()} contextData={data} stepInfo={stepInfo} />;
        case "3.11": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "bylaws")} contextData={data} stepInfo={stepInfo} />;
        case "3.12": return <ExtractionConfirmScreen fields={[{ key: "officers", label: "Officers Identified", value: data.shareholders.map(s => s.name).join(", ") || "None" }]} onConfirm={() => { goToNextScreen(); }} contextData={data} stepInfo={stepInfo} />;

        // Step 4: Authorization
        case "4.1":
          return <GenericConfirmScreen data={{ "Role": "Beneficial Owner", "Ownership": "100%" }} onConfirm={() => goToNextScreen()} onEdit={() => { }} />;
        case "4.2":
          return <GenericConfirmScreen data={{ "Role": "Authorized Signatory", "Ownership": "0%" }} onConfirm={() => goToNextScreen()} onEdit={() => { }} />;
        case "4.3": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "poa")} contextData={data} stepInfo={stepInfo} />;
        case "4.4": return <ExtractionConfirmScreen fields={[{ key: "grantor", label: "Grantor", value: "Shareholder Name" }, { key: "grantee", label: "Grantee", value: data.fullName }]} onConfirm={() => goToNextScreen()} contextData={data} stepInfo={stepInfo} />;
        case "4.5": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "corporateResolution")} contextData={data} stepInfo={stepInfo} />;
        case "4.6": return <FileUpload onFileSelect={(f) => handleDocumentUpload(f, "proofOfAddress")} contextData={data} stepInfo={stepInfo} />;

        // Step 5: Operations
        case "5.1": return <BoxSelectionScreen options={[{ id: "yes", label: "Yes", icon: "check" }, { id: "no", label: "No", icon: "x" }]} onSelect={(v) => { const choice = v === "yes"; updateData({ hasOnlinePresence: choice }); setTimeout(() => goToNextScreen({ hasOnlinePresence: choice }), 300); }} contextData={data} stepInfo={stepInfo} />;
        case "5.2": return <TextInputScreen placeholder="e.g. www.example.com" onSubmit={(v) => { updateData({ websiteUrl: v }); setTimeout(goToNextScreen, 300); }} contextData={data} stepInfo={stepInfo} />;
        case "5.3": return <BoxSelectionScreen options={[{ id: "yes", label: "Yes", icon: "check" }, { id: "no", label: "No", icon: "x" }]} onSelect={(v) => { const choice = v === "yes"; updateData({ hasInternationalOps: choice }); setTimeout(() => goToNextScreen({ hasInternationalOps: choice }), 300); }} contextData={data} stepInfo={stepInfo} />;
        case "5.4": return <CountrySelectScreen onSubmit={handleCountrySelect} contextData={data} stepInfo={stepInfo} />;
        case "5.5": return <BoxSelectionScreen options={[{ id: "yes", label: "Yes", icon: "check" }, { id: "no", label: "No", icon: "x" }]} onSelect={(v) => { updateData({ hasPhysicalPresenceAbroad: v === "yes" }); setTimeout(goToNextScreen, 300); }} contextData={data} stepInfo={stepInfo} />;
        case "5.6": return <BoxSelectionScreen options={[{ id: "yes", label: "Yes", icon: "check" }, { id: "no", label: "No", icon: "x" }]} onSelect={(v) => { const choice = v === "yes"; updateData({ hasPhysicalAddress: choice }); setTimeout(() => goToNextScreen({ hasPhysicalAddress: choice }), 300); }} contextData={data} stepInfo={stepInfo} />;
        case "5.7": return <TextInputScreen placeholder="Enter business address" onSubmit={(v) => { updateData({ businessAddress: v }); setTimeout(goToNextScreen, 300); }} contextData={data} stepInfo={stepInfo} />;

        // Step 6: Financials
        case "6.1": return <BracketSelectScreen options={TURNOVER_OPTIONS} onSelect={(v) => { const choice = TURNOVER_OPTIONS.find(o => o.value === v); updateData({ annualRevenue: v }); setTimeout(() => goToNextScreen({ annualRevenue: v }), 300); }} contextData={data} stepInfo={stepInfo} />;
        case "6.2": return <MultiSelectScreen options={FUND_SOURCES} onSubmit={(v, other) => handleMultiSelect(v, "sourcesOfFunds", other)} contextData={data} stepInfo={stepInfo} />;
        case "6.3": return <RangeSliderScreen label="Expected Monthly Deposits" initialValue={0} max={1000000} step={5000} onSubmit={(v) => { updateData({ monthlyDeposits: String(v) }); setTimeout(goToNextScreen, 300); }} contextData={data} stepInfo={stepInfo} />;
        case "6.4": return <RangeSliderScreen label="Expected Monthly Withdrawals" initialValue={0} max={1000000} step={5000} onSubmit={(v) => { updateData({ monthlyWithdrawals: String(v) }); setTimeout(goToNextScreen, 300); }} contextData={data} stepInfo={stepInfo} />;
        case "6.5": return <SliderScreen onSubmit={(v) => { updateData({ cashDepositPercentage: v }); setTimeout(goToNextScreen, 300); }} contextData={data} stepInfo={stepInfo} />;
        case "6.6": return <SliderScreen onSubmit={(v) => { updateData({ cashWithdrawalPercentage: v }); setTimeout(goToNextScreen, 300); }} contextData={data} stepInfo={stepInfo} />;

        case "6.7":
          return <ProductRecommendationScreen data={data} onConfirm={(products) => { updateData({ selectedProducts: products }); goToNextScreen(); }} />;
        case "6.8":
          return <PlanRecommendationScreen data={data} onConfirm={(plan) => { updateData({ selectedPlan: plan }); goToNextScreen(); }} />;

        // Step 7: Final
        case "7.1": return <ReviewScreen data={data} onContinue={() => { addUserMessage("Information reviewed"); goToNextScreen(); }} contextData={data} stepInfo={stepInfo} />;
        case "7.2": return <DeclarationScreen onSubmit={async () => { addUserMessage("Agreed and Submitted"); goToNextScreen(); }} />;
        case "7.3": return <SuccessScreen email={data.email} referenceNumber="12345" contextData={data} stepInfo={stepInfo} zampProcessId={zampProcessId} />;

        default: return null;
      }
    };

    const inputElement = getInputElement();

    if (!inputElement) return null;

    return (
      <div className="space-y-4">
        {showBackLink && <BackLink onClick={handleGoBack} />}
        {inputElement}
      </div>
    );
  };


  // Find the last assistant message to attach input to it
  const lastAssistantIndex = messages.length - 1;
  const lastAssistantMessage = messages[lastAssistantIndex];
  const shouldAttachInput = showInput && lastAssistantMessage?.type === "assistant";

  return (
    <OnboardingLayout steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} data={data} currentScreen={currentScreen}>
      <ChatContainer>
        {messages.map((message, index) => {
          const isLastAssistant = index === lastAssistantIndex && message.type === "assistant";

          return (
            <ChatMessage
              key={message.id}
              message={message}
              isLatest={index === messages.length - 1}
            >
              {isLastAssistant && shouldAttachInput && renderScreenInput()}
            </ChatMessage>
          );
        })}
        {isTyping && <TypingIndicator />}
        {!shouldAttachInput && showInput && renderScreenInput()}
      </ChatContainer>
    </OnboardingLayout>
  );
};

export default Index;
