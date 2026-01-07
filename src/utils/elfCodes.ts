
export const ELF_CODES: Record<string, string> = {
    "XTIQ": "Corporation",
    "T91T": "Limited Partnership", // Based on previous observation of 5493001KJTIIGC8Y1R12
    "9999": "Other",
    "8888": "In Error",
    "H0PO": "Limited Liability Company", // Common US LLC
    "Q7L8": "Limited Liability Company", // Another common one
    "B6ES": "Public Limited Company",
    "54M6": "Private Limited Company",
};

export const getElfName = (code: string): string => {
    const name = ELF_CODES[code];
    return name ? `${name} (${code})` : code;
};
