import { GoogleGenAI } from "@google/genai";
import { Invoice, Appointment } from '../types';

// Using the API key from environment variables is best practice for Vercel
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketingMessage = async (customerName: string, serviceName: string): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `Write a short, friendly, and professional WhatsApp message for a salon customer named ${customerName} who just had a ${serviceName}. 
    Ask them for a review and offer a 10% discount on their next visit. Keep it under 50 words. include emojis.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Thank you for visiting! We'd love your feedback.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Hi ${customerName}, thanks for choosing us for your ${serviceName}! We hope to see you again soon.`;
  }
};

export const generateBusinessInsights = async (invoices: Invoice[], appointments: Appointment[]): Promise<string> => {
  try {
    const totalRev = invoices.reduce((acc, curr) => acc + curr.total, 0);
    const count = appointments.length;
    
    const prompt = `Act as a business analyst for a Salon. 
    Here is the data: Total Revenue: ${totalRev}, Total Appointments: ${count}.
    Provide 3 bullet points of short, actionable advice to increase revenue next month. 
    Keep it strictly professional and concise.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analyze peak hours to optimize staff scheduling.";
  } catch (error) {
    return "Focus on customer retention and upselling high-margin services.";
  }
};

export const analyzeCustomerFace = async (base64Image: string): Promise<any> => {
  try {
    // Robust Base64 extraction to handle data URLs properly
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/jpeg';
    const data = matches ? matches[2] : base64Image;

    const prompt = `
      Analyze this image of a salon customer. 
      Identify:
      1. Face Shape (e.g., Oval, Round, Square)
      2. Skin Tone/Complexion
      3. Approximate Age Group
      4. Hair Type/Texture (if visible)
      
      Based on these features, recommend 3 specific salon services (haircuts, facials, or treatments) that would suit them best.
      
      Return ONLY a JSON object with this structure:
      {
        "faceShape": "string",
        "skinTone": "string",
        "ageGroup": "string",
        "recommendations": [
          { "service": "string", "reason": "string" },
          { "service": "string", "reason": "string" },
          { "service": "string", "reason": "string" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Use the multimodal model for vision analysis
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    // Parse the JSON response
    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    // Fallback mock data if API fails or quota exceeded
    return {
      faceShape: "Oval (Estimated)",
      skinTone: "Medium",
      ageGroup: "25-35",
      recommendations: [
        { service: "Hydrating Facial", reason: "General skin maintenance" },
        { service: "Layered Haircut", reason: "Adds volume to hair" },
        { service: "Manicure", reason: "Standard grooming" }
      ]
    };
  }
};