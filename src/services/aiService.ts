import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || "") as string });

export const extractionSchema = {
  type: Type.OBJECT,
  properties: {
    functionalRequirements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Statements describing system features or what the system should do."
    },
    nonFunctionalRequirements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Statements describing performance, security, usability, scalability, or quality constraints."
    },
    stakeholders: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Names, roles, or participants mentioned in the text."
    },
    deadlines: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific dates or relative timeline mentions (e.g., 'by June', 'next week')."
    },
    decisions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Statements indicating finalization, agreements, or choices made."
    },
    risks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Concerns, uncertainties, potential delays, or conflicts identified."
    },
    assumptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Implicit project expectations or things taken for granted."
    }
  },
  required: [
    "functionalRequirements", 
    "nonFunctionalRequirements", 
    "stakeholders", 
    "deadlines", 
    "decisions", 
    "risks", 
    "assumptions"
  ]
};

export async function extractInsights(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following project data and extract structured business insights. 
      Focus on requirements, stakeholders, timelines, decisions, risks, and assumptions.
      
      TEXT TO ANALYZE:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Extraction Error:", error);
    throw error;
  }
}
