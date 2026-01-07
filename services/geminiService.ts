
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, DietaryRestriction, InventoryItem, MealPlanDay } from "../types";

const cleanText = (text: string) => text.replace(/[*#_~]/g, '').trim();

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
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
          { text: "Identifikasi semua bahan makanan yang terlihat di foto ini. Pisahkan dengan koma. Jika bukan gambar makanan, balas dengan NOT_FOOD." }
        ] 
      }
    });
    const responseText = response.text || "";
    const text = responseText.toUpperCase();
    if (text.includes("NOT_FOOD")) return ["__INVALID_IMAGE__"];
    return responseText.toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 2);
  } catch (e) { return []; }
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
    return JSON.parse(response.text || "[]").map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      ...item,
      addedDate: new Date().toISOString(),
      freshness: Math.min(100, (item.daysRemaining / 10) * 100)
    }));
  } catch (e) { return []; }
};

export const generateMealPlan = async (inventory: InventoryItem[]): Promise<MealPlanDay[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const expiringSoon = [...inventory].sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5).map(i => i.name);
  
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
  
  const systemPrompt = `Kamu adalah koki ahli. Buat 4 resep untuk diet ${restriction} menggunakan bahan: ${ingredients.join(', ')}. 
  INSTRUKSI HARUS SANGAT DETAIL (PECAH MENJADI BANYAK LANGKAH KECIL, MISAL 10+ LANGKAH):
  1. Sertakan ukuran api (misal: api kecil, sedang, atau besar).
  2. Gunakan takaran presisi dalam gram (gr) atau mililiter (ml).
  3. Berikan durasi waktu memasak yang tepat dalam menit di SETIAP langkah.
  4. Jelaskan urutan memasak bumbu secara spesifik (contoh: "Masukkan 5gr garam, lalu 2gr micin, baru 3gr gula").
  Sediakan output dalam JSON untuk Bahasa Indonesia (ID) dan English (EN).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemPrompt,
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
              ingredientsID: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } } 
                } 
              },
              ingredientsEN: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } } 
                } 
              },
              instructionsID: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructionsEN: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) { return []; }
};

export const generateRecipeImage = async (title: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `High-end food photography of ${title}, appetizing, 4k.` }] }
    });
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {}
  return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800`;
};

export const speakText = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText(text) }] }],
      config: { 
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) return;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (e) {}
}
