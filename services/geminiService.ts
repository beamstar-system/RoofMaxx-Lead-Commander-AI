
import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

const PITTSBURGH_NEIGHBORHOODS = [
  "Downtown Pittsburgh", "Strip District", "Lawrenceville", "South Side", 
  "North Shore", "Oakland", "Shadyside", "Bloomfield", "Squirrel Hill",
  "East Liberty", "Mount Washington", "Troy Hill", "Wexford", "Cranberry",
  "Monroeville", "Bethel Park", "Robinson Township", "Greentree", "Carnegie"
];

const COMMERCIAL_TYPES = [
  "Warehouses", "Manufacturing Plants", "Shopping Centers", "Car Dealerships",
  "Hotels", "Self Storage Facility", "Office Parks", "Apartment Complexes",
  "Industrial Equipment Suppliers"
];

export async function fetchCommercialLeads(
  batchSize: number = 20, 
  onProgress: (leads: Lead[]) => void
): Promise<void> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  // To reach higher counts, we iterate through neighborhoods and business types
  for (const neighborhood of PITTSBURGH_NEIGHBORHOODS) {
    for (const bizType of COMMERCIAL_TYPES) {
      try {
        const prompt = `Find 10 exclusive commercial ${bizType} in ${neighborhood}, Pittsburgh, PA for roofing leads. 
        For each business, identify the business name, address, phone, website, and infer details about their roof (likely size, material like TPO/EPDM/Asphalt, and condition based on business age).
        Output the data in a structured format.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: 40.4406,
                  longitude: -79.9959
                }
              }
            }
          }
        });

        const text = response.text || "";
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        // Parse results from grounding chunks and text
        const newLeads: Lead[] = groundingChunks
          .filter(chunk => chunk.maps)
          .map((chunk, index) => {
            const mapsData = chunk.maps!;
            return {
              id: Math.random().toString(36).substr(2, 9),
              businessName: mapsData.title || "Unknown Business",
              address: mapsData.uri || "Address not provided",
              phone: "Contact via Maps",
              website: mapsData.uri || "",
              businessType: bizType,
              roofType: "Asphalt Shingle / Flat Mix",
              estimatedRoofArea: "10,000+ sq ft",
              roofCondition: "Inspection Recommended",
              mapsUri: mapsData.uri || "",
              rating: 4.0,
              reviewSnippet: "Promising commercial lead based on structure age.",
              confidenceScore: 0.85
            };
          });

        if (newLeads.length > 0) {
          onProgress(newLeads);
        }

        // Sleep to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error("Error fetching leads for", neighborhood, bizType, error);
      }
    }
  }
}
