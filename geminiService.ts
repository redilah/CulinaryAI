
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, DietaryRestriction, InventoryItem, MealPlanDay } from "./types";

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
  Return JSON array of InventoryItem objects with name, category (Produce, Dairy, Meat, Pantry, Others), and days_remaining.`;

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
              days_remaining: { type: Type.NUMBER }
            }
          }
        }
      }
    });
    const result = JSON.parse(response.text || "[]");
    return result.map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: item.name,
      category: item.category,
      daysRemaining: item.days_remaining,
      addedDate: new Date().toISOString(),
      freshness: Math.min(100, (item.days_remaining / 10) * 100)
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
  
  const systemPrompt = `Kamu adalah koki ahli bintang 5. Buat 4 resep lezat untuk diet ${restriction} menggunakan bahan: ${ingredients.join(', ')}. 

WAJIB: INSTRUKSI HARUS SANGAT DETAIL DAN TERPERINCI (Pecah menjadi minimal 10-15 langkah kecil):
1. Setiap langkah WAJIB menyertakan ukuran api secara spesifik (misal: "Gunakan api kecil", "Gunakan api sedang cenderung besar").
2. Setiap langkah WAJIB menyertakan takaran presisi dalam gram (gr) atau mililiter (ml) untuk bumbu dan bahan yang masuk.
3. Setiap langkah WAJIB menyertakan durasi waktu yang sangat tepat dalam menit (misal: "Tumis selama 4 menit sampai bumbu mengeluarkan aroma harum").
4. Untuk bumbu, jelaskan urutan yang sangat spesifik (CONTOH: "Masukkan 6gr garam, aduk selama 20 detik, lalu masukkan 2gr micin, baru terakhir masukkan 4gr gula").
5. Pecah instruksi menjadi langkah-langkah sangat kecil/atomik agar user tidak melewatkan detail sekecil apapun.

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
              prep_time: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              ingredients_id: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } } 
                } 
              },
              ingredients_en: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } } 
                } 
              },
              instructions_id: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions_en: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });
    
    const rawRecipes = JSON.parse(response.text || "[]");
    return rawRecipes.map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      difficulty: r.difficulty,
      prepTime: r.prep_time,
      calories: r.calories,
      ingredientsID: r.ingredients_id,
      ingredientsEN: r.ingredients_en,
      instructionsID: r.instructions_id,
      instructionsEN: r.instructions_en,
      imageUrl: "" // Will be filled by image generator
    }));
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
};
