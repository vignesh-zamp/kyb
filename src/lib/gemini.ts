
const API_URL = import.meta.env.VITE_API_URL;

const extractFromBackend = async (file: File, documentType: string) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("document_type", documentType);

        const response = await fetch(`${API_URL}/extract-document-data`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Extraction failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    } catch (error) {
        console.error(`Error extracting ${documentType}:`, error);
        throw error;
    }
};

export const extractIdentityDocumentData = async (file: File) => {
    return extractFromBackend(file, "identity");
};

export const extractAllTradeLicenseData = async (file: File) => {
    return extractFromBackend(file, "trade_license");
};

export const extractFreelancerPermitData = async (file: File) => {
    return extractFromBackend(file, "freelancer_permit");
};

export const extractMOAData = async (file: File) => {
    return extractFromBackend(file, "moa");
};

export const extractPOAData = async (file: File) => {
    return extractFromBackend(file, "poa");
};

export const extractBylawsData = async (file: File) => {
    return extractFromBackend(file, "bylaws");
};
