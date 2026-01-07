import React from "react";
import { OptionCard } from "@/components/chat/OptionCard"; // Assuming generic OptionCard is available or using local one
import { Message } from "@/components/chat/ChatMessage";

interface Option {
    id: string;
    label: string;
    icon?: string;
    description?: string;
}

interface BoxSelectionScreenProps {
    options: Option[];
    onSelect: (value: string) => void;
    contextData?: any;
    stepInfo?: string;
}

export const BoxSelectionScreen: React.FC<BoxSelectionScreenProps> = ({
    options,
    onSelect,
    contextData,
    stepInfo,
}) => {
    return (
        <div className="w-full max-w-md animate-slide-up space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => onSelect(option.id)}
                        className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm hover:shadow-md group"
                    >
                        {/* If you have an Icon component mapper, use it here. For now, we'll rely on text or simple Lucide icons if passed as components, but usage implies string icons "check", "x" */}
                        <span className="font-medium text-gray-900 group-hover:text-blue-700">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
