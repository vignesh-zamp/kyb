import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Send, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpChat } from "./HelpChat";

interface TradeLicenseInputScreenProps {
  onSubmitNumber: (leiNumber: string) => void;
  onUploadComplete: (file?: File) => void;
  contextData?: any;
  stepInfo?: string;
  loading?: boolean;
  warning?: {
    message: string;
    linkUrl: string;
    linkText: string;
  } | null;
}

export function TradeLicenseInputScreen({ onSubmitNumber, onUploadComplete, contextData, stepInfo, loading, warning }: TradeLicenseInputScreenProps) {
  const [leiNumber, setLeiNumber] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  if (loading) {
    return null;
  }

  if (isHelpOpen) {
    return <HelpChat isOpen={true} onToggle={() => setIsHelpOpen(false)} contextData={contextData} stepInfo={stepInfo} />;
  }

  const handleSubmitNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (leiNumber.trim()) {
      onSubmitNumber(leiNumber);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelection(file);
  };

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onUploadComplete(file);
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelection(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setIsUploading(false);
  };

  return (
    <div className="animate-slide-up space-y-5">
      {/* License Number Input */}
      <form onSubmit={handleSubmitNumber} className="flex gap-3">
        <Input
          type="text"
          value={leiNumber}
          onChange={(e) => setLeiNumber(e.target.value)}
          placeholder="Enter Legal Entity Identifier (LEI)"
          className="flex-1 h-12 text-base px-4"
        />
        <Button type="submit" size="lg" disabled={!leiNumber.trim()} className="px-6">
          Verify
        </Button>
      </form>

      {/* OR Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground font-medium">OR</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* File Upload */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload
            className={cn(
              "w-8 h-8 mx-auto mb-2",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          <p className="text-sm font-medium text-foreground">
            Upload LEI document
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag & drop or click to browse
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isUploading ? "bg-muted" : "bg-success/10"
              )}
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {isUploading ? "Uploading..." : `${(selectedFile.size / 1024).toFixed(1)} KB`}
              </p>
            </div>
            {!isUploading && (
              <button
                onClick={clearFile}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}
      <HelpChat isOpen={false} onToggle={() => setIsHelpOpen(true)} contextData={contextData} stepInfo={stepInfo} />

      {warning && (
        <div className="animate-slide-up p-4 bg-card border border-destructive rounded-lg shadow-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-destructive"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                {warning.message}
              </p>
              <Button
                variant="outline"
                className="bg-card w-full justify-center border-border hover:bg-accent hover:text-accent-foreground"
                onClick={() => window.open(warning.linkUrl, '_blank')}
              >
                {warning.linkText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
