
import { GoogleGenAI } from "@google/genai";

// Strictly follow the recommended initialization pattern using only process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMaintenanceAdvice = async (machineData: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this vending machine hardware data and provide maintenance advice: ${JSON.stringify(machineData)}. Identify potential issues with LB-140 board or Raspberry Pi 4 environment. Keep it concise.`,
  });
  return response.text;
};

export const getInventoryOptimization = async (fleetData: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Based on this fleet performance data, suggest 3 products to restock aggressively and 2 to swap out: ${JSON.stringify(fleetData)}. Focus on revenue maximization.`,
  });
  return response.text;
};

export const getSystemProvisioningScript = async (config: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a Linux shell script (bash) for a Raspberry Pi 4 Kiosk. 
    Machine ID: ${config.machineId}. 
    Screen: ${config.display}. 
    Requirement: Auto-boot Chromium to Kiosk mode, install LB-140 serial drivers, and setup wellness UI. 
    Keep it technical and usable. Return only the code block.`,
  });
  return response.text;
};

export const getCustomerSupportChat = async (userMessage: string, availableProducts: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: userMessage,
    config: {
      systemInstruction: `You are a helpful vending machine assistant on a 32-inch touchscreen. Help the customer find products or troubleshoot payment issues. Available products: ${availableProducts}. Be friendly and use short sentences.`
    }
  });
  return response.text;
};
