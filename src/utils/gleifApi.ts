
export interface LeiDetails {
    lei: string;
    legalName: string;
    registeredAt: string;
    legalForm: string;
}

import { getElfName } from "./elfCodes";

interface GleifResponse {
    data: Array<{
        attributes: {
            lei: string;
            entity: {
                legalName: {
                    name: string;
                };
                legalAddress: {
                    city: string;
                    country: string;
                    region?: string;
                };
                legalForm: {
                    id: string;
                    other?: string;
                };
            };
        };
    }>;
}

function getRegionName(code: string): string {
    // Simple mapping for common US states if needed, or just return the code.
    // The API returns ISO codes like "US-DE".
    return code;
}

export const fetchLeiDetails = async (lei: string): Promise<LeiDetails | null> => {
    try {
        const response = await fetch(`https://api.gleif.org/api/v1/lei-records?filter[lei]=${lei}`);

        if (!response.ok) {
            console.error("GLEIF API Error:", response.statusText);
            return null;
        }

        const json: GleifResponse = await response.json();

        if (!json.data || json.data.length === 0) {
            return null;
        }

        const attributes = json.data[0].attributes;
        const entity = attributes.entity;

        const addressParts = [
            entity.legalAddress.city,
            entity.legalAddress.region,
            entity.legalAddress.country
        ].filter(Boolean);

        return {
            lei: attributes.lei,
            legalName: entity.legalName.name,
            registeredAt: addressParts.join(", "),
            legalForm: getElfName(entity.legalForm.id) // Transforming code to "Name (Code)"
        };
    } catch (error) {
        console.error("Failed to fetch LEI details:", error);
        return null;
    }
};
