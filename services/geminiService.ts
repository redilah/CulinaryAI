
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, DietaryRestriction, InventoryItem, MealPlanDay } from "../types";

const cleanText = (text: string) => text.replace(/[*#_~]/g, '').trim();

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const analyzeFridgeImage = async (base64Image: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Analyze this image. If it is clearly NOT food or a fridge (e.g., a car, a landscape, a building), respond with 'NOT_FOOD'. Otherwise, identify all food items and ingredients visible. List them clearly, separated by commas. Indonesian or English names are fine." }
        ]
      },
      config: { temperature: 0.1 }
    });

    const text = cleanText(response.text || "").toUpperCase().replace(/\s/g, '');
    if (text === "NOT_FOOD" || text === "NOTFOOD") {
      return ["__INVALID_IMAGE__"];
    }
    
    const result = response.text.toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 2 && isNaN(Number(s)));
    return result.length > 0 ? result : ["__INVALID_IMAGE__"];
  } catch (error) {
    console.error("Analysis error:", error);
    return [];
  }
};

export const estimateInventory = async (ingredients: string[]): Promise<InventoryItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `For these ingredients: ${ingredients.join(', ')}. 
  Estimate their typical shelf life in a fridge. 
  Return JSON array of InventoryItem objects with name, category (Produce, Dairy, Meat, Pantry, Others), and daysRemaining.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              daysRemaining: { type: Type.NUMBER }
            }
          }
        }
      }
    });
    const data = JSON.parse(response.text || "[]");
    return data.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      ...item,
      addedDate: new Date().toISOString(),
      freshness: Math.min(100, (item.daysRemaining / 10) * 100)
    }));
  } catch (e) { return []; }
};

export const generateMealPlan = async (inventory: InventoryItem[]): Promise<MealPlanDay[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const expiringSoon = inventory.sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5).map(i => i.name);
  
  const prompt = `Create a 3-day meal plan using these expiring items: ${expiringSoon.join(', ')}. 
  For each day provide breakfast, lunch, dinner and the reason why this menu is chosen (mention the ingredient being saved). Indonesian Language.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              breakfast: { type: Type.STRING },
              lunch: { type: Type.STRING },
              dinner: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) { return []; }
};

export const generateRecipes = async (ingredients: string[], restriction: DietaryRestriction): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Based on: ${ingredients.join(', ')}. Create 4 recipes for ${restriction} diet. 
  Instructions MUST be HYPER-DETAILED (api sedang, gr, ml, menit, garam->micin->gula).
  Return JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] },
              prepTime: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } }
                }
              },
              instructionsID: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructionsEN: { type: Type.ARRAY, items: { type: Type.STRING } },
              imageUrl: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) { return []; }
};

export const speakText = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText(text) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) return;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decode(audioBase64), audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (err) {}
};

export const generateRecipeImage = async (recipeTitle: string, description: string): Promise<string> => {
  const fallbackUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop&sig=${encodeURIComponent(recipeTitle)}`;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional appetizing food photography of the dish "${recipeTitle}". High resolution, close up shot, warm lighting.` }],
      },
      config: { imageConfig: { aspectRatio: "4:3" } },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.warn("Image generation failed or limit reached, using fallback.", error);
  }
  return fallbackUrl;
};
