import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export const extractIdentityDocumentData = async (file: File) => {
    try {
        if (!API_KEY) {
            alert("VITE_GEMINI_API_KEY is missing! Please check your .env file and restart the server.");
            throw new Error("Missing API Key");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const base64Data = await fileToGenerativePart(file);

        const prompt = `
      Analyze this image of an Identity Document(US SSN Card or Passport).
      extract the following information:
        - fullName: The full legal name visible on the document.
      - idNumber: The SSN(XXX - XX - XXXX) or Passport Number.
      - nationality: Country of issue(e.g., USA).
      - dateOfBirth: Date of Birth(DD / MM / YYYY).
      - expiryDate: Expiry Date(DD / MM / YYYY).If not present(like on SSN), return null.
      - documentType: "ssn" or "passport".
      - isValidId: set to true if this looks like a valid government ID.

      Return the result as a raw JSON object.Do not use markdown code blocks.
    `;

        console.log("Using model: gemini-2.0-flash-exp");
        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        const text = response.text();
        console.log("Gemini Raw Response:", text);

        return parseGeminiResponse(text);
    } catch (error) {
        console.error("Gemini Extraction Error:", error);
        throw error;
    }
};

export const extractAllTradeLicenseData = async (file: File) => {
    try {
        if (!API_KEY) throw new Error("Missing API Key");
        const base64Data = await fileToGenerativePart(file);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      Analyze this Trade License document and extract the following information into a strict JSON format.
      If a field is not found or unclear, return null. 
      Do NOT wrap the JSON in markdown code blocks.
      
      Fields to extract:
        - businessName(string): The name of the business(e.g., "Tech Solutions LLC")
            - licenseNumber(string): The license number
                - issuingAuthority(string): The authority that issued the license(e.g., "Dubai Economic Department")
                    - legalType(string): The legal structure(e.g., "Limited Liability Company")
                        - activities(array of strings): List of business activities
                            - expiryDate(string): The expiration date(e.g., "2025-12-31")
                                `;

        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        return parseGeminiResponse(response.text());
    } catch (error) {
        console.error("Error extracting trade license data:", error);
        throw error;
    }
};

export const extractFreelancerPermitData = async (file: File) => {
    try {
        if (!API_KEY) throw new Error("Missing API Key");
        const base64Data = await fileToGenerativePart(file);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      Analyze this Freelancer Permit document and extract the following information into a strict JSON format.
      If a field is not found or unclear, return null. 
      Do NOT wrap the JSON in markdown code blocks.
      
      Fields to extract:
        - fullName(string): The full name of the freelancer
            - permitNumber(string): The permit number
                - issuingAuthority(string): The authority extracted from the top or title(e.g., "GDRFA", "DCCA")
                    - activity(string): The freelance activity or designation
                        - expiryDate(string): The expiration date
                            `;

        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        return parseGeminiResponse(response.text());
    } catch (error) {
        console.error("Error extracting freelancer permit data:", error);
        throw error;
    }
};

export const extractMOAData = async (file: File) => {
    try {
        if (!API_KEY) throw new Error("Missing API Key");
        const base64Data = await fileToGenerativePart(file);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      Analyze this Memorandum of Association(MOA) and extract the following:
        1. The shareholders and their ownership stakes.
      2. Check if the document contains the word "notarized" or "attested" or has official stamps / signatures indicating it has been attested by a registrar.
      
      Return the output as a strict JSON object with these keys:
        - shareholders(array of objects): Each with:
        - name(string): Full name of the shareholder
            - nationality(string): Nationality of the shareholder
                - ownership(string): Ownership percentage(e.g. "51%", "49%")
                    - isNotarized(boolean): true if the document contains the word "notarized"(case insensitive) or "attested" or has clear signs of official registrar attestation, else false.
    `;

        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        return parseGeminiResponse(response.text());
    } catch (error) {
        console.error("Error extracting MOA data:", error);
        throw error;
    }
};

export const extractPOAData = async (file: File) => {
    try {
        if (!API_KEY) throw new Error("Missing API Key");
        const base64Data = await fileToGenerativePart(file);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      Analyze this Power of Attorney(POA) document and extract the following details into a strict JSON format.
      - grantedBy(string): Name of person / entity granting the power
            - grantedTo(string): Name of person receiving the power
                - scope(string): Brief description of the scope(e.g. "Full Banking Authority")
                    - dateIssued(string): DD / MM / YYYY
                        - expiryDate(string): DD / MM / YYYY
                            - notarized(boolean): true if notarized / stamped, else false
      
      If a field is not found, return null or empty string.
    `;

        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        return parseGeminiResponse(response.text());
    } catch (error) {
        console.error("Error extracting POA data:", error);
        throw error;
    }
};

export const extractBylawsData = async (file: File) => {
    try {
        if (!API_KEY) throw new Error("Missing API Key");
        const base64Data = await fileToGenerativePart(file);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      Analyze this corporate Bylaws document and extract the following into a strict JSON format:
      1. officers: An array of strings containing the full names of all officers, directors, or authorized signatories mentioned.
      2. dateAdopted: The date the bylaws were adopted or signed (DD/MM/YYYY).
      3. businessName: The official name of the corporation mentioned in the document.

      If a field is not found, return null. 
      Do NOT wrap the JSON in markdown code blocks.
    `;

        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        return parseGeminiResponse(response.text());
    } catch (error) {
        console.error("Error extracting Bylaws data:", error);
        throw error;
    }
};

// Helper to parse leniently
function parseGeminiResponse(text: string) {
    const jsonStr = text.replace(/```json\n ?|\n ? ```/g, "").trim();
    const startIndex = jsonStr.indexOf('{');
    const endIndex = jsonStr.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1) {
        return JSON.parse(jsonStr.substring(startIndex, endIndex + 1));
    }
    return JSON.parse(jsonStr);
}

async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64String = result.split(",")[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
