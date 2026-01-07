import { useState } from "react";
import { Building2, Briefcase } from "lucide-react";
import { OptionCard } from "../OptionCard";
import { HelpChat } from "./HelpChat";

interface BusinessTypeSelectionScreenProps {
    onSelect: (type: "incorporated" | "freelancer") => void;
    contextData?: any;
    stepInfo?: string;
}

export function BusinessTypeSelectionScreen({ onSelect, contextData, stepInfo }: BusinessTypeSelectionScreenProps) {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    if (isHelpOpen) {
        return (
            <HelpChat
                contextData={contextData}
                stepInfo={stepInfo || "Business Type Selection"}
                isOpen={true}
                onToggle={setIsHelpOpen}
            />
        );
    }

    return (
        <div className="space-y-3 animate-slide-up">
            <OptionCard
                icon={Building2}
                label="My business is incorporated"
                description="Registered US Corporation or LLC"
                onClick={() => onSelect("incorporated")}
            />
            <OptionCard
                icon={Briefcase}
                label="I'm a Freelancer"
                description="Independent freelancer or sole proprietor"
                onClick={() => onSelect("freelancer")}
            />
            <HelpChat
                contextData={contextData}
                stepInfo={stepInfo || "Business Type Selection"}
                isOpen={false}
                onToggle={setIsHelpOpen}
            />
        </div>
    );
}
