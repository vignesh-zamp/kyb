import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { HelpChat } from "./HelpChat";

interface TextInputScreenProps {
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  prefix?: string;
  onSubmit: (value: string) => void;
  // Dynamic Help Context
  contextData?: any;
  stepInfo?: string;
  initialValue?: string;
  warning?: {
    message: string;
    linkUrl?: string;
    linkText?: string;
  } | null;
}

export function TextInputScreen({ placeholder, type = "text", prefix, onSubmit, contextData, stepInfo, initialValue, warning }: TextInputScreenProps) {
  const [value, setValue] = useState(initialValue || "");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Validation Logic
  const checkValidity = (val: string) => {
    if (!val.trim()) return false;
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(val.trim());
    }
    if (type === "tel") {
      // US Mobile Validation: 10 digits
      const mobileRegex = /^\d{10}$/;
      return mobileRegex.test(val.trim());
    }
    return true; // Simple text is valid if not empty
  };

  const isValid = checkValidity(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(prefix ? `${prefix}${value}` : value);
    }
  };

  // ... (HelpChat logic remains same)

  if (isHelpOpen) {
    return (
      <HelpChat
        contextData={contextData}
        stepInfo={stepInfo || "Input Step"}
        isOpen={true}
        onToggle={setIsHelpOpen}
      />
    );
  }

  return (
    <div className="animate-slide-up">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          {prefix && (
            <div className="flex items-center px-4 bg-muted rounded-lg text-muted-foreground text-base">
              {prefix}
            </div>
          )}
          <Input
            type={type}
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              // Enforce numeric only for tel and max length 10
              setValue(type === "tel" ? val.replace(/\D/g, "").slice(0, 10) : val);
            }}
            placeholder={placeholder}
            className="flex-1 h-12 text-base px-4"
          />
          <Button type="submit" size="lg" disabled={!isValid} className="px-6 transition-opacity duration-200">
            Submit
          </Button>
        </div>
      </form>

      {warning && (
        <div className="mt-4 animate-slide-up p-4 bg-card border border-destructive rounded-lg shadow-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-destructive"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
            </div>
            <div className="space-y-3 flex-1">
              <p className="text-sm text-foreground leading-relaxed">
                {warning.message}
              </p>
              {warning.linkUrl && warning.linkText && (
                <button
                  className="w-full h-10 px-4 py-2 bg-card text-foreground border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  onClick={() => window.open(warning.linkUrl, '_blank')}
                >
                  {warning.linkText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Chat handles its own button rendering when closed */}
      <HelpChat
        contextData={contextData}
        stepInfo={stepInfo || "Input Step"}
        isOpen={false}
        onToggle={setIsHelpOpen}
      />
    </div>
  );
}
